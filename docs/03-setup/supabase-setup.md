# Supabase 建设指南（Stage 2）

本指南帮助你为 EchoSpeak 管理端准备 Supabase 基础设施：创建项目、配置 Storage Bucket、应用 `sql/schema.sql` 并把连接信息注入 Next.js。完成后即可把“上传 → 字幕 → AI 打谱 → 发布”流程逐步切到真实数据面。

---

## 1. 前置条件

1. 安装 [Supabase CLI](https://supabase.com/docs/guides/cli)（需 Docker，用于本地调试）或准备好 Supabase 控制台账号。
2. 本地 Node.js `>=20`，并已在仓库根目录执行 `npm install`。
3. 拥有 Gemini API Key（供 AI 服务调用，见 `.env.local.example`）。

> Supabase CLI 并非必须；若只在云端管理，可直接使用 Supabase Web 控制台 + SQL 编辑器。

## 2. 创建 Supabase 项目

1. 登录 [app.supabase.com](https://app.supabase.com/) 并进入你的组织。
2. 点击 **New project**：
   - 选择靠近主要用户的区域（如 `Singapore`）。
   - 设置数据库密码（记下，后续 CLI 连接会用到）。
   - 可选：把 `Project Name` 设置为 `EchoSpeak Admin` 便于识别。
3. 创建完成后，在 `Project Settings → API` 记录：
   - `Project URL`（例如 `https://xxxx.supabase.co`）。
   - `anon public` key。
   - `service_role` key（仅供 Server Action 使用，勿暴露给前端）。

## 3. 配置 Storage Bucket

1. 打开 `Storage → Buckets → New bucket`。
2. 建议创建：
   - `media-uploads`（私有，用于原始视频 + 中间文件）。
   - `media-covers`（公有，存封面图，便于学员端读取）。
3. 如果需要 CDN/缓存，可在项目后期开启 [Image Transformation](https://supabase.com/docs/guides/storage/image-transformations)。

## 4. 应用数据库 Schema

> `sql/schema.sql` 已内置 media_assets / transcripts / jobs 表结构，可直接复制执行。

### 4.1 通过 SQL 编辑器
1. 进入 `SQL Editor → + New query`。
2. 把 `sql/schema.sql` 全部复制进去并运行。
3. 确认 `media_assets`、`transcripts`、`jobs` 已出现在 `Table editor`。

### 4.2 通过 Supabase CLI（可选）
1. 在本地仓库根目录执行：
   ```powershell
   supabase init
   supabase link --project-ref <your-project-ref>
   supabase db push --file sql/schema.sql
   ```
2. CLI 会把 schema 同步到云端项目，同时生成 `supabase/config.toml`（纳入 `.gitignore` 以免泄漏 project ref）。

## 5. 注入环境变量

在仓库根目录复制 `.env.local.example` 并补齐以下字段：

```env
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=media-uploads
SUPABASE_COVER_BUCKET=media-covers
SUPABASE_DEFAULT_USER_ID=uuid-from-auth-users
```

- `NEXT_PUBLIC_*` 前缀会注入前端，用于 Upload/Realtime SDK。
- `SUPABASE_SERVICE_ROLE_KEY` 仅在 Server Action/API Route 中使用，切勿泄露到客户端 bundle。
- 根据实际建的 bucket 名称调整 `SUPABASE_*_BUCKET`。
- `SUPABASE_DEFAULT_USER_ID`：如果暂未接入 Supabase Auth，可在 `auth.users` 中创建一个“运营账号”并复制其 `id`，供 Server Action 作为 `media_assets.created_by` 默认值；后续上线真实登录后可移除这个变量。

## 6. 管理端对接检查清单

1. `apps/admin/src/utils` 中的上传签名逻辑改为调用 Supabase Storage `createSignedUploadUrl`（或 Edge Function 统一处理）。
2. `/api/upload/sign`：
   - 验证用户权限。
   - 调 `supabase.storage.from(media-uploads).createSignedUrl()` 返回 `url + assetId`。
   - 在 `public.media_assets` / `public.jobs` 写入记录。
3. `/api/jobs`：订阅 Supabase Realtime（`jobs` 表）或使用 Edge Function 推送。
4. `/api/ai/*` Server Action：读取 `SUPABASE_SERVICE_ROLE_KEY`，把 AI 结果写回 `transcripts.notation` / `status`。
5. 发布流程：Server Action 更新 `media_assets.status='published'`，再调用 Supabase Webhook（或学员端监听 Realtime）。

## 7. 验证步骤

1. 本地运行管理员端：
   ```powershell
   npm run dev --workspace @echospeak/admin
   ```
2. 使用任意 100MB+ 视频走完整上传流程，观察 `Storage` 与 `media_assets` 的记录。
3. 在 Supabase Studio 中确认：
   - `media_assets` 自动新增记录，`status` 进入 `processing`。
   - `jobs` 有 `upload` 记录，`progress` 正常更新。
4. 若需导出/备份，使用 `supabase db dump` 并保存至 `sql/`（不要覆盖 `schema.sql`，另存 `migrations/`）。

---

完成以上步骤后，Stage 2 的“数据层”依赖即算落地，可以继续对接字幕/Prosody/发布等模块的真实 API。后续若要扩展更多表或触发器，建议新增 migration 并更新本文件。