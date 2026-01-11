# Admin 登录重定向问题 - 最终解决方案

## 问题描述

管理员账户登录成功，但页面停留在登录页面，无法重定向到工作台。

## 根本原因

**核心问题**: Session 存储位置不匹配

1. **登录页面** 使用 `@supabase/supabase-js` 的 `createClient`
   - Session 默认存储在 **localStorage** (浏览器端)

2. **中间件** (middleware.ts) 运行在 **服务器端**
   - 无法访问浏览器的 localStorage
   - 只能读取 **cookies**
   - 因此无法识别用户已登录，一直重定向回登录页

## 解决方案

### 修改 1: 登录页面使用 `createBrowserClient`

**文件**: `apps/admin/src/app/login/page.tsx`

```typescript
// ❌ 修改前
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 修改后
import { createBrowserClient } from '@supabase/ssr';

const [supabase] = useState(() =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
);
```

### 修改 2: 导航栏添加退出登录按钮

**文件**: `apps/admin/src/components/layout/AdminNav.tsx`

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};

// 在用户菜单区域添加
<button
  onClick={handleLogout}
  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
>
  退出登录
</button>
```

### 修改 3: 为登录页面创建独立布局

**文件**: `apps/admin/src/app/login/layout.tsx`

```typescript
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

这样登录页面不会显示导航栏。

## 技术说明

### Supabase 客户端类型对比

| 客户端 | 包 | Session 存储 | 适用场景 |
|--------|-----|--------------|----------|
| `createClient` | `@supabase/supabase-js` | localStorage | 纯客户端应用 (Vite, CRA) |
| `createBrowserClient` | `@supabase/ssr` | Cookies | Next.js, Remix 等 SSR 框架 |
| `createServerClient` | `@supabase/ssr` | Cookies | Next.js Middleware, API Routes |

### 为什么 Next.js 需要特殊处理？

1. **中间件运行在服务器端**
   - 在页面渲染之前执行
   - 无法访问浏览器的 localStorage
   - 只能读取 HTTP 请求中的 cookies

2. **App Router 的 SSR 特性**
   - 组件可能在服务器端渲染
   - 需要服务器端也能访问 session
   - Cookies 是唯一的选择

## 验证步骤

### 1. 重启 Admin App

```bash
cd apps/admin
npm run dev
```

### 2. 清除旧的 Session

```
1. 打开浏览器开发者工具 (F12)
2. 切换到 Application 标签
3. 找到 Cookies → http://localhost:3000
4. 删除所有 sb- 开头的 cookies
5. 同时清空 localStorage (Local Storage)
```

### 3. 测试登录

```
1. 访问 http://localhost:3000
2. 自动重定向到 /login
3. 输入:
   - 邮箱: admin@echospeak.test
   - 密码: admin1234
4. 点击登录
```

### 4. 验证成功

- ✅ 看到 "✓ 登录成功，正在跳转..."
- ✅ 页面自动跳转到首页 `/`
- ✅ 显示上传工作台
- ✅ 导航栏右上角显示 "退出登录" 按钮
- ✅ 在 Application → Cookies 中看到 `sb-...` cookies

## 相关文件

| 文件 | 修改内容 |
|------|----------|
| `apps/admin/src/app/login/page.tsx` | 使用 `createBrowserClient` |
| `apps/admin/src/components/layout/AdminNav.tsx` | 添加退出登录功能 |
| `apps/admin/src/app/login/layout.tsx` | 新建，隐藏导航栏 |
| `apps/admin/src/app/unauthorized/layout.tsx` | 新建，隐藏导航栏 |
| `apps/admin/src/middleware.ts` | 保持不变，已经正确配置 |

## 其他注意事项

### Learner App (Vite)

Learner App 使用 Vite，不是 SSR 框架，可以继续使用 `@supabase/supabase-js`:

```typescript
// apps/learner/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### 环境变量

确保 `.env.local` 包含:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DEFAULT_USER_ID=a7853331-d2df-448c-bd9a-7273a58ba0a7
```

## 总结

这个问题的核心在于理解 Next.js 15 App Router 的 SSR 特性：
- **客户端** → **服务器** (中间件) 的通信必须通过 **cookies**
- `@supabase/ssr` 包提供了专门的 `createBrowserClient` 来处理这个场景
- 使用 `createBrowserClient` 后，session 自动存储在 cookies 中，中间件可以正确读取

---

生成时间: 2025-12-30
版本: v2.0 (最终解决方案)
