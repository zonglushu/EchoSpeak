# EchoSpeak 用户账户配置

## 👔 管理员账户（Admin 端专用）

### 管理员账户
- **邮箱**: `admin@echospeak.test`
- **密码**: `admin1234`
- **用户ID**: `2ef12440-f2e1-4870-a648-a2b44f16a700`
- **角色**: `admin`
- **登录**: 仅限 **Admin App** (http://localhost:3000)
- **权限**:
  - 上传和管理媒体内容
  - 编辑和发布字幕
  - 查看 Job 任务队列
  - 管理所有用户内容

**用途**: 运营团队使用，用于内容管理、审核、发布等后台操作。

---

## 👥 普通用户账户（Learner 端专用）

### 🔰 Free 用户（免费层）
- **邮箱**: `free-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `40689470-de3c-4752-bcf7-bd8917d40165`
- **角色**: `user`
- **层级**: `free`
- **登录**: 仅限 **Learner App** (http://localhost:5173)
- **配额**:
  - 每日 3 次基础版 AI 标注
  - 每日 1 次完整版 AI 标注
  - 无限访问原始字幕（Layer 1）

**用途**: 测试免费用户的功能体验和配额限制。

---

### 💎 Pro 用户（$9.99/月）
- **邮箱**: `pro-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `f16e37d0-e257-4096-b1fd-7ef7776a1a08`
- **角色**: `user`
- **层级**: `pro`
- **登录**: 仅限 **Learner App** (http://localhost:5173)
- **配额**:
  - 每日 20 次基础版 AI 标注
  - 每日 5 次完整版 AI 标注
  - 无限访问原始字幕
  - 优先处理队列

**用途**: 测试付费用户的功能体验和高级配额。

---

### 👑 Premium 用户（$19.99/月）
- **邮箱**: `premium-user@echospeak.test`
- **密码**: `test1234`
- **用户ID**: `3b5c52be-23af-41a6-8071-2de007011174`
- **角色**: `user`
- **层级**: `premium`
- **登录**: 仅限 **Learner App** (http://localhost:5173)
- **配额**:
  - 无限基础版 AI 标注
  - 无限完整版 AI 标注
  - 最高优先级处理
  - 离线下载功能

**用途**: 测试高级用户的无限制功能。

---

## 🔐 登录隔离

### Admin App (http://localhost:3000)
- ✅ 仅允许 `admin@echospeak.test` 登录
- ❌ 拒绝普通用户（free/pro/premium）登录
- 📋 功能：内容管理、上传、字幕编辑、发布

### Learner App (http://localhost:5173)
- ✅ 允许所有普通用户登录
- ❌ 拒绝管理员账户登录
- 📋 功能：学习、跟读、查看配额、访问内容库

---

## 📊 配额查询 API

### Learner App 端点

#### 1. 获取当前用户配额信息
```http
GET /api/quota
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "tier": "pro",
  "daily_basic_limit": 20,
  "daily_full_limit": 5,
  "basic_used_today": 5,
  "full_used_today": 2,
  "total_basic_used": 145,
  "total_full_used": 38,
  "basic_remaining": 15,
  "full_remaining": 3,
  "resets_at": "2025-12-31T00:00:00Z"
}
```

#### 2. 检查是否有足够配额
```http
POST /api/quota
Content-Type: application/json
Authorization: Bearer <token>

{
  "tier": "full"  // 或 "basic"
}
```

**成功响应**：
```json
{
  "allowed": true,
  "tier": "pro",
  "type": "full",
  "remaining": 3
}
```

**配额不足响应** (429):
```json
{
  "allowed": false,
  "reason": "quota_exceeded",
  "message": "Daily full quota exceeded"
}
```

---

## 💻 前端集成示例

### 在 Learner App 中显示配额

```typescript
// apps/learner/src/components/QuotaDisplay.tsx
'use client';

import { useEffect, useState } from 'react';

interface QuotaInfo {
  tier: string;
  basic_remaining: number;
  full_remaining: number;
  resets_at: string;
}

export function QuotaDisplay() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch('/api/quota');
        if (res.ok) {
          const data = await res.json();
          setQuota(data);
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuota();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (!quota) return null;

  const tierColors = {
    free: 'text-gray-600',
    pro: 'text-blue-600',
    premium: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-lg ${tierColors[quota.tier as keyof typeof tierColors]}`}>
          {quota.tier === 'free' && '🔰 免费版'}
          {quota.tier === 'pro' && '💎 专业版'}
          {quota.tier === 'premium' && '👑 高级版'}
        </h3>
        <span className="text-sm text-gray-500">
          重置时间: {new Date(quota.resets_at).toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>基础版 AI 标注:</span>
          <span className="font-semibold">
            {quota.basic_remaining === -1 ? '无限' : `${quota.basic_remaining} 次`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>完整版 AI 标注:</span>
          <span className="font-semibold">
            {quota.full_remaining === -1 ? '无限' : `${quota.full_remaining} 次`}
          </span>
        </div>
      </div>

      {(quota.basic_remaining === 0 || quota.full_remaining === 0) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ 今日配额已用完，明天重置或升级到 Pro 版获得更多配额！
          </p>
        </div>
      )}
    </div>
  );
}
```

### 检查配额后再处理

```typescript
async function handleProcessContent(tier: 'basic' | 'full') {
  // 1. 先检查配额
  const checkRes = await fetch('/api/quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier })
  });

  const checkData = await checkRes.json();

  if (!checkData.allowed) {
    alert(`配额不足: ${checkData.message}`);
    return;
  }

  // 2. 执行 AI 处理
  try {
    const processRes = await fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });

    if (processRes.ok) {
      alert('处理成功！');
      // 刷新配额显示
      window.location.reload();
    }
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
```

---

## 🔧 配额层级对比

| 功能 | Free | Pro | Premium |
|------|------|-----|----------|
| **价格** | 免费 | $9.99/月 | $19.99/月 |
| **基础版 AI/天** | 3 次 | 20 次 | 无限 |
| **完整版 AI/天** | 1 次 | 5 次 | 无限 |
| **原始字幕** | ✅ 无限 | ✅ 无限 | ✅ 无限 |
| **处理优先级** | 普通 | 高 | 最高 |
| **离线下载** | ❌ | ❌ | ✅ |
| **精选内容** | 消耗配额 | 消耗配额 | 免费 |

---

## 🚀 快速开始

### 1. 测试 Admin 端
```bash
cd apps/admin
npm run dev
# 访问 http://localhost:3000
# 登录: admin@echospeak.test / admin1234
```

### 2. 测试 Learner 端
```bash
cd apps/learner
npm run dev
# 访问 http://localhost:5173
# 登录: free-user@echospeak.test / test1234
# 或: pro-user@echospeak.test / test1234
# 或: premium-user@echospeak.test / test1234
```

### 3. 查看配额
在 Learner 端登录后，访问 `/api/quota` 查看当前配额状态。

---

## 📝 环境变量配置

在 `.env.local` 中已配置：

```bash
# 管理员账户 ID（Server Actions 默认值）
SUPABASE_DEFAULT_USER_ID=2ef12440-f2e1-4870-a648-a2b44f16a700

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔄 自动重置

配额会在每天凌晨自动重置。如需手动重置（开发测试）：

```sql
-- 在 Supabase SQL Editor 中执行
SELECT reset_daily_quotas();
```

---

生成时间: 2025-12-30
版本: v1.0
