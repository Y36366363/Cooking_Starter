# Shizhi Cooking Agent

[中文说明](#食知-cooking-agent) · [Live demo](https://y36366363.github.io/Cooking_Starter/)

**Shizhi** is an agent-first, bilingual cooking assistant for people learning to cook with an induction hob—especially international students making Chinese home cooking abroad. It turns a pantry, available time, equipment, and cooking confidence into an honest, practical plan rather than a generic recipe response.

The project is built around induction-hob operation: every recipe uses visible **levels 1–9**, never vague wattage. It supports English and Chinese throughout the pantry, recipes, and reports.

## Why an agent, not just a recipe chatbot?

A general chat model can write appealing instructions, but it may assume that you have oil, salt, a pan, enough time, or a suitable heat setting. Shizhi puts a deterministic cooking workflow in front of the language model:

1. **Retrieve** a candidate from the maintained recipe catalog.
2. **Check** essential ingredients, required seasonings, and recognised equipment against the user’s actual pantry.
3. **Plan** around servings, available minutes, and the maximum induction level available.
4. **Explain** the verified result with an LLM, using step-by-step instructions, safety notes, and nutrition guidance.

The LLM receives this trusted report as a constraint. If a required item is missing, time is too short, or the hob cannot reach the needed setting, the agent must say so first. It cannot invent water, seasonings, appliances, or an unverified alternative. This is the core difference between Shizhi and a prompt-only cooking assistant.

## What it can do today

- Switch prominently between English and Chinese.
- Search recipes and compare them with the selected ingredients and seasonings.
- Use a collapsible bilingual pantry with validated autocomplete, so irrelevant items cannot be added.
- Show recipe difficulty, cooking time, required ingredients, optional add-ins, required/recommended seasonings, images, and detailed induction-hob instructions.
- Present 12 beginner-friendly recipes, with kitchen-tested home dishes placed first.
- Build an agent cooking plan from a target dish, ingredients, seasonings, servings, time, and constraints.
- Produce deterministic feasibility checks: missing items, equipment requirements, time limits, heat limits, and safe ready-to-cook alternatives.
- Offer a protected server-side LLM endpoint using DeepSeek, ChatGPT/OpenAI, or Gemini.
- Let visitors draft recipe submissions for review when a server database is connected.

The first kitchen-tested recipes include Tomato & Egg Stir-fry, Pepper with Minced Pork, Pepper Pork Stir-fry, Cucumber with Minced Pork, Bok Choy dishes, and Induction Fried Egg.

## Public demo and deployment modes

The public [GitHub Pages demo](https://y36366363.github.io/Cooking_Starter/) is intentionally static. Recipe browsing, ingredient matching, language switching, and recipe details work publicly. The agent panel clearly runs in demo mode there: no API key is included in the browser and no external model cost can be triggered from the static site.

For real AI conversations and guest-submission storage, deploy the server build to a runtime that supports `/api/agent` and `/api/submissions`. API keys stay only on that server. They are never returned to the browser, embedded in the static build, committed to Git, or supplied to the model as user content.

## Server-side agent configuration

Set only the provider you intend to use in the server environment:

```text
DEEPSEEK_API_KEY=server-only-key
DEEPSEEK_MODEL=deepseek-v4-flash

GEMINI_API_KEY=server-only-key
GEMINI_MODEL=gemini-3.5-flash-lite

OPENAI_API_KEY=server-only-key
OPENAI_MODEL=gpt-4o-mini

COOKING_AGENT_PROVIDER=deepseek  # deepseek | gemini | chatgpt (or openai)
COOKING_AGENT_ACCESS_CODE=visitor-access-code
COOKING_AGENT_ADMIN_CODE=long-private-admin-code
```

The visitor code is checked by the server and is not passed to a model. The basic in-memory limit is five requests per hour for a visitor code; the administrator code is unlimited. For a multi-instance production deployment, move rate-limit state to shared storage such as Cloudflare KV or D1.

## Local agent: one configuration, one command

Edit [`config/default_config.json`](config/default_config.json), then run the local planner. Keep API keys in the ignored `.env` file—never in this JSON file.

```bash
# Free preflight: recipe retrieval, pantry check, equipment/time/heat validation
python3 scripts/cooking_plan.py --dry-run

# Ask the chosen model to turn the verified result into a Markdown cooking report
python3 scripts/cooking_plan.py

# Save the report
python3 scripts/cooking_plan.py --output reports/today-plan.md
```

| Field | Purpose |
| --- | --- |
| `language` | The sole language setting. `en` accepts English pantry names and returns an English report; `zh` does the same in Chinese. |
| `model_provider` | `deepseek`, `chatgpt` (or `openai`), or `gemini`. |
| `model` | Model name for the chosen provider. |
| `ingredients` / `seasonings` | Kept separate so missing essentials and missing seasonings are reported accurately. |
| `target_dish`, `time_minutes`, `servings`, `preference` | The cooking goal and constraints. |
| `skill_level` | `beginner` produces more explicit cutting, pan-entry, and visible stop conditions. |
| `equipment` | Declares available equipment, for example `induction_hob` and `frying_pan`. |
| `max_induction_level` | Prevents plans that need a higher hob setting than the user can use. |
| `allow_extra_purchase` | When enabled, the agent can provide the minimum verified shopping list before cooking. |

```json
{
  "language": "en",
  "model_provider": "deepseek",
  "model": "deepseek-v4-flash",
  "target_dish": "Tomato & Egg Stir-fry",
  "ingredients": ["Tomato", "Egg"],
  "seasonings": ["Cooking oil", "Salt"],
  "time_minutes": 20,
  "servings": 1,
  "skill_level": "beginner",
  "equipment": ["induction_hob", "frying_pan"],
  "max_induction_level": 9,
  "allow_extra_purchase": false
}
```

## Run the web app locally

Node.js 22.13+ and pnpm are required.

```bash
pnpm install
pnpm dev
pnpm build
```

## Technology

- React 19 + TypeScript
- Vinext / Vite
- Tailwind CSS and shadcn UI primitives
- Shared JSON recipe catalog used by the browser, server agent, and local Python planner
- Cloudflare Workers + D1 for the optional server-side review queue
- GitHub Actions + GitHub Pages for the public static preview

## Roadmap

- More editable recipes, ingredient quantities, and user-tested notes
- Gas-stove mode alongside induction-hob guidance
- Dietary, allergy, budget, and nutrition-aware recipe filtering
- Guided cooking sessions with timers and step checklists
- Reviewed community recipes and safe submission notifications

---

# 食知 Cooking Agent

[English](#shizhi-cooking-agent) · [公开演示网页](https://y36366363.github.io/Cooking_Starter/)

**食知**是一个以 Agent 为主体的中英双语烹饪助手，重点服务用电磁炉做饭的留学生和中餐初学者。它不会只生成一段泛泛的菜谱文字，而是根据你实际拥有的食材、佐料、设备、时间和熟练度，给出可执行且诚实的烹饪计划。

本项目用直观的电磁炉 **1–9 档** 取代模糊的“中火 / 大火”或瓦数说明，并从简单的中式家常菜开始构建菜谱库。

## 为什么要做成 Agent，而不是普通菜谱聊天机器人？

通用聊天模型很容易默认用户有油、盐、水、炒锅，或默认时间和火力足够；即使文字看起来合理，实际操作仍可能失败。食知在模型回答前先执行确定性的工具流程：

1. **检索**维护好的菜谱库，找出目标菜候选。
2. **核对**现有食材、必需佐料和已声明设备。
3. **规划**人数、可用时间和设备最高电磁炉档位。
4. **解释**已验证的结果，由模型生成清晰步骤、安全提醒和营养建议。

模型只能在这份可信工具报告的范围内回答：缺料、时间不足或火力上限不足时，必须先说明原目标不可直接完成；不能凭空补出水、调料、厨具或未经验证的替代菜。这正是食知相对“只靠 Prompt 的菜谱机器人”的核心价值。

## 当前能力

- 明显的中文 / English 切换。
- 按已选食材和佐料检索菜谱，并显示缺少项。
- 可折叠中英双语食材库与受控联想输入，避免加入无法匹配菜谱的食材。
- 菜谱难度、时间、最低用料、可选加料、必需 / 推荐佐料、图片和详细的电磁炉操作。
- 12 道入门菜谱，优先展示作者已成功试做的家常菜。
- 根据目标菜、食材、佐料、人数、时间和限制条件生成 Agent 烹饪计划。
- 对缺少食材、设备、时间、最高档位进行确定性判断，并只提供安全、可直接执行的替代方案。
- 服务器端可选择 DeepSeek、ChatGPT/OpenAI 或 Gemini。
- 服务器接入数据库后，可接收访客菜谱投稿并进入审核队列。

首批实测菜谱包括西红柿炒鸡蛋、辣椒炒肉末、辣椒炒肉片、黄瓜炒肉末、清炒小白菜、小白菜炒肉末和煎荷包蛋。

## 公开网页与部署模式

公开的 [GitHub Pages 演示网页](https://y36366363.github.io/Cooking_Starter/) 是静态版本：菜谱浏览、食材匹配、语言切换和菜谱详情都可以公开使用。网页中的 Agent 区会明确显示为演示模式，浏览器中没有任何 API Key，也不会产生外部模型费用。

若要启用真实的 AI 对话和访客投稿存储，需要把服务器版本部署到支持 `/api/agent` 与 `/api/submissions` 的运行环境。模型密钥只保存在服务器，绝不会返回浏览器、进入静态构建产物、提交到 Git，或作为用户内容发给模型。

## 服务器端 Agent 配置

在服务器环境变量中只配置准备使用的模型提供商：

```text
DEEPSEEK_API_KEY=仅服务端保存的密钥
DEEPSEEK_MODEL=deepseek-v4-flash

GEMINI_API_KEY=仅服务端保存的密钥
GEMINI_MODEL=gemini-3.5-flash-lite

OPENAI_API_KEY=仅服务端保存的密钥
OPENAI_MODEL=gpt-4o-mini

COOKING_AGENT_PROVIDER=deepseek  # deepseek | gemini | chatgpt（或 openai）
COOKING_AGENT_ACCESS_CODE=访客访问密码
COOKING_AGENT_ADMIN_CODE=高强度管理员密码
```

访客密码只由服务器验证，不会发给模型。基础实现中，访客密码每小时最多请求五次，管理员密码不限次数；正式多实例部署时，建议把限流状态迁移到 Cloudflare KV 或 D1。

## 本地 Agent：编辑一次，直接运行

编辑 [`config/default_config.json`](config/default_config.json) 后即可运行本地计划器。API Key 只放在被 Git 忽略的 `.env`，绝不能写入 JSON 配置。

```bash
# 免费预检：菜谱检索、食材 / 佐料 / 设备 / 时间 / 火力核对
python3 scripts/cooking_plan.py --dry-run

# 调用已选择的模型，生成 Markdown 烹饪报告
python3 scripts/cooking_plan.py

# 保存报告
python3 scripts/cooking_plan.py --output reports/today-plan.md
```

| 配置项 | 用途 |
| --- | --- |
| `language` | 唯一的语言设置。`zh` 用中文识别并输出中文报告，`en` 用英文识别并输出英文报告。 |
| `model_provider` | `deepseek`、`chatgpt`（或 `openai`）、`gemini`。 |
| `model` | 对应提供商的模型名。 |
| `ingredients` / `seasonings` | 主食材与佐料分开，才能准确报告缺少的必需项。 |
| `target_dish`、`time_minutes`、`servings`、`preference` | 目标菜与计划条件。 |
| `skill_level` | `beginner` 会细化切配、下锅时机和可观察完成状态。 |
| `equipment` | 声明已有设备，例如 `induction_hob` 与 `frying_pan`。 |
| `max_induction_level` | 防止推荐超过用户设备可用档位的做法。 |
| `allow_extra_purchase` | 开启后，缺料时可先给出经工具验证的最低采购清单。 |

## 本地运行网页

需要 Node.js 22.13 或更新版本，以及 pnpm。

```bash
pnpm install
pnpm dev
pnpm build
```

## 技术结构

- React 19 + TypeScript
- Vinext / Vite
- Tailwind CSS 与 shadcn UI primitives
- 浏览器、服务器 Agent 和本地 Python 计划器共用同一份 JSON 菜谱目录
- Cloudflare Workers + D1：可选的服务器端审核队列
- GitHub Actions + GitHub Pages：公开静态预览

## 后续方向

- 更多可编辑菜谱、用量与试做记录
- 普通燃气灶模式
- 过敏原、饮食限制、预算与营养筛选
- 带计时器与步骤清单的实时烹饪陪伴
- 审核后的社区菜谱与安全投稿通知
