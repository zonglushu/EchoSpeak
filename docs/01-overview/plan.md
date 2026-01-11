# EchoSpeak 重设计计划

## 1. 背景与目标
- **目标**：打造双角色（管理员 & 学员）共用的语音跟读训练平台，实现“视频→字幕→AI 发音谱”一条龙工作流。 
- **当前痛点**：页面仅提供基础播放器+字幕展示，AI 能力未显式区分角色、缺少收藏/笔记/讲解等学习工具，视觉风格与“苹果式极简”不符。
- **成功标准**：管理员可无缝上传并管理素材；学员端可沉浸式学习、实时获得 AI 辅助；界面在加载、交互、信息可视化方面体现高度精致和专注感。

## 2. 用户角色与核心任务
| 角色 | 核心任务 | 成功定义 |
| --- | --- | --- |
| 管理员 | 上传视频、导入/编辑字幕、触发 AI 转写 + 发音谱生成、审核与发布内容库 | 15 分钟内完成一条内容链路；可查看 AI 状态、进行人工修订 |
| 学员 | 浏览视频库 → 进入播放器 → 根据字幕滚动练习，收藏/做笔记 → 查看 AI 讲解 → 记录进度 | 单个视频会话内完成 3+ 条收藏/笔记；平均停留 > 10 分钟 |

## 3. 功能规划
### 3.1 管理端
1. **视频上传**：支持 MP4/WEBM；展示上传进度、文件校验、封面截取。
2. **字幕获取**：
   - 自动：AI 解析音频/画面字幕 → 输出 EN/CN 结构化结果。
   - 手动：管理员上传 SRT/VTT/文本；若为双语，则直接存储；若单语，则触发翻译管线。
3. **发音谱生成**：逐句调用 Gemini，生成 notation；展示进度、重试、人工编辑。
4. **内容管理**：列表/搜索/筛选、状态标签（草稿/处理中/已发布）、一键发布至用户库。

### 3.2 学员端
1. **内容浏览**：分区导航、推荐/收藏/最近学习；支持搜索与多维筛选（难度、时长、口音）。
2. **播放器体验**：
   - 控制栏：播放/暂停、前进/后退 5s、时间轴、字幕切换、音量、倍速、全屏、剧场模式、返回默认。
   - 布局：视频左、交互面板右（桌面）；移动端上下布局。
3. **练习清单**：字幕随播放时间滚动并高亮；支持点击跳转。
4. **学习工具**：
   - 收藏：标记整句并加入“收藏夹”。
   - 笔记：富文本/Markdown，关联时间戳。
   - AI 讲解：按钮触发，展示词汇解释、语音要点、难点提示。
   - 进度：完成度、复习提醒。

## 4. AI 管线设计
1. **上传 → 转码**：视频入库，提取音轨、缩略图。
2. **转写流程**：
   - 若视频已有字幕轨：提取 + 结构化。
   - 否则：音频 → 语音识别（Gemini / 外部 STT）→ 时间戳。
3. **翻译策略**：
   - 双语已存在：跳过。
   - 单语：按语种触发英<->中翻译模型，生成对齐文本。
4. **发音谱批处理**：按句调用 `generateProsodyNotation`，配合并发队列、重试策略、缓存结果。
5. **状态跟踪**：所有 AI 任务写入 Job 表，前端轮询或使用 SSE/WebSocket 实时更新进度。

### 4.1 字幕解析实现细节
1. **提取层**（无需 AI）：
   - 浏览器/Node 统一使用 `mp4box.js` 或 `mux.js` 从 MP4/TS 容器中解复用出文本轨；若存储在服务器上，可用 `ffmpeg.wasm`（前端）或原生 FFmpeg（后端）执行 `-map 0:s` 导出 WebVTT/SRT。
   - 对独立字幕文件（SRT/VTT/ASS）使用 `webvtt-parser`, `srt-parser-2` 等 TS 库转换为 `{ id, start, end, text }` JSON。
2. **语言检测 & 对齐**：
   - 同步解析所有字幕轨；使用 `franc`, `langdetect` 或简单正则判定语种。
   - 若发现两条轨分别对应 EN/CN，则在结构化数据中保留 `text_en`, `text_cn`。
3. **单语补全策略**：
   - 若只检测到一种语言，记录 `needsTranslation=true` 并触发翻译服务（优先 Gemini；可预留备用如 DeepL API）。
   - 翻译后生成缺失语言字段，并存入标准化结构，供发音谱/学员端直接消费。
4. **错误处理**：解析失败时允许管理员上传手动字幕；翻译失败回退到提示组件，支持重试。

## 5. 可复用组件/库建议
| 需求 | 备选库 | 评估 |
| --- | --- | --- |
| 高级播放器 | [Plyr](https://github.com/sampotts/plyr)、[Video.js](https://github.com/videojs/video.js)、Mux Player | 支持自定义控件、剧场模式，React 生态成熟 |
| 字幕同步滚动 | `react-scrollable-feed`, `react-virtuoso`, 自研虚拟列表 | 可处理长字幕并保持性能 |
| 收藏/笔记状态管理 | Zustand / Redux Toolkit | 轻量状态同步、跨组件共享 |
| UI 构建 | Tailwind CSS + Radix UI / Headless UI | 便于实现苹果风格的极简组件 |

## 6. 视觉与体验指导
- **色彩**：主色 #0F172A（深空蓝）+ 辅助 #3B82F6（霓虹蓝）+ 点缀 #F4D35E（柔和金）。大面积背景使用模糊玻璃效果，避免纯黑压迫。
- **字体**：SF Pro / Inter；字重对比突出层级。
- **布局**：
  - 顶部导航（透明毛玻璃）→ 主体两栏：左侧视频（16:9 圆角卡片），右侧信息面板（练习清单/收藏/AI 讲解 Tab）。
  - 管理员工作台采用 3 步流程式布局（上传 → 字幕 → 打谱），配合进度条。
- **动效**：40–200ms 微动效；AI 状态使用“脉冲+渐变”提示；收藏/笔记交互有柔和弹出层。
- **注意力引导**：使用 Spotlight/Focus 区块突出当前字幕；辅助信息（笔记、讲解）折叠在次级面板。

## 7. 信息架构（IA）
```
全局导航
├─ 面向学员
│  ├─ 发现 Discover
│  ├─ 收藏 Favorites
│  └─ 历史 History
├─ 面向管理员
│  ├─ 素材库 Library
│  └─ AI 工作台 Studio
└─ 账户/通知
```
- **路由示例**：`/studio/upload`, `/studio/:id/edit`, `/learn`, `/learn/:videoId`, `/profile`。

## 8. 技术实现路线
1. **前端**：
   - 继续使用 React + Vite；引入 Zustand 管理播放器/字幕状态。
   - 探索 SSR/静态化需求（可暂缓）。
2. **后端/服务**（若尚未实现）：
   - 建议 Node + Nest/Fastify 编排上传、AI 任务；使用队列（BullMQ）处理长耗时任务。
   - 媒体存储（S3/OSS）；字幕与笔记存数据库（PostgreSQL）。
3. **实时通信**：AI 进度 & 同步播放使用 WebSocket 或 Pusher / Ably。
4. **鉴权**：管理员 vs 学员角色区分，必要时接入 OAuth / 自研账号系统。

### 8.1 推荐栈：Next.js + Supabase
- **动机**：面向海外用户需要 SSR/SEO、全球节点，同时希望减少后端自建成本。Next.js 提供前端 + API 框架，Supabase 提供 BaaS（数据库/Auth/Storage/Edge Functions）。
- **架构分工**：
   - Next.js App Router 负责 UI、国际化、路由、Server Actions/API Routes（处理 Gemini/字幕解析等逻辑）。
   - Supabase 负责 Postgres、Auth、Storage（视频封面、字幕文件）、Realtime；Edge Functions 可承接后台任务（如通知、批处理回调）。
- **迁移策略**：
   1. 保留现有 UI 组件，迁入 Next.js 项目（或逐步重写页面）。
   2. 配置 Supabase 项目：创建 schema（视频、字幕、收藏、笔记、AI Jobs）、开通 Auth。
   3. Next.js 接入 Supabase 客户端：客户端 SDK 用于前端会话，Server Client 用于 API Route/Server Action。
   4. 部署：Next.js → Vercel（或 Supabase edge runtime），Supabase → 官方托管（新加坡/美国区）。必要时可自托管 Supabase 于海外云。
- **优势**：上线快、维护成本低、依赖成熟生态；同时保留后续接入自定义 Node 服务或队列的空间。

## 9. 里程碑
| 阶段 | 时间 | 交付 |
| --- | --- | --- |
| M1：信息架构 & 设计系统 | 第 1-2 周 | 高保真设计稿、色板、组件规范 |
| M2：管理员工作台 | 第 3-5 周 | 上传→字幕→打谱全链路、内容发布后台 |
| M3：学员播放器 & 学习工具 | 第 6-8 周 | 新播放器、字幕同步、收藏/笔记/AI 讲解 |
| M4：优化 & 上线 | 第 9 周 | 性能优化、可观测性、部署脚本 |

## 10. 风险与对策
| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Gemini API 速率/费用 | 影响批量打谱 | 设计批处理 + 缓存，必要时接入备份模型 |
| 视频处理耗时 | 上传体验差 | 采用分块上传 + 后端异步回调；前端实时显示进度 |
| UI/AI 协同复杂 | 交付周期拉长 | 按角色拆分迭代；先上线基础播放器，再叠加 AI 工具 |
| 收藏/笔记同步 | 数据一致性 | 使用乐观更新 + 后端冲突检测 |

## 11. 下一步
1. 输出高保真线框和色板以锁定视觉方向。
2. 评估引入第三方播放器（Plyr/Video.js）的最佳方案并做 PoC。
3. 设计 AI 任务 API（上传、状态查询、重试）。
4. 整理用户研究（管理员 vs 学员），验证功能优先级。

## 12. 执行清单（实时更新）
- [x] 阶段 0：规划完成 —— 需求梳理、AI 流程、UI 指南、风险分析全部写入 `plan.md`。
- [x] 阶段 1：信息架构 & 设计系统 —— ✅ 交付文档：`docs/stage1.md`（站点地图、token、组件规范、高保真线框概述）。
- [ ] 阶段 2：管理员工作台 —— 实现上传→字幕→打谱全链路及内容发布后台（详见 `docs/stage2.md`）。
- [ ] 阶段 3：学员播放器 & 学习工具 —— 上线新播放器、字幕同步、收藏/笔记/AI 讲解。
- [ ] 阶段 4：性能与发布 —— 完成优化、监控、部署脚本与上线准备。

## 13. 阶段 1 工作拆解（进行中）
1. **信息架构升级**
    - 站点地图（V1）：
       - 顶层：`/discover`, `/favorites`, `/history`, `/studio/upload`, `/studio/:assetId/edit`, `/studio/library`, `/profile`, `/settings`。
       - 管理员区块：`/studio/upload`（上传面板）、`/studio/:assetId/edit`（字幕/打谱工作区）、`/studio/library`（内容列表）。
       - 学员区块：`/discover`（精选/推荐）、`/discover/:tag`（按分类筛选）、`/learn/:videoId`（播放器）、`/learn/:videoId/notes`（独立笔记视图，可在移动端分屏）。
    - 关键用户流程：
       1. 管理员 *素素材入库*：上传 → 自动/手动字幕 → AI 发音谱 → 预览 → 发布至库。
       2. 学员 *沉浸练习*：浏览推荐 → 进入播放器 → 同步字幕滚动 → 收藏/笔记/AI 讲解 → 复习提醒。
       3. 学员 *快速复习*：从收藏/历史进入 → 跳转到特定句 → 查看笔记/讲解 → 继续播放。
    - 导航与权限矩阵：
       | 页面 | 学员可见 | 管理员可见 | 权限说明 |
       | --- | --- | --- | --- |
       | /discover, /favorites, /history | ✅ | ✅ | 管理员可体验学员界面，但数据区分角色 |
       | /learn/:videoId | ✅ | ✅ | 需登录；学员可收藏/笔记，管理员默认只读 |
       | /studio/upload | ❌ | ✅ | 需要管理员角色 & 上传权限 |
       | /studio/:assetId/edit | ❌ | ✅ | 包含字幕/打谱、AI 状态面板 |
       | /studio/library | ❌ | ✅ | 管理内容库、发布状态 |
       | /profile, /settings | ✅ | ✅ | 提供角色切换入口（若具备双身份） |
2. **视觉系统设定**
    - 色彩 Token（Light/Dark 自动切换）：
       | Token | Light | Dark | 用途 |
       | --- | --- | --- | --- |
       | `--color-bg` | #F8FAFF | #030712 | 页面背景、毛玻璃容器 |
       | `--color-surface` | rgba(255,255,255,0.85) | rgba(15,23,42,0.85) | 卡片/面板背景 |
       | `--color-primary` | #2563EB | #60A5FA | 交互主色、按钮、强调文本 |
       | `--color-accent` | #F4D35E | #F2C14E | 进度/提示、收藏状态 |
       | `--color-success` | #22C55E | #4ADE80 | AI 处理成功、标签 |
       | `--color-warning` | #F97316 | #FDBA74 | 上传/翻译告警 |
    - 字体 & 层级：
       - 默认字体：`"SF Pro Display", "SF Pro Text", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`。
       - 等宽：`"JetBrains Mono", "SF Mono", monospace` 用于发音谱和代码。
       - 层级（示例）：H1 34/40，H2 28/34，H3 22/28，Body 16/24，Caption 13/18。
    - 网格 & 间距：
       - Desktop：最大宽 1440px，12 列，列间距 24px，外边距 48px。
       - Mobile：最大宽 768px，6 列，列间距 16px。
       - 间距 token：4 / 8 / 12 / 16 / 24 / 32 / 48 / 72；组件优先使用倍数，确保苹果式秩序感。
    - 暗/浅模式策略：通过 CSS `:root[data-theme=dark]` 切换上述 token；玻璃态容器叠加 `backdrop-filter: blur(20px)` 并控制 `border` 透明度。
3. **核心组件库**
    - 技术栈：Tailwind 原子类 + Radix Primitives（Dialog, Tabs, HoverCard, DropdownMenu) + Framer Motion 动效。
    - 组件清单：
       | 组件 | 状态/交互 | 备注 |
       | --- | --- | --- |
       | Button (Primary/Secondary/Ghost) | 默认 / Hover / Active / Loading / Disabled | Apple 式圆角 16px，阴影最小化 |
       | Input + FileDrop | 聚焦 glow、错误提示、拖拽上传文件 | 管理端上传面板共用 |
       | Card / Glass Panel | 透明度分级、支持插槽 Header/Body/Actions | 用于视频卡片、AI 状态面板 |
       | Tab Stack | Radix Tabs + 软滑块指示器 | 学员端面板 (练习 / 收藏 / 讲解) |
       | Transcript List Item | 激活/待处理/AI 生成中 | 包含收藏、笔记按钮及进度点 |
       | Player Controls | 播放/暂停、±5s、倍速、字幕切换、剧场模式、全屏 | 响应式布局 + 触控优化 |
       | Modal / Sheet | 上滑、毛玻璃背景、ESC/手势关闭 | 用于 AI 讲解、收藏列表等 |
    - 输出：
       - Figma 组件集：提供 Auto Layout、变量、交互原型。
       - Storybook：每个组件展示 State/Variant/组合示例，配合 Chromatic 做回归。
4. **交互线框（High-fidelity Wireframes）**
    - 管理员工作台：
       1. 上传页：左侧文件区 + 上传进度，右侧队列 / 历史任务。
       2. 字幕页：双栏对照（原文/译文），顶部展示 AI 状态进度条，侧边展示 Job 事件。
       3. 打谱页：中央时间线 + Prosody 预览，右侧可手动编辑 notation。
    - 学员播放器：
       - 视图分层：视频（可切剧场/全屏）+ 下方操控区；右侧 Tabs（练习、收藏、AI 讲解）。
       - 字幕同步：中央 spotlight，列表虚拟滚动，激活句折光强调；可点击跳转到时间戳。
       - 收藏/笔记：侧滑 Sheet，支持 Markdown、贴时间；收藏用星标收纳。
    - 移动端：播放器置顶、面板下拉为全屏 Sheet；控制条放大触控区；支持系统手势。
5. **交付与验证**
   - 每个子项内循环：草稿 → 评审 → 修订；完成后在此清单上方勾选“阶段 1”。

## 14. 阶段 2 工作拆解（管理员工作台）
> 详细执行方案已整理到 `docs/stage2.md`，本节保留概要，供快速浏览。
> 目标：在第 3-5 周交付管理员端“上传 → 字幕 → 打谱 → 发布”全链路，可由少量运营同学完成批量处理。

### 14.1 依赖与准备
1. **设计资产**：Stage 1 产出的色彩/字体 token、Storybook 设计系统、线框需全部可用；Figma 组件库（待建）与 Storybook 组件需要在本阶段持续同步。
2. **技术底座**：
   - Next.js + Supabase 骨架：在开始 UI 开发前创建新仓库或子目录，配置 App Router、Tailwind、Supabase 客户端。
   - Supabase Schema：
     - `media_assets`（id, title, duration, status, cover_url, created_by...）
     - `transcripts`（id, asset_id, start_time, end_time, text_en, text_cn, notation, status）
     - `jobs`（id, asset_id, type: upload|transcribe|notation, payload, status, progress, error, created_at, updated_at）
   - 文件存储：Supabase Storage 或 S3，用于视频源文件 + 中间字幕/封面。
3. **AI 服务配置**：
   - 环境变量：Gemini API Key、备用翻译服务、AI 任务队列（如 Cloud Tasks/BullMQ）。
   - 本地代理脚本：批量触发 `generateProsodyNotation` 需具备速率限制与重试策略。

### 14.2 模块拆解
1. **上传 & 任务队列**
   - 前端：Dropzone（支持拖拽、点击选文件、多任务队列），实时展示进度、解码状态；失败可重试。
   - 后端：分块上传（Resumable / Supabase Storage Signed URL），写入 `jobs` 表并启动转码/字幕提取。
   - AI 集成：完成上传后自动推送“转写” Job，支持暂停/恢复。
2. **字幕工作台**
   - UI：双栏对照（原文/译文），支持分页/虚拟滚动、批量编辑、搜索/过滤（状态、关键词）。
   - 功能：手动上传 SRT/VTT、粘贴文本；单语字幕自动触发机器翻译；提供“锁定/解锁”状态防止 AI 覆盖人工修改。
   - 数据：实时更新 `transcripts` 表；保存草稿状态，允许回滚。
3. **AI 发音谱面板**
   - 批处理控制：针对选中行或整条视频触发“生成/重跑”按钮，展示进度条、剩余时间估算。
   - 可视化：引用 Stage 1 Prosody Renderer，允许手动编辑 notation（富文本或结构化 JSON）。
   - 错误处理：单句失败可重试，提供日志/原因（超时、限流等）。
4. **发布 & 内容库**
   - 列表视图：筛选（状态、语言、时长、标签）、排序、搜索。
   - 操作：预览（打开播放器）、发布到学员端、复制分享链接、删除/归档。
   - 权限：仅管理员可见；后续可引入多角色（运营、审校）细粒度权限。

### 14.3 交付节奏
| Sprint | 重点 | 验收 |
| --- | --- | --- |
| S1（第3周） | Next.js + Supabase scaffolding、上传队列、`media_assets`/`jobs` API | 能上传视频并看到 Job 状态变化 |
| S2（第4周） | 字幕工作台 UI、AI 转写 & 翻译串联、`transcripts` CRUD | 管理员可导入字幕、AI 自动补齐缺失语言 |
| S3（第5周） | 发音谱生成面板、发布列表、与学员端数据同步 | 整条流程可完成并发布，Stage 2 复盘 |

### 14.4 立即行动项
> 2025-12-25：`apps/admin` 已完成脚手架并复用 Stage 1 token；`sql/schema.sql` 已落库，等待接 Supabase 实例。

1. 创建 `apps/admin`（Next.js 15 + App Router + Tailwind + Supabase）骨架，并迁移现有通用组件。
2. 在 Supabase 控制台建库 & Storage bucket，写好 `sql/schema.sql` 以便版本化。
3. 实现上传任务的最小可用版本（单文件 → Supabase Storage → Job 记录），并在 Storybook 中继续补充上传组件的状态 Story。
4. 与设计配合，沿用 `design/figma-tokens.json` + `docs/figma-library.md` 建好的 Figma 组件库基线，后续新增组件时保持 token / Storybook 同步。

## 15. 代码结构规划
- 详见 `docs/structure.md`：给出“apps（learner/admin）+ packages（ui/services/types/config）”的目标布局以及迁移 Checklist。
- 建议在 Stage 2 第 1 周完成 workspace + learner app 搬迁，其余共享包在 Stage 2/3 中逐步抽离。
