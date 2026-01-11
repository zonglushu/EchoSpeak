# Learner App Supabase 集成指南

## 🔧 配置说明

Learner App 是基于 **Vite** 的单页应用（SPA），不是 Next.js，因此：
- ❌ 不能使用 App Router 的 API 路由
- ✅ 直接使用 Supabase 客户端从浏览器调用
- ✅ Supabase RLS 保护数据安全

---

## 📦 已安装的依赖

```bash
# 在 apps/learner 目录下
@supabase/supabase-js  # Supabase 客户端库
```

---

## 📁 文件结构

```
apps/learner/
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Supabase 客户端配置
│   ├── hooks/
│   │   └── useQuota.ts           # 配额查询 Hook
│   └── components/
│       └── QuotaDisplay.tsx      # 配额显示组件
├── .env.example                   # 环境变量示例
└── package.json
```

---

## 🔑 环境变量配置

### 1. 复制环境变量文件
```bash
cd apps/learner
cp .env.example .env
```

### 2. 配置内容
```bash
# Supabase 配置
VITE_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...（已配置）
```

**注意**: Vite 使用 `VITE_` 前缀，而不是 Next.js 的 `NEXT_PUBLIC_` 前缀。

---

## 💻 使用示例

### 1. 基础客户端使用

```typescript
import { supabase } from '@/lib/supabase';

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();
console.log('当前用户:', user?.email);

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'free-user@echospeak.test',
  password: 'test1234',
});

// 登出
await supabase.auth.signOut();
```

### 2. 使用配额 Hook

```typescript
import { useQuota } from '@/hooks/useQuota';

function MyComponent() {
  const { quota, loading, error, refetch } = useQuota();

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h3>{quota.tier} 用户</h3>
      <p>基础版剩余: {quota.basic_remaining}</p>
      <p>完整版剩余: {quota.full_remaining}</p>
    </div>
  );
}
```

### 3. 检查和扣减配额

```typescript
import { checkUserQuota, consumeQuota } from '@/lib/supabase';

async function handleProcessContent(tier: 'basic' | 'full') {
  // 1. 检查配额
  const { allowed, remaining } = await checkUserQuota(tier);

  if (!allowed) {
    alert('配额不足');
    return;
  }

  console.log('剩余配额:', remaining);

  // 2. 执行 AI 处理
  await processAI(content);

  // 3. 扣减配额
  const { success, basic_remaining, full_remaining } = await consumeQuota(tier);

  if (success) {
    console.log('配额已扣减');
    console.log('基础版剩余:', basic_remaining);
    console.log('完整版剩余:', full_remaining);
  }
}
```

### 4. 使用配额显示组件

```typescript
import { QuotaDisplay } from '@/components/QuotaDisplay';

function App() {
  return (
    <div>
      <h1>EchoSpeak</h1>
      <QuotaDisplay />
      {/* 其他内容 */}
    </div>
  );
}
```

---

## 🎯 测试账户

| 邮箱 | 密码 | 层级 | 登录端点 |
|------|------|------|----------|
| `free-user@echospeak.test` | `test1234` | Free | Learner App |
| `pro-user@echospeak.test` | `test1234` | Pro | Learner App |
| `premium-user@echospeak.test` | `test1234` | Premium | Learner App |

---

## 🚀 启动 Learner App

```bash
cd apps/learner
npm install  # 首次运行需要
npm run dev
# 访问: http://localhost:5173
```

---

## 📊 可用函数

### `supabase` 客户端
```typescript
import { supabase } from '@/lib/supabase';

// 认证
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
await supabase.auth.getUser();

// 数据库查询
const { data } = await supabase.from('user_quotas').select('*');
```

### `getUserQuota()`
```typescript
const quota = await getUserQuota();
// → QuotaInfo | null
```

### `checkUserQuota(tier)`
```typescript
const { allowed, remaining, reason } = await checkUserQuota('full');
// → { allowed: boolean, remaining?: number, reason?: string }
```

### `consumeQuota(tier)`
```typescript
const { success, basic_remaining, full_remaining } = await consumeQuota('basic');
// → { success: boolean, basic_remaining?: number, full_remaining?: number }
```

### `useQuota()` Hook
```typescript
const { quota, loading, error, refetch } = useQuota();
```

---

## 🔒 安全说明

### RLS (Row Level Security) 策略
所有 Supabase 请求都受到 RLS 保护：
- ✅ 用户只能查看自己的配额
- ✅ 用户只能修改自己的配额
- ✅ 无法访问其他用户的数据

### 客户端限制
- `SUPABASE_SERVICE_ROLE_KEY` **仅用于 Admin App**
- Learner App 只使用 `ANON_KEY`
- 配额扣减通过数据库 RPC 函数控制

---

## 📝 与 Admin App 的区别

| 特性 | Admin App (Next.js) | Learner App (Vite) |
|------|---------------------|---------------------|
| **框架** | Next.js 16 | Vite 6 |
| **路由** | App Router | React Router v7 |
| **API** | Server Actions | 直接调用 Supabase |
| **环境变量前缀** | `NEXT_PUBLIC_` | `VITE_` |
| **Supabase 包** | `@supabase/ssr` | `@supabase/supabase-js` |
| **目标用户** | 管理员 | 普通用户 |

---

## 🐛 调试提示

### 配额不更新？
```typescript
// 手动刷新配额
const { refetch } = useQuota();
refetch();
```

### 认证失败？
```bash
# 检查环境变量
cat .env

# 确保 Supabase URL 和 Key 正确
echo $VITE_PUBLIC_SUPABASE_URL
```

### RLS 策略问题？
```sql
-- 在 Supabase SQL Editor 中检查
SELECT * FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_quotas';
```

---

## 📚 相关文档

- [用户账户说明](./user-accounts.md)
- [配额系统文档](./user-quota-system.md)
- [Supabase 客户端文档](https://supabase.com/docs/reference/javascript)

---

生成时间: 2025-12-30
版本: v1.0
