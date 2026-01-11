# Supabase 数据库集成设置指南

本指南将帮助你完成 Supabase 数据库的设置和集成。

## 📋 前置要求

- [ ] 已创建 Supabase 账号（https://app.supabase.com）
- [ ] 已创建一个新项目
- [ ] 已安装 Node.js 依赖（`npm install`）

## 🔧 步骤 1：配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# 从 Supabase 项目设置 > API 中获取
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# YouTube API Key（可选，用于获取更准确的元数据）
# YOUTUBE_API_KEY=your-youtube-api-key

# Gemini API Key（必需，用于 AI 功能）
GEMINI_API_KEY=your-gemini-api-key
```

**在哪里找到这些密钥？**

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧 "Settings" > "API"
4. 复制以下内容：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ 步骤 2：创建数据库表

### 方式 A：使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 中，点击左侧 "SQL Editor"
2. 按顺序创建以下表和函数：

```sql
-- 创建内容库表
-- 执行文件：sql/0001_create_content_library.sql
```

点击 "New query"，复制 `sql/0001_create_content_library.sql` 的内容，然后点击 "Run"。

重复执行以下脚本：
- `0002_create_user_quotas.sql`
- `0003_create_processing_queue.sql`
- `0004_create_user_processing_history.sql`
- `0005_create_moderation_logs.sql`
- `0006_create_cost_tracking.sql`
- `0007_create_functions.sql`

### 方式 B：使用 CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录并链接项目
supabase login
supabase link --project-ref your-project-id

# 执行所有迁移
supabase db push
```

## ✅ 步骤 3：验证安装

### 测试数据库连接

启动开发服务器：

```bash
npm run dev:admin
```

访问 http://localhost:3000/api/quota/check?userId=test-user

应该返回配额信息 JSON。

### 查看表结构

在 Supabase Dashboard "Table Editor" 中，你应该看到以下表：

- `content_library`
- `user_quotas`
- `processing_queue`
- `user_processing_history`
- `moderation_logs`
- `cost_tracking`

## 🚀 步骤 4：开始使用

### 测试 YouTube 处理功能

```bash
curl -X POST http://localhost:3000/api/youtube/process \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "userId": "test-user",
    "tier": "basic"
  }'
```

### 测试配额查询

```bash
curl http://localhost:3000/api/quota/check?userId=test-user
```

## 🧪 步骤 5：插入测试数据（可选）

在 Supabase SQL Editor 中执行：

```sql
-- 创建测试用户配额
INSERT INTO user_quotas (user_id, tier, daily_basic_limit, daily_full_limit)
VALUES ('test-user-1', 'free', 3, 1);

-- 创建测试内容
INSERT INTO content_library (
  youtube_id,
  raw_subtitles,
  language_code,
  title,
  duration,
  difficulty_level
) VALUES (
  'test123',
  '[{
    "id": "1",
    "text": "Hello world",
    "translation": "你好世界",
    "startTime": 0,
    "endTime": 2
  }]'::jsonb,
  'en',
  'Test Video',
  120,
  'beginner'
);

-- 验证数据
SELECT * FROM user_quotas;
SELECT * FROM content_library;
```

## 📊 步骤 6：查看实时数据

### 在内容审核页面

访问 http://localhost:3000/moderation，你可以看到：
- 待审核的内容数量
- 内容列表
- 批准/拒绝操作

### 在成本分析页面

访问 http://localhost:3000/analytics，你可以看到：
- 今日成本统计
- 缓存命中率
- 用户排行榜

### 在配额管理页面

访问 http://localhost:3000/quota，你可以看到：
- 配额使用情况
- 重置时间倒计时
- 升级选项

## 🔒 安全设置（生产环境）

### 启用 Row Level Security (RLS)

在 SQL Editor 中执行：

```sql
-- 启用 RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- 允许服务端完全访问
CREATE POLICY "Service full access on content_library"
  ON content_library
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service full access on user_quotas"
  ON user_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 配置 CORS

在 Supabase Dashboard "Configuration" > "URL Configuration" > "CORS" 中添加：

```
http://localhost:3000
```

## 🐛 故障排查

### 问题 1：数据库连接失败

**错误信息：** `Missing NEXT_PUBLIC_SUPABASE_URL environment variable`

**解决方案：**
1. 检查 `.env.local` 文件是否存在
2. 确认环境变量已正确设置
3. 重启开发服务器：`npm run dev:admin`

### 问题 2：表不存在

**错误信息：** `relation "public.content_library" does not exist`

**解决方案：**
1. 确认已执行所有 SQL 迁移脚本
2. 在 Supabase Dashboard "Table Editor" 中检查表是否存在

### 问题 3：权限错误

**错误信息：** `new row violates row-level security policy`

**解决方案：**
1. 检查是否已配置 RLS 策略
2. 确认使用 Service Role Key 而不是 Anon Key

### 问题 4：API 返回 500 错误

**检查步骤：**
1. 查看服务器终端日志
2. 在 Supabase Dashboard "Database Logs" 中查看错误
3. 确认所有环境变量已正确设置

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js API Routes 文档](https://nextjs.org/docs/api-routes/introduction)
- [项目架构文档](../CLAUDE.md)

## 🎯 下一步

数据库集成完成后，你可以：

1. ✅ 测试 YouTube 链接处理
2. ✅ 查看配额使用情况
3. ✅ 审核内容
4. ✅ 监控成本

需要帮助？查看：
- [sql/README.md](sql/README.md) - 数据库迁移指南
- [docs/AI4Writing.md](../docs/AI4Writing.md) - 功能设计文档
