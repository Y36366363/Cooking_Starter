# 食知 Cooking Agent

[English](#english) · [公开网页 / Live site](https://y36366363.github.io/Cooking_Starter/)

食知是一个以电磁炉烹饪为核心的双语菜谱 Agent 原型，主要面向留学生和刚开始做中餐的海外用户。它把模糊的“大火、中火、小火”转换成更容易重复的功率与时间提示，并根据用户现有食材判断一道菜是否可以马上制作。

## 当前功能

- 中文 / English 明显切换
- 按已有食材推荐菜谱，并显示缺少的食材
- 菜名与中英文食材搜索
- 菜谱难度、时间和电磁炉功率路线
- 菜谱详情中的已有 / 缺少食材对比
- 优先展示作者亲自成功试做的家常菜
- 适配桌面和手机屏幕
- 访客菜谱投稿界面；服务器版本写入待审核数据库

当前首批实测菜谱包括西红柿炒鸡蛋、辣椒炒肉末、辣椒炒肉片、黄瓜炒肉末、清炒小白菜、小白菜炒肉末和煎荷包蛋。

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

Shizhi is a bilingual cooking-agent prototype focused on induction hobs. It is designed for international students and people learning to cook Chinese food abroad. Instead of vague heat labels, recipes use practical wattage and timing guidance, then compare each dish with the ingredients already available.

### Available now

- Prominent Chinese / English switch
- Pantry-based recipe ranking and missing-ingredient comparison
- Search by dish or ingredient in either language
- Difficulty, cooking time, and induction power guidance
- Detailed step-by-step recipe sheets
- Kitchen-tested recipes shown first
- Responsive desktop and mobile layout

The public GitHub Pages build is static. Core recipe features work normally, while guest submissions remain disabled until a secure public backend is connected. The server build already includes a review-queue API backed by D1.

### Development

```bash
pnpm install
pnpm dev
```

The project requires Node.js 22.13 or newer.
