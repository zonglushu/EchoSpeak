# Supabase 配置完成报告

## ✅ 已完成的配置

### 1. Supabase 项目信息
- **项目名称**: EchoSpeak-Admin
- **项目 ID**: qpdmmzfravgswrezxsci
- **区域**: ap-southeast-1 (新加坡)
- **状态**: ACTIVE_HEALTHY
- **数据库版本**: PostgreSQL 17.6.1

### 2. 数据库表结构

#### `media_assets` (31 rows)
内容资产主表，存储视频/音频元数据
- `id`: UUID (主键)
- `title`: 标题
- `description`: 描述
- `duration_seconds`: 时长
- `status`: 状态 (draft|processing|published|archived)
- `cover_url`: 封面图 URL
- `source_url`: 源文件 URL
- `tag_list`: 标签数组
- `created_by`: 创建者 UUID
- `created_at` / `updated_at`: 时间戳

#### `transcripts` (0 rows)
字幕表，存储双语字幕和 AI 韵律标注
- `id`: UUID (主键)
- `asset_id`: 关联 media_assets
- `sequence`: 序号
- `start_time_ms` / `end_time_ms`: 时间轴
- `text_en` / `text_cn`: 双语文本
- `notation`: JSONB (AI 韵律标注)
- `lock_state`: 锁定状态
- `status`: 状态 (pending|ai_generating|ready|error)
- `updated_by`: 更新者 UUID
- `updated_at`: 更新时间

#### `jobs` (31 rows)
异步任务队列表
- `id`: UUID (主键)
- `asset_id`: 关联 media_assets
- `type`: 任务类型 (upload|transcribe|translate|notation)
- `payload`: JSONB 任务参数
- `status`: 状态 (queued|running|success|failed|canceled)
- `progress`: 进度 0-100
- `error`: 错误信息
- `retries`: 重试次数
- `created_at` / `updated_at`: 时间戳

### 3. Storage Buckets

#### `media-uploads` (私有)
- 用途: 存储原始上传视频文件
- 访问控制: 需要签名 URL
- 创建时间: 2025-12-26

#### `media-covers` (公有)
- 用途: 存储封面图片，学员端可直接访问
- 访问控制: 公开读取
- 创建时间: 2025-12-26

### 4. 连接配置

```
Project URL: https://qpdmmzfravgswrezxsci.supabase.co
Anon Key: eyJhbGci...（已配置在 .env.local.example）
Service Role Key: 需在 Supabase 控制台获取
```

### 5. TypeScript 类型定义

已生成完整的数据库类型定义：
- `apps/admin/src/types/database.types.ts`

包含所有表的 Row/Insert/Update 类型，可在代码中获得完整的类型提示。

---

## 🚀 下一步操作

### 1. 配置本地环境变量

复制 `.env.local.example` 为 `.env.local`，并补充：

```bash
# 必填项
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 从 Supabase Dashboard 获取

# 可选项（若未接入 Supabase Auth）
SUPABASE_DEFAULT_USER_ID=00000000-0000-0000-0000-000000000000
```

### 2. 验证连接

运行 Admin app 并测试连接：

```bash
npm run dev:admin
```

访问 http://localhost:3000，尝试上传文件，观察：
- Supabase Storage 中是否出现 `media-uploads/{assetId}/{filename}`
- `media_assets` 表是否新增记录
- `jobs` 表是否创建上传任务

### 3. 检查安全策略（RLS）

在 Supabase Dashboard 的 SQL Editor 中运行：

```sql
-- 查看 RLS 策略
SELECT * FROM pg_policies WHERE tablename IN ('media_assets', 'transcripts', 'jobs');
```

### 4. （可选）创建默认运营账号

若未接入 Supabase Auth，可在 Supabase Dashboard 的 Authentication 中创建用户，然后将其 UUID 填入 `SUPABASE_DEFAULT_USER_ID`。

---

## 📊 当前数据统计

- **media_assets**: 31 条记录
- **transcripts**: 0 条记录
- **jobs**: 31 条记录

---

## 📚 参考文档

- [Supabase 建设指南](./supabase-setup.md)
- [Stage 2 计划](./stage2.md)
- [AI4Writing 总体设计](./AI4Writing.md)

---

生成时间: 2025-12-30
配置版本: v1.0
