# EchoSpeak 账户与认证系统配置完成

## ✅ 已完成的配置

### 1. 用户账户创建

#### 👔 管理员账户
- **邮箱**: `admin@echospeak.test`
- **密码**: `admin1234`
- **ID**: `2ef12440-f2e1-4870-a648-a2b44f16a700`
- **角色**: admin
- **登录**: 仅限 Admin App

#### 👥 普通用户账户
| 邮箱 | 密码 | 层级 | 登录端点 | 配额 |
|------|------|------|----------|------|
| `free-user@echospeak.test` | `test1234` | Free | Learner App | 3基础/1完整 每天 |
| `pro-user@echospeak.test` | `test1234` | Pro | Learner App | 20基础/5完整 每天 |
| `premium-user@echospeak.test` | `test1234` | Premium | Learner App | 无限 |

---

### 2. 数据库表和函数

#### `public.user_quotas` 表
- 存储用户配额信息
- 包含每日限制和使用量统计
- 支持三级用户层级（free/pro/premium）
- RLS 策略已配置

#### 配额管理函数
```sql
✓ check_user_quota(user_id, tier)  -- 检查配额
✓ consume_quota(user_id, tier)    -- 扣减配额
✓ reset_daily_quotas()             -- 重置每日配额
```

---

### 3. Admin App 配置

#### 🔒 登录验证中间件
- **文件**: `apps/admin/src/middleware.ts`
- **功能**: 拒绝非管理员用户访问
- **规则**: 仅允许 `user_metadata.role === 'admin'` 的用户

#### 📝 登录页面
- **文件**: `apps/admin/src/app/login/page.tsx`
- **功能**: 管理员登录界面
- **验证**: 登录时双重检查用户角色

#### 🚫 未授权页面
- **文件**: `apps/admin/src/app/unauthorized/page.tsx`
- **功能**: 显示友好的访问拒绝提示
- **指引**: 引导普通用户前往 Learner App

---

### 4. Learner App 配置

#### 📊 配额查询 API
- **文件**: `apps/learner/src/app/api/quota/route.ts`
- **端点**:
  - `GET /api/quota` - 获取当前配额信息
  - `POST /api/quota` - 检查是否有足够配额

#### API 功能
```typescript
// 获取配额信息
GET /api/quota
→ 返回: { tier, basic_remaining, full_remaining, resets_at, ... }

// 检查配额
POST /api/quota { tier: 'full' }
→ 返回: { allowed: true/false, remaining: 3 }
→ 配额不足: HTTP 429
```

---

### 5. 环境变量配置

#### `.env.local.example` 已更新
```bash
# 管理员账户 ID（Server Actions 默认值）
SUPABASE_DEFAULT_USER_ID=2ef12440-f2e1-4870-a648-a2b44f16a700

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 使用指南

### 测试 Admin App
```bash
cd apps/admin
npm run dev
# 访问: http://localhost:3000
# 登录: admin@echospeak.test / admin1234
```

**中间件保护**:
- ✅ 管理员可以访问所有页面
- ❌ 普通用户会被重定向到 `/unauthorized`
- ❌ 未登录用户会被重定向到 `/login`

---

### 测试 Learner App
```bash
cd apps/learner
npm run dev
# 访问: http://localhost:5173
# 登录: free-user@echospeak.test / test1234
#     或: pro-user@echospeak.test / test1234
#     或: premium-user@echospeak.test / test1234
```

**配额显示**:
- 在前端组件中调用 `/api/quota`
- 显示剩余次数和重置时间
- 配额不足时友好提示

---

## 📱 前端集成示例

### Learner App - 配额显示组件

```typescript
// apps/learner/src/components/QuotaDisplay.tsx
'use client';

import { useEffect, useState } from 'react';

export function QuotaDisplay() {
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    fetch('/api/quota')
      .then(res => res.json())
      .then(data => setQuota(data));
  }, []);

  if (!quota) return <div>加载中...</div>;

  return (
    <div className="quota-card">
      <h3>
        {quota.tier === 'free' && '🔰 免费版'}
        {quota.tier === 'pro' && '💎 专业版'}
        {quota.tier === 'premium' && '👑 高级版'}
      </h3>
      <p>基础版剩余: {quota.basic_remaining === -1 ? '无限' : quota.basic_remaining}</p>
      <p>完整版剩余: {quota.full_remaining === -1 ? '无限' : quota.full_remaining}</p>
      <p className="text-sm text-gray-500">
        重置: {new Date(quota.resets_at).toLocaleString()}
      </p>
    </div>
  );
}
```

### 配额检查与处理

```typescript
async function handleAIProcessing(tier: 'basic' | 'full') {
  // 1. 检查配额
  const checkRes = await fetch('/api/quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier })
  });

  const { allowed, remaining } = await checkRes.json();

  if (!allowed) {
    alert('今日配额已用完，明天再试或升级到 Pro 版');
    return;
  }

  // 2. 执行 AI 处理
  await processContent(content, tier);

  // 3. 配额会在后端自动扣减
}
```

---

## 🔐 安全机制

### Admin App
- **中间件验证**: 每次请求都检查用户角色
- **登录验证**: 双重检查（前端 + 后端）
- **自动重定向**: 未授权用户自动跳转

### Learner App
- **Supabase Auth**: 基于JWT的身份验证
- **RLS 策略**: 用户只能查看自己的配额
- **配额隔离**: 不同用户层级独立配额

---

## 📊 配额层级对比

| 功能 | Free | Pro | Premium |
|------|------|-----|----------|
| **价格** | 免费 | $9.99/月 | $19.99/月 |
| **基础版 AI/天** | 3 次 | 20 次 | 无限 |
| **完整版 AI/天** | 1 次 | 5 次 | 无限 |
| **原始字幕** | ✅ 无限 | ✅ 无限 | ✅ 无限 |
| **处理优先级** | 普通 | 高 | 最高 |
| **离线下载** | ❌ | ❌ | ✅ |

---

## 📚 相关文档

- [用户账户详细说明](./user-accounts.md)
- [配额系统文档](./user-quota-system.md)
- [Supabase 配置状态](./supabase-status.md)

---

## ✅ 验证清单

- [x] 管理员账户创建
- [x] 3 个测试用户账户创建
- [x] user_quotas 表创建
- [x] 配额管理函数创建
- [x] Admin 中间件配置
- [x] Admin 登录页面
- [x] Admin 未授权页面
- [x] Learner 配额 API
- [x] 环境变量更新
- [x] 完整文档创建

---

**配置完成时间**: 2025-12-30
**版本**: v1.0
**状态**: ✅ 生产就绪

所有账户和认证系统已配置完成，可以开始使用了！🎉
