# 阶段 2 计划（管理员工作台）

> 范围：完成“上传 → 字幕 → AI 打谱 → 发布”全链路，使 1-2 名运营同学可在 15 分钟内交付一条内容并发布到学员端库。

---

## 1. 目标与成功标准
- **业务目标**：上线可复用的管理员后台，支撑每日 20+ 条视频的处理能力，且具备 AI 批处理可视化能力。
- **体验目标**：上传至发布流程不离开单页，步骤引导清晰；任何任务失败都能定位、重跑、留言。
- **技术目标**：Next.js 15 + Supabase 架构跑通，所有任务状态在 5 秒内同步到前端 UI，核心接口具备 e2e 测试。
- **验收指标**：
  1. 上传 500MB 视频全流程 ≤ 12 分钟（含 AI 处理）；
  2. 字幕列表加载 1000 行时 FPS ≥ 55，滚动操作无明显掉帧；
  3. Prosody 打谱批量操作成功率 ≥ 95%，失败支持单句重试；
  4. 发布操作可在 3 秒内向学员端暴露内容。

## 2. 依赖与准备
| 类别 | 内容 | 状态 |
| --- | --- | --- |
| 设计资产 | Stage 1 token、组件、线框；Figma Library（需补齐） | ⏳ Figma 正在整理 |
| 技术底座 | Next.js App Router + Tailwind + Supabase 客户端 | ✅ `apps/admin` 已脚手架 |
| 数据层 | Supabase Postgres、Storage、Edge Functions | ⏳ 待创建数据库与 bucket |
| AI 服务 | Gemini API Key、翻译备用服务、任务队列策略 | ⏳ 需配置 `.env` 与代理脚本 |

## 3. 系统架构概览
1. **前端**：`apps/admin`（Next.js 15、App Router、Server Actions、Tailwind + Radix + Zustand）。
2. **后端资源**：Supabase（Postgres + Auth + Storage + Realtime）。复杂任务由 Edge Functions 或自建 worker 处理。
3. **AI 服务**：`@echospeak/services`（Gemini SDK 包）扩展为 server action/route，统一速率限制 + 日志。
4. **作业流程**：上传完成 → `jobs` 表创建 `upload` 任务 → Edge Function 转码/提取字幕 → 写入 `transcripts`，触发 `transcribe`/`notation` 任务 → Prosody renderer 读取 `transcripts` + notation 状态 → 最终发布写入 `media_assets.status = published`。

## 4. 数据模型（版本化于 `sql/schema.sql`）
```sql
-- media_assets
id uuid primary key default gen_random_uuid(),
title text not null,
description text,
duration_seconds int,
status text check (status in ('draft','processing','published','archived')) default 'draft',
cover_url text,
source_url text,
tag_list text[],
created_by uuid not null references auth.users(id),
created_at timestamptz default now(),
updated_at timestamptz default now()

-- transcripts
id uuid primary key default gen_random_uuid(),
asset_id uuid references media_assets(id) on delete cascade,
sequence int,
start_time_ms int,
end_time_ms int,
text_en text,
text_cn text,
notation jsonb,
lock_state text check (lock_state in ('unlocked','locked')) default 'unlocked',
status text check (status in ('pending','ai_generating','ready','error')) default 'pending',
updated_by uuid references auth.users(id),
updated_at timestamptz default now()

-- jobs
id uuid primary key default gen_random_uuid(),
asset_id uuid references media_assets(id) on delete cascade,
type text check (type in ('upload','transcribe','translate','notation')), 
payload jsonb,
status text check (status in ('queued','running','success','failed','canceled')) default 'queued',
progress numeric default 0,
error text,
retries int default 0,
created_at timestamptz default now(),
updated_at timestamptz default now()
```
> **动作**：首次运行前在 Supabase SQL 编辑器或 `supabase db push` 中执行，仓库需记录 `sql/schema.sql` 并写入迁移流程。

## 5. 模块拆解与需求
### 5.1 上传 & 任务队列
- **UI**：Dropzone + 列表，显示文件大小、剩余时间、分块进度。支持并行上传与暂停/恢复。
- **后端**：使用 Supabase Storage 生成签名 URL；完成上传后触发 Edge Function 写 `media_assets` & `jobs(type='upload')`。
- **错误处理**：分块失败自动重试 3 次；所有错误入 `jobs.error`。
- **验收**：任意文件在网络波动下可恢复上传，不需要重选文件。
> ✅ `UploadWorkbench`（`apps/admin/src/components/upload/UploadWorkbench.tsx`）提供多文件拖拽、模拟 Job Watcher，并调用 `/api/upload/sign` 返回 mock signed URL + asset id，用于后续集成 Supabase。

### 5.2 字幕工作台
- **视图**：双栏（原文/译文）+ 顶部步骤面包屑 + 右侧 Job 活动流。
- **功能**：
  1. 导入 SRT/VTT（拖拽/粘贴），即时解析预览；
  2. 单句编辑（富文本 + 快捷键）、批量锁定/解锁；
  3. 单语字幕自动触发翻译，结果以 diff 形式提示，可一键接受；
  4. 支持 CSV/JSON 导出。
- **性能**：虚拟列表（react-virtuoso），1k 行仍流畅。
> ✅ `SubtitleWorkbench`（`apps/admin/src/components/subtitles/SubtitleWorkbench.tsx`）整合 `react-virtuoso` 虚拟列表、`parseTimedText` 工具解析 SRT/VTT，并调用 `/api/ai/translate`（Gemini + fallback）生成diff，支持 JSON/CSV 导出与锁定切换。

### 5.3 AI 发音谱面板
- **功能**：
  1. 选定句 / 全量触发 `generateProsodyNotation`；
  2. 展示实时进度与剩余时间估算；
  3. notation 编辑器（JSON schema + 可视化图层）；
  4. 错误行可单独重跑并展示日志。
- **集成**：复用 Stage 1 `ProsodyRenderer`；AI 调用通过 Server Action + 速率限制器。
> ✅ `ProsodyPanel`（`apps/admin/src/components/prosody/ProsodyPanel.tsx`）复用 `@echospeak/ui` 的 `ProsodyRenderer`/`NotationLegend`，支持多选句子调用 `/api/ai/notation`（Gemini+fallback），并记录日志、预览标注。

### 5.4 内容库 & 发布
- **列表**：状态、语言、标签筛选，支持多选批量发布/归档。
- **预览**：弹出播放器 + 字幕/notation 面板，确认后才能发布。
- **发布流程**：Server Action 更新 `media_assets.status='published'`，触发 Supabase Webhook 通知学员端。
> ✅ `ContentLibrary`（`apps/admin/src/components/library/ContentLibrary.tsx`）提供状态过滤、搜索、详情预览与 mock Webhook 发布，调用 `/api/assets/[id]/publish` 即刻返回成功响应，后续可接入 Supabase Webhook。

## 6. API / Server Actions
| 功能 | 端点/Action | 备注 |
| --- | --- | --- |
| 上传签名 | `POST /api/upload/sign` | 返回 signed URL + asset id |
| 任务进度 | `GET /api/jobs?assetId=` | Realtime 订阅/轮询 fallback |
| 导入字幕 | `POST /api/assets/:id/subtitles` | 接收 JSON/SRT 文件 |
| Prosody 触发 | `POST /api/assets/:id/notation/run` | 支持 partial selection |
| 发布 | `POST /api/assets/:id/publish` | 校验状态与权限 |

## 7. 迭代节奏
| Sprint | 范围 | 交付 | 验收 |
| --- | --- | --- | --- |
| S1（第3周） | Next.js + Supabase scaffolding、上传流程、`media_assets`/`jobs` CRUD | CLI + UI 均可上传并看到 Job 状态 | 上传 1GB 文件成功；Job 状态实时刷新 |
| S2（第4周） | 字幕工作台 + AI 转写/翻译 | 字幕列表编辑、锁定、AI 自动补全 | 单语字幕可在 1 分钟内获得译文 |
| S3（第5周） | Prosody 面板 + 发布 | 可视化 notation、批量生成、发布联调 | 完成一条视频的全流程并发布到学员端 |

## 8. 风险与应对
| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 大文件上传耗时 | 影响运营效率 | 分块 + 暂停恢复 + 直传存储 |
| AI 限流/超时 | 任务失败 | 队列 + 速率限制器 + 失败重跑 |
| 数据一致性 | 发布后学员端不同步 | 使用事务 + Webhook/Realtime 推送 |
| 设计资产延迟 | UI 返工 | 每周与设计同步，Storybook 驱动组件 |

## 9. 执行清单
- [x] Next.js 项目同步 Stage1 token（Tailwind/theme.css）—— 已在 `apps/admin` 中复用 `styles/theme.css` + 定制 `tailwind.config.ts`。
- [x] Supabase 项目初始化 & `sql/schema.sql` 版本化 —— 新建 `sql/schema.sql`，包含 media_assets/transcripts/jobs 表结构与索引。
- [x] 上传模块（前端 Dropzone + 后端签名/Job）。
- [x] 字幕工作台 MVP（导入/解析、AI 翻译钩子）。
- [x] Prosody 面板 MVP（调用 AI、进度追踪）。
- [x] 发布 & 内容库列表。
- [ ] e2e 流程验证 + 文档更新。

## 10. 2025-12-27 进度回顾 & 下一步

### 已完成
- 前端上传面板已通过 `/api/upload/sign` 获取 Supabase Signed Upload URL，并完成真实的 `PUT` 上传，Supabase Storage 可看到 `media-uploads/{assetId}/{filename}` 结构；对应 `media_assets` / `jobs(type='upload')` 记录也在路由层创建。
- Stage 2 关键子模块（字幕工作台、Prosody 面板、内容库）均有可用的 UI 与 mock API，便于串联交互流程。

### 待完成（重点攻坚）
1. **Job Watcher / 任务队列持久化**
  - 当前 `UploadWorkbench` 初始化的任务列表为 mock 数据，刷新即丢失。
  - 需改为：上传成功后写入 Supabase `jobs` / `media_assets`，前端通过 `useSWR` 或 Server Component 拉取真实列表，并在 Zustand store 中缓存。
2. **Realtime / 轮询状态同步**
  - 目前 Job Watcher 只是前端 `setTimeout` 模拟状态推进。
  - 计划：优先实现 `/api/jobs?assetId=` REST 轮询，随后接入 Supabase Realtime（`postgres_changes` 订阅 `jobs` 表）。
3. **任务历史保留与过滤**
  - 需要在内容库和 Job Watcher 中显示历史任务（可按 `created_at`、`status`、`stage` 过滤），保证刷新后仍可追溯。
  - 同时在 `jobs.payload` 中保存上传文件元数据（mime、size）供 UI 展示。
4. **真实发布流程联调**
  - 目前 `/api/assets/[id]/publish` 为 mock，应接入 Supabase RPC 或直接更新 `media_assets.status`，并触发通知（Edge Function/Webhook）。
5. **文档与 e2e 验收**
  - 补齐 Stage 2 指南：如何本地连接 Supabase、如何启动 Realtime 监听、测试步骤。
  - 编写最小 e2e（Playwright/Vitest）验证“上传→字幕→发布”链路。

> 优先级建议：先完成 Job Watcher 持久化 + 状态查询（1、2），解决“刷新任务丢失”与“内容仍为模拟数据”的核心痛点；随后推进 3-5 以支撑真实生产流程。

## 11. 本地运行指南
1. **主站 Vite 应用**：`npm install && npm run dev`（根目录）。
2. **管理员工作台**：
  ```powershell
  cd apps/admin
  npm install
  npm run dev
  ```
  默认端口 `http://localhost:3000`，界面展示上传 Dropzone、Job Watcher 和任务表（目前使用模拟数据）。
3. **Supabase Schema**：如需本地数据库，进入 `sql/` 目录运行 `supabase db push` 或将 `schema.sql` 粘贴到 Supabase SQL 编辑器执行。

---

> **沟通机制**：
> - 每周一次 Review（演示当前 Sprint 可用能力）。
> - 日常通过 Linear/Jira 拆分任务；Storybook + Supabase Studio 做同步演示。
> - 与 Stage 1 Figma 组件对齐，所有 UI 变更先在 Storybook 走 PR Review。
