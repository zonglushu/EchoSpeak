# EchoSpeak 项目全面概览

> 最后更新：2026年1月2日  
> 版本：v0.1.0  
> 状态：活跃开发中（Stage 2 进行中）

---

## 📋 项目简介

**EchoSpeak** 是一套 AI 驱动的口语练习平台，面向"学员端 + 管理端"双角色设计，核心功能是视频字幕跟读与 AI 发音谱标注。

### 核心价值
- 🎯 **学员端**：沉浸式视频学习体验，实时 AI 辅助，收藏/笔记/进度管理
- 🎬 **管理端**：一站式内容生产工作流：上传 → 字幕 → AI 打谱 → 发布
- 🤖 **AI 能力**：Gemini API 驱动的转写、翻译、发音标注（Prosody Notation）
- 🎨 **视觉风格**：苹果式极简设计，毛玻璃效果，精致动效

---

## 🏗️ 技术架构

### Monorepo 结构（npm workspaces）

```
EchoSpeak/
├── apps/
│   ├── learner/          # 学员端 (React 19 + Vite)
│   └── admin/            # 管理端 (Next.js 16 App Router)
├── packages/
│   ├── ui/               # 共享 UI 组件 (ProsodyRenderer, NotationLegend)
│   ├── types/            # TypeScript 类型定义
│   ├── services/         # AI 服务封装 (Gemini, YouTube, 配额管理)
│   └── config/           # Tailwind/ESLint/TS 配置
├── sql/                  # Supabase 数据库 schema
├── docs/                 # 架构与规划文档
└── stories/              # Storybook 组件库
```

### 技术栈对比

| 层级 | Learner App | Admin App |
|------|-------------|-----------|
| **框架** | React 19 + Vite | Next.js 16 (App Router) |
| **样式** | Tailwind CSS | Tailwind + Radix UI |
| **状态** | 本地 useState | Zustand (工作流状态) |
| **数据库** | Supabase 客户端 | Supabase (SSR + Server Actions) |
| **部署** | 静态托管 (Vercel/Netlify) | Vercel (SSR) |
| **特点** | 浏览器 IndexedDB 缓存 | 完整的后端 API 路由 |

---

## 🗄️ 数据库架构（Supabase）

### 核心表结构

#### 1. `media_assets` - 内容资产
```sql
id              uuid (PK)
title           text
description     text
duration_seconds int
status          enum: draft | processing | published | archived
cover_url       text
source_url      text
tag_list        text[]
created_by      uuid (FK -> auth.users)
created_at      timestamptz
updated_at      timestamptz
```

#### 2. `transcripts` - 字幕/标注
```sql
id              uuid (PK)
asset_id        uuid (FK -> media_assets)
sequence        int
start_time_ms   int
end_time_ms     int
text_en         text
text_cn         text
notation        jsonb (AI 发音谱)
lock_state      enum: locked | unlocked
status          enum: pending | ai_generating | ready | error
updated_by      uuid (FK -> auth.users)
updated_at      timestamptz
```

#### 3. `jobs` - 异步任务队列
```sql
id              uuid (PK)
asset_id        uuid (FK -> media_assets)
type            enum: upload | transcribe | translate | notation
payload         jsonb
status          enum: queued | running | success | failed | canceled
progress        numeric (0-100)
error           text
retries         int
created_at      timestamptz
updated_at      timestamptz
```

#### 4. `user_quotas` - 用户配额
```sql
user_id             uuid (FK -> auth.users)
tier                enum: free | pro | premium
daily_basic_limit   int (-1 = 无限)
daily_full_limit    int
basic_used_today    int
full_used_today     int
total_basic_used    int
total_full_used     int
resets_at           timestamptz
```

### Storage Buckets
- **`media-uploads`** (私有)：原始视频文件
- **`media-covers`** (公开)：封面图片

---

## 🔑 核心功能模块

### 1. 学员端 (Learner App)

#### 已实现功能 ✅
- **播放器**：YouTube 嵌入式播放器
- **字幕同步**：滚动高亮、点击跳转
- **AI 标注渲染**：ProsodyRenderer 组件（重音、连读、语调）
- **IndexedDB 缓存**：离线视频库
- **配额显示**：实时查询用户剩余次数

#### 待开发功能 📝
- 收藏/笔记系统
- AI 讲解面板（词汇解释、语音要点）
- 进度追踪与复习提醒
- 移动端优化布局

### 2. 管理端 (Admin App)

#### 已实现功能 ✅
- **多步骤工作流**：上传 → 字幕 → 打谱 → 发布
- **YouTube 集成**：URL 解析、字幕提取、元数据获取
- **字幕工作台**：
  - 虚拟列表（react-virtuoso）支持 1000+ 行
  - SRT/VTT 导入/导出
  - AI 翻译（单语→双语）
  - 单句锁定/批量编辑
- **发音谱面板**：
  - 批量 AI 标注生成
  - 进度条与实时预览
  - 错误重试机制
- **内容库管理**：
  - 31 条测试数据
  - 状态筛选与搜索
  - 一键发布至学员端

#### 待完善功能 📝
- 封面自动截取与编辑
- 批量操作优化（并发控制）
- 实时进度推送（WebSocket/SSE）
- 任务重试策略优化

---

## 🤖 AI 服务架构

### Gemini API 集成

#### 三大核心功能
1. **`generateProsodyNotation()`** - 发音谱生成
   - 输入：英文句子
   - 输出：带标注的文本 (`*strong*, ~rise~, [liaison]`)
   - 调用方式：Admin App API 路由 + 客户端调用

2. **`bilingualizeText()`** - 双语字幕生成
   - 输入：原始字幕文本 + 语言
   - 输出：对齐的双语 TranscriptLine 数组
   - 用途：单语字幕自动翻译

3. **`transcribeMedia()`** - 音频转写（规划中）
   - 输入：视频/音频 base64
   - 输出：时间码对齐的字幕
   - 用途：无字幕视频的 STT

### AI 调用流程

```
Learner/Admin UI
    ↓
Admin API Route (/api/ai/*)
    ↓
packages/services (geminiService)
    ↓
Gemini 1.5 Flash API
    ↓
返回标注结果 → 写入 transcripts.notation
```

### 配额管理
- **Free 用户**：3 基础/1 完整 每天
- **Pro 用户**：20 基础/5 完整 每天
- **Premium 用户**：无限制
- **检查点**：API 调用前后端双重验证
- **重置机制**：每日 UTC 0:00 自动重置

---

## 🎨 设计系统 (Stage 1)

### 色彩规范
| 用途 | 色值 | 说明 |
|------|------|------|
| **主色调** | `#0F172A` | 深空蓝（背景） |
| **辅助色** | `#3B82F6` | 霓虹蓝（交互） |
| **强调色** | `#F4D35E` | 柔和金（提示） |
| **文本** | `#F8FAFC` / `#CBD5E1` | 主文本/次要文本 |

### 组件库（packages/ui）
- **`ProsodyRenderer`**：韵律标注渲染
  - 支持重音（`*stress*`）
  - 连读（`[liaison]`）
  - 语调（`~rise~`, `↘fall↘`）
- **`NotationLegend`**：图例说明面板

### Tailwind 配置
- 主题 token 在 `packages/config/tailwind-preset.ts`
- 全局样式在 `packages/ui/src/theme.css`
- 动效：40-200ms 过渡，毛玻璃效果

---

## 🔐 认证与权限

### 用户角色

#### 1. 管理员账户
- **邮箱**：`admin@echospeak.test`
- **密码**：`admin1234`
- **权限**：仅可访问 Admin App
- **验证**：middleware.ts 检查 `user_metadata.role === 'admin'`

#### 2. 学员账户（测试）
| 层级 | 邮箱 | 密码 | 配额 |
|------|------|------|------|
| Free | `free-user@echospeak.test` | `test1234` | 3/1 |
| Pro | `pro-user@echospeak.test` | `test1234` | 20/5 |
| Premium | `premium-user@echospeak.test` | `test1234` | 无限 |

### RLS 策略
- Service Role：完全访问（Server Actions）
- Authenticated：根据 user_id 过滤
- Anon：仅读取已发布内容（规划中）

---

## 📦 共享包详解

### packages/services
**导出函数**：
- `generateProsodyNotation()` - AI 标注
- `bilingualizeText()` - AI 翻译
- `extractYouTubeId()` - YouTube URL 解析
- `fetchYouTubeMetadata()` - 获取视频信息
- `fetchYouTubeSubtitles()` - 提取字幕
- `checkUserQuota()` - 配额验证
- `consumeQuota()` - 扣减配额
- `createProcessingTask()` - 任务队列管理

### packages/types
**核心类型**：
```typescript
TranscriptLine              // 字幕行
MediaAsset                  // 视频资产
UploadJob                   // 上传任务
UserQuota                   // 用户配额
MediaAssetStatus            // draft | processing | published | archived
TranscriptProductionStatus  // pending | ai_generating | ready | error
```

### packages/config
- **Tailwind Preset**：主题色、字体、间距
- **ESLint Config**：代码规范
- **TypeScript Config**：路径别名、编译选项

---

## 🚀 开发工作流

### 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入 Gemini API Key 和 Supabase 配置

# 3. 启动学员端（端口 5173）
npm run dev:learner

# 4. 启动管理端（端口 3000）
npm run dev:admin

# 5. 启动 Storybook（端口 6006）
npm run storybook
```

### 常用命令
```bash
# 构建
npm run build:learner
npm run build:admin
npm run build-storybook

# 代码检查
npm run lint:admin

# 数据库迁移（首次运行）
# 在 Supabase SQL Editor 中执行 sql/schema.sql
```

---

## 📊 项目进展（Milestones）

### ✅ 已完成
- [x] **Stage 0**：需求分析、技术选型、风险评估
- [x] **Stage 1**：信息架构、设计系统、组件规范
- [x] **Monorepo 迁移**：workspace 结构、共享包拆分
- [x] **Supabase 配置**：数据库 schema、Storage、Auth
- [x] **Admin 核心功能**：上传、字幕、打谱工作流
- [x] **Learner 播放器**：YouTube 集成、字幕同步

### 🚧 进行中（Stage 2）
- [ ] **工作流优化**：Wizard 模式、步骤引导
- [ ] **批量操作**：并发控制、进度实时推送
- [ ] **错误处理**：统一错误提示、重试机制
- [ ] **性能优化**：虚拟列表、懒加载、缓存策略

### 📝 待规划（Stage 3）
- [ ] **学员端完整功能**：收藏、笔记、AI 讲解
- [ ] **移动端适配**：响应式布局、触摸优化
- [ ] **数据分析**：学习进度、热门内容、用户行为
- [ ] **社交功能**：分享、评论、排行榜

### 🔮 未来规划（Stage 4+）
- [ ] **离线模式**：PWA、Service Worker
- [ ] **多语言支持**：国际化（i18n）
- [ ] **实时协作**：多人编辑字幕
- [ ] **高级 AI**：语音识别、发音评分

---

## 📈 数据统计（当前状态）

| 指标 | 数值 | 说明 |
|------|------|------|
| **内容资产** | 31 条 | media_assets 表 |
| **字幕条目** | 0 条 | transcripts 表（待填充） |
| **任务记录** | 31 条 | jobs 表（测试数据） |
| **注册用户** | 4 个 | 1 管理员 + 3 测试学员 |
| **Storage 使用** | <100MB | 测试视频与封面 |

---

## 🔧 技术债务与优化点

### 紧急（本周）
1. **Admin 页面重构**：移除损坏的旧组件，统一使用 `-new` 版本
2. **环境变量管理**：确保所有必需的 key 都有示例
3. **错误日志**：统一错误格式，便于调试

### 重要（本月）
4. **Storybook 更新**：添加新组件的 stories
5. **CI/CD 完善**：自动化测试、部署脚本
6. **文档补充**：API 文档、组件使用指南

### 改进（季度）
7. **类型安全**：强化 Supabase 类型生成
8. **性能监控**：Sentry/Vercel Analytics 集成
9. **安全审计**：RLS 策略复审、XSS/CSRF 防护

---

## 🌐 部署架构（规划）

### 生产环境
```
Vercel (Global CDN)
├── Admin App (SSR)
│   └── https://admin.echospeak.app
└── Learner App (Static)
    └── https://app.echospeak.com

Supabase (Singapore Region)
├── Postgres Database
├── Storage (S3-compatible)
└── Edge Functions
```

### 环境变量（生产）
- **Admin App**：Service Role Key（后端安全）
- **Learner App**：Anon Key（前端公开）
- **Gemini API**：Server-side 调用，不暴露给前端

---

## 📚 关键文档索引

### 规划文档
- **`plan.md`**：总体规划、功能路线图、风险分析
- **`stage1.md`**：设计系统、信息架构
- **`stage2.md`**：管理端工作台详细设计
- **`structure.md`**：Monorepo 架构迁移指南

### 技术文档
- **`SUPABASE_SETUP.md`**：数据库配置步骤
- **`auth-setup-complete.md`**：用户认证与权限
- **`user-quota-system.md`**：配额系统详解
- **`AIProvider.md`**：AI 服务架构调研

### 开发文档
- **`Admin-APP.md`**：管理端优化计划
- **`learner-app-setup.md`**：学员端集成指南
- **`CLAUDE.md`**：Claude Code 协作指南

---

## 🐛 已知问题

### Admin App
1. **旧版组件未清理**：`UploadWorkbench.tsx` 文件损坏
2. **页面布局问题**：4 个面板堆叠，需要 Wizard 模式
3. **实时进度缺失**：任务状态需手动刷新

### Learner App
4. **配额 UI 未集成**：虽然 Hook 已实现，但未在主界面显示
5. **移动端体验差**：布局未适配小屏幕
6. **离线功能不完整**：IndexedDB 缓存未与 Supabase 同步

### 共享包
7. **ProsodyRenderer 样式冲突**：在不同 app 中显示不一致
8. **类型导出不完整**：部分内部类型未在 index.ts 中暴露

---

## 🎯 近期目标（2 周内）

### Admin 侧
- [ ] 清理旧组件，重命名 `-new` 后缀
- [ ] 实现 Wizard 步骤导航
- [ ] 完善批量操作进度条
- [ ] 添加封面上传与裁剪

### Learner 侧
- [ ] 集成配额显示组件
- [ ] 实现收藏功能（前端 + Supabase）
- [ ] 添加笔记编辑器（Markdown）
- [ ] 移动端布局优化

### 基础设施
- [ ] 补充单元测试（Vitest）
- [ ] 添加 E2E 测试（Playwright）
- [ ] 配置 GitHub Actions（CI/CD）
- [ ] 编写 API 文档（OpenAPI）

---

## 🤝 团队协作

### Git 工作流
- **主分支**：`main`（保护分支）
- **开发分支**：`develop`（日常开发）
- **功能分支**：`feature/xxx`（新功能）
- **修复分支**：`fix/xxx`（Bug 修复）

### 提交规范
```
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式（不影响逻辑）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链更新
```

### Code Review 要点
- TypeScript 类型完整性
- Supabase RLS 策略正确性
- 性能影响（大数据量测试）
- 错误处理完整性
- 文档与注释更新

---

## 📞 联系方式

- **GitHub**：https://github.com/zonglushu/EchoSpeak
- **项目文档**：本仓库 `docs/` 目录
- **问题反馈**：GitHub Issues

---

**最后更新**：本文档会随项目迭代持续更新。查看 Git 历史了解变更详情。

---

## 附录：环境变量完整清单

### 根目录 `.env.local`
```bash
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Supabase（全局）
NEXT_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage
SUPABASE_STORAGE_BUCKET=media-uploads
SUPABASE_COVER_BUCKET=media-covers

# 管理员账户
SUPABASE_DEFAULT_USER_ID=2ef12440-f2e1-4870-a648-a2b44f16a700

# 可选：YouTube API
YOUTUBE_API_KEY=your-youtube-api-key
```

### Learner App `.env` (Vite)
```bash
# 注意：Vite 使用 VITE_ 前缀
VITE_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 可选：Admin API 地址（跨域调用）
VITE_ADMIN_API_URL=http://localhost:3000
```

---

**文档版本**：v1.0  
**生成时间**：2026-01-02  
**生成工具**：Claude Code  
