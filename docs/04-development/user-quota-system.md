# 用户配额系统文档

## 📋 测试用户账户

已创建 3 个测试用户，每个等级一个：

### 🔰 Free 用户（免费层）
- **邮箱**: `free-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `40689470-de3c-4752-bcf7-bd8917d40165`
- **每日配额**:
  - 基础版 AI 标注: 3 次/天
  - 完整版 AI 标注: 1 次/天

### 💎 Pro 用户（$9.99/月）
- **邮箱**: `pro-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `f16e37d0-e257-4096-b1fd-7ef7776a1a08`
- **每日配额**:
  - 基础版 AI 标注: 20 次/天
  - 完整版 AI 标注: 5 次/天
  - 无限访问原始字幕（Layer 1）

### 👑 Premium 用户（$19.99/月）
- **邮箱**: `premium-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `3b5c52be-23af-41a6-8071-2de007011174`
- **每日配额**:
  - 基础版 AI 标注: 无限
  - 完整版 AI 标注: 无限
  - 优先处理（高优先级队列）
  - 离线下载功能

---

## 🗄️ 数据库表结构

### `public.user_quotas`

```sql
CREATE TABLE public.user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),

    -- 配额层级
    tier VARCHAR(20) CHECK (tier IN ('free', 'pro', 'premium')),

    -- 每日配额
    daily_basic_limit INT DEFAULT 3,
    daily_full_limit INT DEFAULT 1,
    resets_at TIMESTAMP DEFAULT DATE(NOW() + INTERVAL '1 day'),

    -- 当前使用量
    basic_used_today INT DEFAULT 0,
    full_used_today INT DEFAULT 0,

    -- 历史统计
    total_basic_used INT DEFAULT 0,
    total_full_used INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**字段说明**：
- `tier`: 用户等级 (free/pro/premium)
- `daily_basic_limit`: 每日基础版配额（-1 表示无限）
- `daily_full_limit`: 每日完整版配额（-1 表示无限）
- `basic_used_today`: 今天已使用的基础版次数
- `full_used_today`: 今天已使用的完整版次数
- `total_basic_used`: 历史累计基础版使用次数
- `total_full_used`: 历史累计完整版使用次数

---

## 🔧 数据库函数

### 1. `check_user_quota(user_id, tier)` - 检查用户配额

检查用户是否有足够的配额执行请求。

**参数**：
- `user_id`: UUID - 用户 ID
- `tier`: 'basic' | 'full' - 处理层级

**返回示例**：
```json
{
  "allowed": true,
  "tier": "free",
  "type": "basic",
  "remaining": 3,
  "limit": 3
}
```

**配额超限示例**：
```json
{
  "allowed": false,
  "tier": "free",
  "type": "basic",
  "reason": "quota_exceeded",
  "message": "Daily basic quota exceeded",
  "used": 3,
  "limit": 3
}
```

---

### 2. `consume_quota(user_id, tier)` - 扣减用户配额

在成功执行 AI 处理后调用，扣减用户配额。

**参数**：
- `user_id`: UUID - 用户 ID
- `tier`: 'basic' | 'full' - 处理层级

**返回示例**：
```json
{
  "success": true,
  "tier": "free",
  "type": "basic",
  "basic_remaining": 2,
  "full_remaining": 1
}
```

---

### 3. `reset_daily_quotas()` - 重置每日配额

每日定时任务调用，重置所有用户的每日使用量。

**返回**: 重置的用户数量

**使用方法**（Supabase Edge Function Cron）：
```typescript
// 在 Supabase Dashboard 中配置 cron: 每天凌晨执行
SELECT reset_daily_quotas();
```

---

## 💡 使用示例

### 示例 1: 检查配额

```typescript
// apps/admin/src/app/api/quota/check/route.ts
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

export async function POST(request: NextRequest) {
  const { userId, tier } = await request.json();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase.rpc('check_user_quota', {
    p_user_id: userId,
    p_tier: tier
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 检查是否允许
  if (!data.allowed) {
    return Response.json({
      allowed: false,
      reason: data.reason,
      message: data.message
    }, { status: 429 }); // 429 Too Many Requests
  }

  return Response.json({ allowed: true, remaining: data.remaining });
}
```

### 示例 2: 扣减配额

```typescript
// 在 AI 处理成功后扣减配额
const { data: quotaResult } = await supabase.rpc('consume_quota', {
  p_user_id: userId,
  p_tier: 'full'
});

if (quotaResult?.success) {
  console.log('配额扣减成功');
  console.log('剩余基础版:', quotaResult.basic_remaining);
  console.log('剩余完整版:', quotaResult.full_remaining);
}
```

### 示例 3: 查询用户配额状态

```typescript
// 获取用户当前配额状态
const { data: quota } = await supabase
  .from('user_quotas')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log('用户等级:', quota.tier);
console.log('今日基础版已用:', quota.basic_used_today, '/', quota.daily_basic_limit);
console.log('今日完整版已用:', quota.full_used_today, '/', quota.daily_full_limit);
console.log('历史累计基础版:', quota.total_basic_used);
console.log('历史累计完整版:', quota.total_full_used);
```

---

## ⚙️ 配额策略

### Free 层（免费）
- 每日 3 个基础版（Layer 2）
- 每日 1 个完整版（Layer 3）
- 理由：提供真实价值而非"空心免费增值"

### Pro 层（$9.99/月）
- 每日 20 个基础版
- 每日 5 个完整版
- 无限访问 Layer 1（原始字幕）

### Premium 层（$19.99/月）
- 无限基础版 + 完整版
- 优先处理（priority = 10）
- 离线下载功能

### 特殊规则
- ✓ 精选内容不消耗配额
- ✓ 分享奖励：邀请好友 → +3 个配额
- ✓ 连续学习奖励：连续7天 → +5 个配额

---

## 🔄 定时任务设置

在 Supabase Dashboard 中配置 Cron Job：

1. 进入 **Edge Functions** → **Cron**
2. 创建新的 cron 任务：
   - **名称**: `reset-daily-quotas`
   - **表达式**: `0 0 * * *`（每天凌晨 00:00）
   - **函数**: 调用 `reset_daily_quotas()`

或者使用 Supabase SQL Editor 创建 pg_cron 任务：

```sql
-- 需要先启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天凌晨重置配额
SELECT cron.schedule(
    'reset-daily-quotas',
    '0 0 * * *',
    $$SELECT reset_daily_quotas()$$
);
```

---

## 📊 监控与统计

### 查看所有用户配额使用情况

```sql
SELECT
    u.email,
    q.tier,
    q.basic_used_today,
    q.daily_basic_limit,
    q.full_used_today,
    q.daily_full_limit,
    q.total_basic_used,
    q.total_full_used,
    q.resets_at
FROM auth.users u
JOIN public.user_quotas q ON u.id = q.user_id
ORDER BY q.tier, q.created_at;
```

### 查看配额即将用完的用户

```sql
SELECT
    u.email,
    q.tier,
    q.basic_used_today,
    q.daily_basic_limit,
    q.full_used_today,
    q.daily_full_limit
FROM auth.users u
JOIN public.user_quotas q ON u.id = q.user_id
WHERE
    q.tier != 'premium'
    AND (
        q.basic_used_today >= q.daily_basic_limit * 0.8
        OR q.full_used_today >= q.daily_full_limit * 0.8
    );
```

---

## 🔐 安全策略

RLS 策略已配置：
- ✅ 用户可以查看自己的配额
- ✅ Service role 有完全访问权限
- ✅ 普通用户无法修改配额

---

## 📝 更新记录

- **2025-12-30**: 初始创建
  - 创建 user_quotas 表
  - 创建 3 个测试用户
  - 实现配额管理函数
  - 配置 RLS 策略

---

生成时间: 2025-12-30
版本: v1.0
