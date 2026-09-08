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

## Local agent: private configuration, one command

Your own `config/default_config.json` is deliberately ignored by Git, so editing it will never be uploaded. Start by copying one of the tracked examples; the Chinese and English examples are safe to share and update.

```bash
cp config/default_config.en.example.json config/default_config.json
# or
cp config/default_config.zh.example.json config/default_config.json
```

Then edit your private `config/default_config.json`. Keep API keys in the ignored `.env` file—never in this JSON file.

```bash
# Optional free preflight: recipe retrieval, pantry check, equipment/time/heat validation
python3 scripts/cooking_plan.py --dry-run

# Ask the chosen model for a clean Markdown report
python3 scripts/cooking_plan.py

# Save the report
python3 scripts/cooking_plan.py --output reports/today-plan.md
```

The normal report hides the internal `Tool Preflight` JSON. It begins with `# Shizhi Cooking Plan`, shows the recipe's estimated total time and available time, then uses the heading `## AI Recommendation Report`. Use `--dry-run` only when you want to inspect the raw deterministic check.

### Complete local configuration reference

| Field | Accepted values / range | Notes |
| --- | --- | --- |
| `language` | `en` or `zh` | The only language setting. It controls both accepted pantry names and report language. |
| `model_provider` | `deepseek`, `chatgpt`, `openai`, `gemini` | `chatgpt` is an alias for `openai`. |
| `model` | Provider model name | Recommended current defaults: `deepseek-v4-flash`, `gpt-4o-mini`, `gemini-3.5-flash-lite`. The provider validates other model names. |
| `target_dish` | A listed recipe name, or a partial name | Recognised dishes: Tomato & Egg Stir-fry; Pepper with Minced Pork; Pepper Pork Stir-fry; Cucumber with Minced Pork; Garlic Bok Choy; Bok Choy with Minced Pork; Induction Fried Egg; Egg Fried Rice; Garlic Broccoli; Hot & Sour Potato Slivers; Easy Mapo Tofu; Cola Chicken Wings. |
| `ingredients` | Array of validated food names | English choices: Tomato, Egg, Green pepper, Minced pork, Sliced pork, Cucumber, Bok choy, Cooked rice, Broccoli, Potato, Tofu, Chicken wings. |
| `seasonings` | Array of validated seasoning names | English choices: Cooking oil, Salt, Sugar, Ketchup, Light soy sauce, Rice vinegar, Chili bean paste, Cola. |
| `time_minutes` | Whole number `0`–`240` | `0` means no time limit; otherwise the agent compares it with the recipe's estimated total time. |
| `servings` | Whole number `1`–`8` | Used in the report plan. |
| `preference` | Optional plain text | Examples: `less oil`, `no extra shopping`, or `no spicy food`. |
| `skill_level` | `beginner`, `intermediate`, `advanced` | `beginner` adds more cutting, pan-entry, and visible stop conditions. |
| `equipment` | `induction_hob`, `frying_pan` | Both are currently required for the induction recipes. |
| `max_induction_level` | Whole number `1`–`9` | Plans requiring a higher setting are marked as unsuitable. |
| `allow_extra_purchase` | `true` or `false` | With `true`, a missing-item plan may provide the minimum verified shopping list. |

The exact Chinese input names are in [`config/default_config.zh.example.json`](config/default_config.zh.example.json); English names are in [`config/default_config.en.example.json`](config/default_config.en.example.json).

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

## 本地 Agent：个人配置不上传，复制后直接运行

你自己的 `config/default_config.json` 已被 Git 忽略，之后怎样修改都不会上传到 GitHub。先从已上传的中英文示例复制一份：

```bash
cp config/default_config.zh.example.json config/default_config.json
# 或
cp config/default_config.en.example.json config/default_config.json
```

然后只编辑本地的 `config/default_config.json`。API Key 只放在被 Git 忽略的 `.env`，绝不能写入 JSON 配置。

```bash
# 可选免费预检：菜谱检索、食材 / 佐料 / 设备 / 时间 / 火力核对
python3 scripts/cooking_plan.py --dry-run

# 调用已选择的模型，生成整洁的 Markdown 烹饪报告
python3 scripts/cooking_plan.py

# 保存报告
python3 scripts/cooking_plan.py --output reports/today-plan.md
```

正常运行不再显示内部的“工具预检”JSON；英文报告以 `# Shizhi Cooking Plan` 和 `## AI Recommendation Report` 开头，并显示菜谱预计总用时和可用时间。只有运行 `--dry-run` 时才会展示原始的确定性预检结果。

### 本地配置完整参数说明

| 配置项 | 可选值 / 范围 | 说明 |
| --- | --- | --- |
| `language` | `zh`、`en` | 唯一语言设置，同时控制食材识别语言和报告语言。 |
| `model_provider` | `deepseek`、`chatgpt`、`openai`、`gemini` | `chatgpt` 是 `openai` 的别名。 |
| `model` | 对应提供商模型名 | 当前推荐默认值：`deepseek-v4-flash`、`gpt-4o-mini`、`gemini-3.5-flash-lite`；其他模型名由提供商验证。 |
| `target_dish` | 已收录菜名或部分菜名 | 可识别菜谱：西红柿炒鸡蛋、辣椒炒肉末、辣椒炒肉片、黄瓜炒肉末、清炒小白菜、小白菜炒肉末、煎荷包蛋、鸡蛋炒饭、蒜蓉西兰花、酸辣土豆丝、家常麻婆豆腐、可乐鸡翅。 |
| `ingredients` | 已验证食材组成的数组 | 中文可选：西红柿、鸡蛋、青椒、猪肉末、猪肉片、黄瓜、小白菜、米饭、西兰花、土豆、豆腐、鸡翅。 |
| `seasonings` | 已验证佐料组成的数组 | 中文可选：食用油、盐、糖、番茄酱、生抽、米醋、豆瓣酱、可乐。 |
| `time_minutes` | 整数 `0`–`240` | `0` 代表不限制时间；其他值会与菜谱预计总用时比较。 |
| `servings` | 整数 `1`–`8` | 用于生成计划。 |
| `preference` | 可选自由文本 | 例如“少油”“不额外购买”“不吃辣”。 |
| `skill_level` | `beginner`、`intermediate`、`advanced` | `beginner` 会更细化切配、下锅时机和可观察完成状态。 |
| `equipment` | `induction_hob`、`frying_pan` | 当前电磁炉菜谱需要同时填写这两项。 |
| `max_induction_level` | 整数 `1`–`9` | 需要更高档位的菜会被标记为不适合。 |
| `allow_extra_purchase` | `true`、`false` | `true` 时，缺料计划可以给出经验证的最低采购清单。 |

完整的中文食材输入见 [`config/default_config.zh.example.json`](config/default_config.zh.example.json)，英文输入见 [`config/default_config.en.example.json`](config/default_config.en.example.json)。

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
