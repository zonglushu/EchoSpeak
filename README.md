<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EchoSpeak Monorepo

[![CI](https://github.com/zonglushu/EchoSpeak/actions/workflows/ci.yml/badge.svg)](https://github.com/zonglushu/EchoSpeak/actions/workflows/ci.yml)

EchoSpeak 是一套面向“学员端 + 管理端”的 AI 口语练习工作台。当前仓库采用 npm workspaces 管理多端工程，并将 UI、类型、Gemini 服务等能力拆分成共享 packages，方便重用与独立发布。

> 原始 demo 来自 AI Studio，现已演进成多应用的 Monorepo。AI Studio 的共享链接：<https://ai.studio/apps/drive/1ojiQ33mLnXiYjmPSBBxuDp0bxOwCxr_z>

## 技术栈概览

- **apps/learner**：React 19 + Vite + Tailwind，面向学员的播放器/AI 跟读体验。
- **apps/admin**：Next.js 16 App Router，运营同学用来上传→字幕→AI 打谱→发布。
- **packages/ui**：共享 UI 库（ProsodyRenderer、NotationLegend、主题 token），由 Storybook 驱动。
- **packages/types**：数据接口（TranscriptLine、MediaAsset、NotationGuide、PlaybackState 等）。
- **packages/services**：Gemini API 封装，统一 Prosody 打谱、双语生成、媒体转写逻辑。

## 项目结构

```text
.
├─ apps/
│  ├─ learner/                # Vite SPA（学员体验）
│  └─ admin/                  # Next.js App Router（管理员工作台）
├─ packages/
│  ├─ ui/                     # ProsodyRenderer、NotationLegend、theme.css
│  ├─ services/               # Gemini SDK helper（@echospeak/services）
│  ├─ types/                  # 共享 TypeScript 类型（@echospeak/types）
│  └─ config/                 # Tailwind preset、ESLint base、tsconfig baseline
├─ docs/                      # 规划文档（plan.md、stage2.md、structure.md...）
├─ sql/                       # Supabase schema 与迁移
├─ styles/                    # 全局样式（theme.css）与 reset
├─ .storybook/                # Storybook 指向 packages/ui
├─ package.json               # npm workspace 根脚本
└─ tsconfig*.json             # 根 + 子包的 TS 配置/路径别名
```

## 环境准备

1. Node.js **20+**，推荐配合 pnpm/nvm 统一版本。
2. 一个可用的 [Gemini API Key](https://aistudio.google.com/app/apikey)。
3. 根目录执行安装：
   ```powershell
   npm install
   ```
4. 复制并填写环境变量：
   ```powershell
   copy .env.local.example .env.local
   # 编辑 .env.local，填入 Gemini Key
   ```
   ```env
   GEMINI_API_KEY=你的_Gemini_API_Key
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=Public_anon_key
   SUPABASE_SERVICE_ROLE_KEY=Service_role_key（仅供 Server Action 使用）
   SUPABASE_STORAGE_BUCKET=media-uploads
   SUPABASE_COVER_BUCKET=media-covers
   SUPABASE_DEFAULT_USER_ID=运营账号的 UUID（用于写入 media_assets.created_by）
   ```

   > ⚠️ `.env.local` 不要提交到仓库；`*.example` 里保持占位符即可。更多 Supabase 建设细节参见 [`docs/03-setup/supabase-setup.md`](docs/03-setup/supabase-setup.md)。

> 未提供 `GEMINI_API_KEY` 时，界面依旧可浏览，但 AI 转写/翻译/打谱会降级为占位内容，同时在应用顶部看到提醒。

## 常用脚本

根 `package.json` 通过 npm workspaces 调用子项目脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev --workspace @echospeak/learner` | 启动学员端 Vite Dev Server（默认 <http://localhost:5173>） |
| `npm run build --workspace @echospeak/learner` | 构建学员端产物（输出到 `apps/learner/dist`） |
| `npm run dev --workspace @echospeak/admin` | 启动管理员端（Next.js，默认 <http://localhost:3000>） |
| `npm run build --workspace @echospeak/admin` | 构建管理员端 |
| `npm run lint --workspace @echospeak/admin` | Lint 管理员端代码 |
| `npm run storybook` | 以 Vite Builder 打开 `packages/ui` 组件库 |
| `npm run build-storybook` | 生成 Storybook 静态站点 |

> 需要运行任意命令前，请先在根目录执行 `npm install` 以确保 workspace 依赖 hoist 完整。

## CI/CD

GitHub Actions 会在 `main` 分支以及所有针对 `main` 的 PR 上自动运行以下检查：

1. 安装根依赖（npm workspaces）。
2. 构建学员端：`npm run build --workspace @echospeak/learner`。
3. Lint 管理端：`npm run lint --workspace @echospeak/admin`。
4. 构建管理端：`npm run build --workspace @echospeak/admin`。
5. 构建 Storybook：`npm run build-storybook`。

在提交新的脚本或包之前，请确保对应命令可在本地通过；若 CI 需要新增检查（如 Vitest、Playwright、部署步骤），可在 `.github/workflows/ci.yml` 中扩展。

## 共享 Packages

| 包名 | 说明 |
| --- | --- |
| `@echospeak/ui` | ProsodyRenderer、NotationLegend 等共享组件，自动导出 `theme.css` 以保证 Admin / Learner / Storybook 视觉一致。 |
| `@echospeak/services` | 基于 `@google/genai` 的 Gemini 封装，提供 `generateProsodyNotation`、`bilingualizeText`、`transcribeMedia` 以及 `configureGeminiClient`。 |
| `@echospeak/types` | 所有核心数据结构（TranscriptLine、MediaAsset、NotationGuide、PlaybackState 等），供前后台共享。 |
| `@echospeak/config` | Tailwind preset、ESLint ignores、tsconfig baseline，保证 Learner/Admin/Storybook 对齐设计 token 与编译规范。 |

> 在 app 或其他包中引用时，直接 `import { ProsodyRenderer } from '@echospeak/ui'`，无需访问内部相对路径。

## 开发提示

- **目录引用**：tsconfig 已在根、app、package 级别配置 `@echospeak/*` 路径别名，可在 TS/JSX 中直接使用。
- **API Key 安全**：Learner/Admin 目前直接读取前端环境变量，部署时建议通过代理/Server Action 统一调度 Gemini，以免泄露密钥。
- **Storybook 驱动 UI**：共享组件的新增/修改应优先在 `packages/ui` + Storybook 中验证，再下沉到各 app。
- **后续规划**：当 Supabase SDK、Figma Library 等完成后，可继续扩展 `@echospeak/services` 与 `@echospeak/config`（例如 Vitest preset、Playwright helpers），具体节奏见 [`docs/02-architecture/structure.md`](docs/02-architecture/structure.md)。

## 📚 文档中心

完整的项目文档已按功能分类整理在 [`docs/`](docs/) 目录：

- **📋 项目概览**：[`docs/01-overview/`](docs/01-overview/) - 项目介绍、规划、进度追踪
- **🏗️ 架构设计**：[`docs/02-architecture/`](docs/02-architecture/) - 系统架构、技术选型
- **🔧 环境配置**：[`docs/03-setup/`](docs/03-setup/) - 开发环境搭建指南
- **💻 开发指南**：[`docs/04-development/`](docs/04-development/) - 功能实现和问题解决
- **🔌 API 文档**：[`docs/05-api/`](docs/05-api/) - API 接口文档（待补充）
- **🚀 部署文档**：[`docs/06-deployment/`](docs/06-deployment/) - 生产环境部署（待补充）

### 📍 快速导航

**新人必读**：
1. 📖 [`DOCS_MAP.md`](DOCS_MAP.md) - 文档地图（可视化导航）⭐
2. 📋 [`docs/01-overview/project-overview.md`](docs/01-overview/project-overview.md) - 项目全面概览 ⭐⭐⭐
3. 🔧 [`docs/03-setup/supabase-setup.md`](docs/03-setup/supabase-setup.md) - 环境配置指南 ⭐⭐

**开发参考**：
- 💻 [`docs/04-development/Admin-APP.md`](docs/04-development/Admin-APP.md) - 当前开发重点
- 🏗️ [`docs/02-architecture/structure.md`](docs/02-architecture/structure.md) - 代码结构说明
- 🤖 [`CLAUDE.md`](CLAUDE.md) - AI 协作指南

**详细索引**：[`docs/README.md`](docs/README.md)

---

若在运行或结构上遇到问题，欢迎查看 [`docs/`](docs/) 下的分类文档，或直接提交 Issue/PR 讨论。
