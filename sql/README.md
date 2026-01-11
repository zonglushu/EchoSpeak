# Database Migration Guide

本指南说明如何创建 Supabase 数据库表和函数。

## 准备工作

1. 在 Supabase 创建项目
2. 获取项目 URL 和 Service Role Key
3. 在 `.env.local` 中配置环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 执行迁移脚本

有两种方式执行 SQL 脚本：

### 方式 1: 使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单 "SQL Editor"
4. 按顺序执行以下脚本：

   ```
   0001_create_content_library.sql
   0002_create_user_quotas.sql
   0003_create_processing_queue.sql
   0004_create_user_processing_history.sql
   0005_create_moderation_logs.sql
   0006_create_cost_tracking.sql
   0007_create_functions.sql
   0008_separate_transcribe_translate.sql  🆕 分离提取字幕和翻译
   ```

5. 点击 "Run" 按钮执行每个脚本

### 方式 2: 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref your-project-id

# 执行迁移
supabase db push
```

## 验证安装

执行以下 SQL 查询验证表已创建：

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到：
-- - content_library
-- - user_quotas
-- - processing_queue
-- - user_processing_history
-- - moderation_logs
-- - cost_tracking

-- 查看所有函数
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 应该看到：
-- - increment_content_stats
-- - update_cache_tier
-- - get_user_quota
-- - update_content_library_updated_at
-- - update_user_quotas_updated_at
-- - reset_daily_quotas
```

## 测试数据

插入一些测试数据：

```sql
-- 测试用户配额
INSERT INTO user_quotas (user_id, tier, daily_basic_limit, daily_full_limit)
VALUES ('test-user-1', 'free', 3, 1);

-- 测试内容库条目
INSERT INTO content_library (
  youtube_id,
  raw_subtitles,
  language_code,
  title,
  duration,
  difficulty_level
) VALUES (
  'test123',
  '[{"id": "1", "text": "Hello world", "translation": "你好世界", "startTime": 0, "endTime": 2}]'::jsonb,
  'en',
  'Test Video',
  120,
  'beginner'
);

-- 查询测试数据
SELECT * FROM user_quotas;
SELECT * FROM content_library;
```

## 行级安全策略 (RLS)

如果需要启用 RLS，执行：

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

## 清理数据

如需清理所有数据（仅用于开发环境）：

```sql
TRUNCATE TABLE cost_tracking CASCADE;
TRUNCATE TABLE moderation_logs CASCADE;
TRUNCATE TABLE user_processing_history CASCADE;
TRUNCATE TABLE processing_queue CASCADE;
TRUNCATE TABLE content_library CASCADE;
TRUNCATE TABLE user_quotas CASCADE;
```

## 故障排查

### 问题：函数不存在

确保 `0007_create_functions.sql` 已执行。

### 问题：权限错误

确保使用 Service Role Key 而不是 Anon Key。

### 问题：表不存在

检查所有迁移脚本是否按顺序执行完成。
