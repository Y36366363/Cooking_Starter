# 食知 Cooking Agent

[English](#english) · [公开网页 / Live site](https://y36366363.github.io/Cooking_Starter/)

食知是一个以电磁炉烹饪为核心的双语菜谱 Agent 原型，主要面向留学生和刚开始做中餐的海外用户。它把模糊的“大火、中火、小火”转换成直观的 1–9 档操作，并根据用户现有食材判断一道菜是否可以马上制作。

## 当前功能

- 中文 / English 明显切换
- 按已有食材推荐菜谱，并显示缺少的食材
- 可折叠的中英双语食材库、受控联想输入和菜名 / 食材搜索
- 菜谱难度、时间和电磁炉 1–9 档火力路线
- 菜谱详情中的最低食材对比、可选加料与必需 / 推荐佐料
- 12 道带成品图片的入门菜谱及更具体的分步指导
- 受控访问的 AI 厨神 Agent 对话区；可设定目标菜、已选食材与佐料、人数、预计时间和限制条件，生成可做程度、缺少项与分步执行计划
- 工具型 Agent：服务器先从菜谱目录检索候选菜、核对必需食材与佐料、判断时间可行性，再把可信报告交给模型生成建议；缺料和时间不足不会由模型自行猜测
- 优先展示作者亲自成功试做的家常菜
- 适配桌面和手机屏幕
- 访客菜谱投稿界面；服务器版本写入待审核数据库

当前首批实测菜谱包括西红柿炒鸡蛋、辣椒炒肉末、辣椒炒肉片、黄瓜炒肉末、清炒小白菜、小白菜炒肉末和煎荷包蛋。

### Agent 接入方式

公开 GitHub Pages 版本包含完整的 Agent 对话界面和演示模式，但不会在浏览器中放置 LLM API Key。要启用真实模型调用，请在服务器部署环境中配置：

```text
DEEPSEEK_API_KEY=你的服务端密钥
DEEPSEEK_MODEL=deepseek-v4-flash          # 默认，快速且适合菜谱对话
GEMINI_API_KEY=你的服务端密钥             # 可选备用提供商
GEMINI_MODEL=gemini-3.5-flash-lite        # 当前可用的低延迟 Gemini 模型
OPENAI_API_KEY=你的服务端密钥             # 可选备用提供商
OPENAI_MODEL=gpt-4o-mini
COOKING_AGENT_PROVIDER=deepseek           # deepseek | gemini | chatgpt（或 openai）
COOKING_AGENT_ACCESS_CODE=普通访问密码     # 每个进程窗口每小时 5 次
COOKING_AGENT_ADMIN_CODE=管理员密码         # 不受次数限制
```

真实调用通过 `/api/agent` 完成。模型密钥只由服务器读取，绝不会发送到浏览器、返回给前端或写入静态 GitHub Pages 构建产物。访问密码只用于服务器鉴权，不会发送给模型；普通密码的简单限流为每小时 5 次，管理员密码不受该限制。正式多实例部署时，建议把限流计数迁移到 D1 或 KV，以便所有实例共享额度。GitHub Pages 上没有服务器运行时，因此对话区会明确标识为演示模式，不会产生外部模型费用。

Agent 在生成回答前会运行服务器端菜谱工具：根据目标菜、选中的食材/佐料、人数和可用时间，确定候选菜、必需项、缺少项、标准时间、电磁炉火力路线与安全基线。模型只能把工具找到且材料齐全的 `readyAlternatives` 写成完整替代做法；否则它只能报告最低缺少项，不能编造水、调料或其他设备。

### 本地一键生成烹饪报告

不想每次打开网页填写时，可以直接编辑 [config/default_config.json](config/default_config.json)。`ingredients`（主食材）和 `seasonings`（佐料）分开填写；`target_dish`、`time_minutes`、`servings`、`preference` 用于计划条件。只保留一个 `language`：设为 `zh` 时按中文识别并输出中文报告，设为 `en` 时按英文识别并输出英文报告。`model_provider` 可选 `deepseek`、`chatgpt`（或 `openai`）和 `gemini`，`model` 填对应模型名。`skill_level` 会影响说明的细致程度；`equipment`、`max_induction_level` 和 `allow_extra_purchase` 会进入确定性预检，分别检查必需厨具、最高可用档位和缺料时是否允许先给出最小采购清单。API Key 仍只放在被 Git 忽略的 `.env`，不要写入配置文件。

```bash
# 先做免费预检：找菜谱、核对缺料和时间，不调用模型
python3 scripts/cooking_plan.py --dry-run

# 调用本地 Agent，直接在终端生成 Markdown 报告
python3 scripts/cooking_plan.py

# 可选：把报告保存为文件
python3 scripts/cooking_plan.py --output reports/today-plan.md
```

这个命令不是把一段食材文字直接丢给通用模型：它和网页 Agent 使用同一份 [菜谱目录](data/cooking-catalog.json)，先做确定性的菜谱检索、必需佐料检查、时间预算和电磁炉安全校验，再将可信结果交给模型写成易执行的报告。可另建 `config/local_*.json` 保存个人方案；这些文件不会提交到 Git。

## 公开预览

GitHub Pages 会在每次 `main` 分支更新后自动构建并发布：

**https://y36366363.github.io/Cooking_Starter/**

GitHub Pages 是纯静态托管，因此公开预览中的食材匹配、搜索、语言切换和菜谱详情可以完整使用，但访客投稿暂时不会发送。投稿数据需要服务器与数据库支持；项目中的 `/api/submissions` 已为服务器部署保留，并且不会在网页中公开作者邮箱。

## 本地运行

需要 Node.js 22.13 或更高版本，以及 pnpm。

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址即可使用。生产构建：

```bash
pnpm build
```

## 技术结构

- React 19 + TypeScript
- Vinext / Vite
- Tailwind CSS + shadcn UI primitives
- Cloudflare Workers + D1（服务器版访客投稿）
- GitHub Actions + GitHub Pages（公开静态预览）

## 项目方向

后续计划包括可编辑菜谱内容、普通燃气灶模式、更多食材与饮食条件、审核后的访客投稿转发，以及接入 AI 后按食材、设备、时间和偏好生成烹饪分析。

---

## English

Shizhi is a bilingual cooking-agent prototype focused on induction hobs. It is designed for international students and people learning to cook Chinese food abroad. Instead of vague heat labels, recipes use practical 1–9 induction levels and timing guidance, then compare each dish with the ingredients already available.

### Available now

- Prominent Chinese / English switch
- Pantry-based recipe ranking and missing-ingredient comparison
- Collapsible bilingual pantry with 60+ validated ingredients and autocomplete
- Search by dish or ingredient in either language
- Difficulty, cooking time, and practical 1–9 induction guidance
- Required ingredients, optional add-ins, required/recommended seasonings, and detailed steps
- 12 illustrated beginner recipes
- Protected AI cooking planner: set a target dish, selected pantry and seasonings, servings, time, and constraints to receive feasibility, missing-item, and step-by-step execution reports
- Tool-based agent flow: the server retrieves a recipe candidate, checks required pantry items/seasonings and available time, then gives the LLM a trusted report instead of letting it guess missing items or appliances
- Kitchen-tested recipes shown first
- Responsive desktop and mobile layout

The public GitHub Pages build is static. Core recipe features work normally, while guest submissions remain disabled until a secure public backend is connected. The server build already includes a review-queue API backed by D1.

The public build never contains an LLM key. A server deployment can enable `/api/agent` with `DEEPSEEK_API_KEY` (default), `GEMINI_API_KEY` or `OPENAI_API_KEY`, plus `COOKING_AGENT_ACCESS_CODE` (5 requests/hour) and `COOKING_AGENT_ADMIN_CODE` (unlimited). Provider choice and model names are server-only settings; the access code is checked server-side and is never sent to the model.

### Local one-command cooking reports

Edit `config/default_config.json` with separately listed `ingredients` and `seasonings`, a target dish, time, servings, preferences, provider, and model. `language` is the only language control: `zh` accepts Chinese names and writes a Chinese report, while `en` accepts English names and writes an English report. Set `model_provider` to `deepseek`, `chatgpt` (or `openai`), or `gemini`; `skill_level`, `equipment`, `max_induction_level`, and `allow_extra_purchase` affect the trusted preflight rather than being vague model-only preferences. API keys remain only in ignored `.env` files. Run `python3 scripts/cooking_plan.py --dry-run` for a no-cost deterministic pantry/time check, or `python3 scripts/cooking_plan.py` for a Markdown report. The CLI uses the same recipe catalog and trusted preflight as the web agent rather than sending unverified free text directly to a model.

### Development

```bash
pnpm install
pnpm dev
```

The project requires Node.js 22.13 or newer.
