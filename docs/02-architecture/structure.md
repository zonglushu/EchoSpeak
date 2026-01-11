# 代码结构规划（Learner vs Admin）

> 目的：把当前混合在仓库根部（Vite 学员端）与 `apps/admin`（Next.js 管理端）的代码梳理成清晰的 Monorepo 布局，方便后续 Stage 2 / Stage 3 并行推进。

## 1. 现状与痛点
| 区域 | 技术栈 | 痛点 |
| --- | --- | --- |
| 根目录（Vite） | React + Vite，`components/`、`services/` 等散落 | 学员端页面、组件、服务直接铺在根目录，缺少明确的 app 包装；难以和管理员端共享/隔离依赖 |
| `apps/admin` | Next.js 15 App Router | 结构清晰，但暂时与根目录没有共享包，未来需要共用 ProsodyRenderer、token 等 |
| 共享资源 | `styles/theme.css`, `tailwind.config.ts`, `@echospeak/services`（原 `services/geminiService.ts`） | 没有明确“packages”概念，后续多端共享时容易复制粘贴 |

## 2. 目标架构
```
.
├─ apps/
│   ├─ learner/          # Vite 学员端（从根目录迁入）
│   └─ admin/            # Next.js 管理端（已存在）
├─ packages/
│   ├─ ui/               # 共享 UI 组件（Button, Tabs, ProsodyRenderer, NotationLegend...）
│   ├─ services/         # 前后端共用的 API SDK、Gemini 封装、字幕解析工具
│   ├─ types/            # TS 类型、Zod schema
│   └─ config/           # Tailwind/theme tokens、ESLint/TS 基线
├─ sql/                  # Supabase schema
├─ docs/                 # 规划文档（plan.md, stage1.md, stage2.md, structure.md ...）
├─ package.json          # Monorepo scripts（或 pnpm workspace root）
└─ turbo.json / pnpm-workspace.yaml (可选)
```

### 模块职责
| 模块 | 职责 |
| --- | --- |
| `apps/learner` | 播放器、收藏/笔记、AI 讲解等面向学员的 SPA；复用 `packages/ui`、`packages/services` |
| `apps/admin` | 上传→字幕→打谱→发布工作台；同样复用共享包 |
| `packages/ui` | Tailwind + Radix 组件、ProsodyRenderer、主题 token；Storybook 可以指向此目录 |
| `packages/services` | Gemini API、Supabase 客户端、字幕解析（mp4box.js、srt parser）等纯逻辑 |
| `packages/types` | 数据模型（asset, transcript, job）、Zod schema、API 响应契约 |
| `packages/config` | Tailwind preset、ESLint config、tsconfig base，供 app/包继承 |

## 3. 迁移路线
1. **Monorepo 工具**：选定 pnpm + workspace（或 npm workspaces），在根目录新增 `pnpm-workspace.yaml`，列出 `apps/*`、`packages/*`。
2. **Learner 应用搬迁**：
   - 创建 `apps/learner`，把当前 `App.tsx`, `index.tsx`, `components/`, `services/`, `styles/` 等迁入。
   - 根目录仅保留 workspace 配置与 shared packages。
3. **共享包拆分**：
   - `components/ProsodyRenderer.tsx`, `NotationLegend.tsx` → `packages/ui`。
   - `services/geminiService.ts`、未来字幕解析工具 → `packages/services`。
   - `types.ts` → `packages/types`。
4. **配置统一**：
   - `packages/config/tailwind-preset.ts` 导出 Stage1 token，`apps/learner` 与 `apps/admin` 都引入。
   - `tsconfig.base.json` + `eslint.config.base.mjs` 提供共享规则。
5. **脚本更新**：在根 `package.json` 增加 `dev:learner`, `dev:admin`, `dev:all` 等脚本，或使用 Turborepo pipeline。
6. **Storybook**：改为引用 `packages/ui`，以组件库为中心；学员/管理员页面仅消费。

## 4. 实施节奏建议
| Sprint | 步骤 | 产出 |
| --- | --- | --- |
| S2-W1 | 完成 workspace 搭建 + learner 迁移 | `apps/learner` 可运行，根目录整洁 |
| S2-W2 | 抽取 `packages/ui` + `packages/types` | ProsodyRenderer/Token 在双端共享 |
| S2-W3 | 抽取服务层 + 统一 ESLint/TS/Tailwind preset | 管理端、学员端共享 API SDK 与配置 |

## 5. 风险与对策
- **迁移期间功能不可用** → 分支作业、保持 `apps/learner` 可在独立 dev server 运行；完成后再切换入口脚本。
- **依赖冲突** → 用 pnpm/workspaces 锁定版本，`packages/*` 仅暴露需要的 peer deps。
- **组件回归** → Storybook / Vitest 针对 `packages/ui` 加回归测试。

## 6. 下一步 Checklist
- [x] 创建 workspace 根配置（已使用 npm workspaces 管理 `apps/*` 与 `packages/*`）。
- [x] 初始化 `apps/learner` 并迁移现有 Vite 代码。
- [x] 建立 `packages/ui`（含 ProsodyRenderer、NotationLegend，供 Learner/Admin/Storybook 复用）。
- [x] 建立 `packages/types` & `packages/services`，迁移现有类型与 Gemini API 封装。
- [x] 建立 `packages/config`，导出 Tailwind preset、tsconfig baseline、ESLint 规范，供多端统一引用。
- [x] Storybook 指向 `packages/ui`，减少重复。
- [x] 更新 CI/CD（构建/测试流水线）并持续维护 README。

---
> 这份结构建议与 Stage 2 / Stage 3 规划相互配合，可在本周内先完成 workspace + learner 搬迁，其余包按业务推进逐步拆分。