#!/usr/bin/env python3
"""Create a tool-grounded cooking report from a JSON config using only Python's standard library."""

from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "cooking-catalog.json"
DEFAULT_CONFIG = ROOT / "config" / "default_config.json"


def load_dotenv(path: Path) -> None:
    """Load local project secrets for this CLI; never print secrets."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ[key] = value


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise SystemExit(f"找不到配置文件：{path}") from error
    except json.JSONDecodeError as error:
        raise SystemExit(f"配置文件不是有效 JSON：{error}") from error


def language(value: Any, fallback: str = "zh") -> str:
    return "en" if value == "en" else "zh" if value == "zh" else fallback


def resolve_items(
    values: list[Any], catalog: dict[str, Any], input_language: str
) -> tuple[list[str], list[str]]:
    names: dict[str, dict[str, str]] = catalog["names"]
    lookup: dict[str, str] = {}
    for item_id, item in names.items():
        lookup[item_id.lower()] = item_id
        lookup[item[input_language].lower()] = item_id
    ids: list[str] = []
    unknown: list[str] = []
    for value in values:
        if not isinstance(value, str):
            continue
        item_id = lookup.get(value.strip().lower())
        if item_id and item_id not in ids:
            ids.append(item_id)
        elif value.strip():
            unknown.append(value.strip())
    return ids, unknown


def score_target(recipe: dict[str, Any], target: str) -> int:
    normalized = target.strip().lower()
    if not normalized:
        return 0
    if normalized in {recipe["zh"].lower(), recipe["en"].lower()}:
        return 100
    if normalized in recipe["zh"].lower() or normalized in recipe["en"].lower():
        return 80
    return sum(
        token in recipe["zh"].lower() or token in recipe["en"].lower()
        for token in normalized.replace("，", " ").replace("、", " ").split()
    )


def tool_report(config: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    locale = language(config.get("language"), language(config.get("locale")))
    ingredient_ids, unknown_ingredients = resolve_items(
        config.get("ingredients", []), catalog, locale
    )
    seasoning_ids, unknown_seasonings = resolve_items(
        config.get("seasonings", []), catalog, locale
    )
    selected_ids = list(dict.fromkeys([*ingredient_ids, *seasoning_ids]))
    selected = set(selected_ids)
    target = str(config.get("target_dish", ""))
    time_minutes = max(0, min(240, int(config.get("time_minutes", 0) or 0)))
    servings = max(1, min(8, int(config.get("servings", 1) or 1)))
    equipment = {
        item for item in config.get("equipment", []) if isinstance(item, str)
    }
    required_equipment = {"induction_hob", "frying_pan"}
    missing_equipment = sorted(required_equipment - equipment)
    max_heat = max(1, min(9, int(config.get("max_induction_level", 9) or 9)))
    names: dict[str, dict[str, str]] = catalog["names"]
    label = lambda item_id: names.get(item_id, {}).get(locale, item_id)
    ranked = []
    for recipe in catalog["recipes"]:
        missing_ingredients = [item for item in recipe["essential"] if item not in selected]
        missing_seasonings = [item for item in recipe["requiredSeasonings"] if item not in selected]
        ranked.append(
            {
                "recipe": recipe,
                "match": score_target(recipe, target),
                "missing_ingredients": missing_ingredients,
                "missing_seasonings": missing_seasonings,
                "completeness": len(recipe["essential"]) - len(missing_ingredients),
                "peak_heat": max(
                    [int(value) for value in recipe["heat"] if value.isdigit()], default=1
                ),
            }
        )
    ranked.sort(
        key=lambda item: (
            -item["match"],
            -item["completeness"],
            len(item["missing_seasonings"]),
            item["recipe"]["minutes"],
        )
    )
    choice = ranked[0]
    recipe = choice["recipe"]
    missing = choice["missing_ingredients"] + choice["missing_seasonings"]
    time_fits = not time_minutes or recipe["minutes"] <= time_minutes
    heat_fits = choice["peak_heat"] <= max_heat
    allow_extra_purchase = bool(config.get("allow_extra_purchase", False))
    status = (
        "needs_purchase"
        if missing and not missing_equipment and allow_extra_purchase
        else "missing_requirements"
        if missing or missing_equipment
        else "insufficient_time"
        if not time_fits
        else "heat_limit"
        if not heat_fits
        else "ready"
    )
    ready_alternatives = [
        {
            "name": item["recipe"][locale],
            "minutes": item["recipe"]["minutes"],
            "heat": item["recipe"]["heat"],
        }
        for item in ranked
        if item["recipe"]["id"] != recipe["id"]
        and not item["missing_ingredients"]
        and not item["missing_seasonings"]
        and not missing_equipment
        and item["peak_heat"] <= max_heat
        and (not time_minutes or item["recipe"]["minutes"] <= time_minutes)
    ][:2]
    return {
        "tool": "recipe_catalog_and_pantry_check",
        "language": locale,
        "selectedIngredients": [label(item) for item in ingredient_ids],
        "selectedSeasonings": [label(item) for item in seasoning_ids],
        "targetMatched": choice["match"] >= 80,
        "candidate": {"id": recipe["id"], "name": recipe[locale]},
        "status": status,
        "availableMinutes": time_minutes or None,
        "recipeMinutes": recipe["minutes"],
        "servings": servings,
        "requiredEquipment": sorted(required_equipment),
        "missingEquipment": missing_equipment,
        "maxInductionLevel": max_heat,
        "recipePeakInductionLevel": choice["peak_heat"],
        "allowExtraPurchase": allow_extra_purchase,
        "requiredIngredients": [label(item) for item in recipe["essential"]],
        "requiredSeasonings": [label(item) for item in recipe["requiredSeasonings"]],
        "missingIngredients": [label(item) for item in choice["missing_ingredients"]],
        "missingSeasonings": [label(item) for item in choice["missing_seasonings"]],
        "unknownIngredients": unknown_ingredients,
        "unknownSeasonings": unknown_seasonings,
        "inductionHeatRoute": recipe["heat"],
        "safetyBaseline": recipe["safety"][locale],
        "readyAlternatives": ready_alternatives,
    }


def post_json(url: str, headers: dict[str, str], body: dict[str, Any]) -> dict[str, Any]:
    request = Request(
        url,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"content-type": "application/json", **headers},
        method="POST",
    )
    try:
        # Some macOS Python installations omit their CA bundle. Prefer the
        # system bundle when present while keeping certificate verification on.
        ca_file = os.environ.get("SSL_CERT_FILE")
        if not ca_file and Path("/etc/ssl/cert.pem").exists():
            ca_file = "/etc/ssl/cert.pem"
        context = ssl.create_default_context(cafile=ca_file)
        with urlopen(request, timeout=60, context=context) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:400]
        raise SystemExit(f"模型请求失败（HTTP {error.code}）：{detail}") from error
    except URLError as error:
        raise SystemExit(f"无法连接模型服务：{error.reason}") from error


def ask_model(config: dict[str, Any], report: dict[str, Any]) -> str:
    locale = language(config.get("language"), language(config.get("locale")))
    provider = str(config.get("model_provider", config.get("provider", "deepseek"))).lower()
    provider = "openai" if provider == "chatgpt" else provider
    if locale == "zh":
        system = """你是食知的本地烹饪计划 Agent。可信工具报告由菜谱库检索、食材和佐料核对、时间规划程序生成，必须视为事实。不得把缺少项说成已拥有；不得使用未列出水、调料、设备。status 为 missing_requirements、needs_purchase、insufficient_time 或 heat_limit 时，先说明无法按原条件完成；needs_purchase 只能列出工具报告中的最低购买项，heat_limit 不得建议超过 maxInductionLevel。只有 readyAlternatives 中的菜可给完整替代步骤；为空时只列最低缺少项。火力只用电磁炉1–9档，禁止瓦数。skill_level 为 beginner 时，把切配、下锅和观察到的结束状态写得更细；其他等级可更简洁，但不得省略安全步骤。输出标题：可做程度、缺少/可选补充、时间计划、电磁炉档位、食品安全、营养建议。"""
        request_text = f"目标菜：{config.get('target_dish', '')}\n人数：{config.get('servings', 1)}\n熟练度：{config.get('skill_level', 'beginner')}\n限制：{config.get('preference', '无')}\n可信工具报告：\n{json.dumps(report, ensure_ascii=False)}"
    else:
        system = """You are Shizhi's local cooking-planning agent. The trusted tool report is factual: never claim missing items are available and never use unlisted water, seasonings, or appliances. If status is missing_requirements, needs_purchase, insufficient_time, or heat_limit, explain that first. For needs_purchase, list only the tool-reported minimum purchases; for heat_limit, never recommend a setting above maxInductionLevel. Only give full alternative steps for dishes in readyAlternatives. Use induction levels 1–9, never wattage. When skill_level is beginner, make cutting, pan-entry, and visible stop conditions more explicit; never omit safety steps at any level. Use headings: Feasibility, Missing / optional extras, Timeline, Induction levels, Food safety, Nutrition."""
        request_text = f"Target dish: {config.get('target_dish', '')}\nServings: {config.get('servings', 1)}\nSkill level: {config.get('skill_level', 'beginner')}\nConstraints: {config.get('preference', 'none')}\nTrusted tool report:\n{json.dumps(report, ensure_ascii=False)}"

    if provider == "deepseek":
        key = os.environ.get("DEEPSEEK_API_KEY")
        if not key:
            raise SystemExit("缺少 DEEPSEEK_API_KEY；请放在 .env，不要写进配置文件。")
        data = post_json(
            "https://api.deepseek.com/chat/completions",
            {"Authorization": f"Bearer {key}"},
            {
                "model": config.get("model") or "deepseek-v4-flash",
                "thinking": {"type": "disabled"},
                "temperature": 0.2,
                "max_tokens": 900,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": request_text}],
            },
        )
        return data["choices"][0]["message"]["content"].strip()

    if provider == "gemini":
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            raise SystemExit("缺少 GEMINI_API_KEY；请放在 .env，不要写进配置文件。")
        model = config.get("model") or "gemini-3.5-flash-lite"
        data = post_json(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            {"x-goog-api-key": key},
            {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": request_text}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 900},
            },
        )
        return "".join(part.get("text", "") for part in data["candidates"][0]["content"]["parts"]).strip()

    if provider == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise SystemExit("缺少 OPENAI_API_KEY；请放在 .env，不要写进配置文件。")
        data = post_json(
            "https://api.openai.com/v1/chat/completions",
            {"Authorization": f"Bearer {key}"},
            {
                "model": config.get("model") or "gpt-4o-mini",
                "temperature": 0.2,
                "max_tokens": 900,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": request_text}],
            },
        )
        return data["choices"][0]["message"]["content"].strip()

    raise SystemExit("model_provider 仅支持 deepseek、openai（或 chatgpt）和 gemini。")


def main() -> None:
    parser = argparse.ArgumentParser(description="用菜谱工具与 AI 生成本地烹饪计划")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="JSON 配置文件路径")
    parser.add_argument("--dry-run", action="store_true", help="只显示确定性预检，不调用模型")
    parser.add_argument("--output", type=Path, help="将报告另存为 Markdown 文件")
    args = parser.parse_args()
    config = read_json(args.config)
    catalog = read_json(CATALOG_PATH)
    load_dotenv(ROOT / ".env")
    report = tool_report(config, catalog)
    preflight = json.dumps(report, ensure_ascii=False, indent=2)
    if args.dry_run:
        print(preflight)
        return
    answer = ask_model(config, report)
    result = f"# 食知烹饪计划\n\n## 工具预检\n```json\n{preflight}\n```\n\n## AI 推荐报告\n\n{answer}\n"
    print(result)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result, encoding="utf-8")


if __name__ == "__main__":
    main()
