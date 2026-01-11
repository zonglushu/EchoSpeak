# 登录问题诊断指南

## 🔍 问题：管理员登录后停留在登录页面

### 已实施的修复

#### 1. 修复了 Session 存储方式 ✅ 最终解决方案
**问题**: 登录页使用 `@supabase/supabase-js` 的 `createClient`，session 存储在 localStorage，但中间件运行在服务器端，无法读取 localStorage

**解决**: 将登录页改为使用 `@supabase/ssr` 的 `createBrowserClient`，session 存储在 cookies 中，中间件可以正确读取

```typescript
// apps/admin/src/app/login/page.tsx
import { createBrowserClient } from '@supabase/ssr';

const [supabase] = useState(() =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
);
```

#### 2. 修复了用户创建方式
**问题**: 用户通过 SQL 直接插入，密码加密方式与 Supabase Auth 不兼容

**解决**: 使用 Supabase Auth Admin API 重新创建所有用户
```bash
npx tsx scripts/create-users.ts
```

#### 2. 修复了中间件 cookies 配置
**问题**: 中间件无法正确读取用户 session

**解决**: 更新 `apps/admin/src/middleware.ts`，提供完整的 cookie 接口

#### 3. 添加了登录延迟
**问题**: Session 还没保存完成就重定向

**解决**: 添加 1 秒延迟确保 session 完全保存

#### 4. 添加了调试日志
**解决**: 在登录页面添加 console.log，可以在浏览器开发者工具中查看

---

## 🧪 测试步骤

### 1. 重启 Admin App

```bash
cd apps/admin
# 停止当前运行的服务 (Ctrl+C)
npm run dev
```

### 2. 打开浏览器开发者工具

```
1. 访问 http://localhost:3000
2. 应该会自动重定向到 /login
3. 按 F12 打开开发者工具
4. 切换到 Console 标签
```

### 3. 执行登录

```
邮箱: admin@echospeak.test
密码: admin1234
```

### 4. 观察控制台输出

**应该看到**:
```
开始登录... admin@echospeak.test
登录成功，用户数据: { id: "...", email: "admin@echospeak.test", ... }
用户角色: admin
准备重定向到: /
```

**如果看到错误**，请复制完整的错误信息。

---

## 🐛 如果仍然无法登录

### 检查清单

#### 1. 检查环境变量
```bash
cd apps/admin
cat .env.local
```

确保以下变量存在且正确：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qpdmmzfravgswrezxsci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...（完整的 key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...（完整的 key）
SUPABASE_DEFAULT_USER_ID=a7853331-d2df-448c-bd9a-7273a58ba0a7
```

#### 2. 检查用户是否存在
```bash
npx tsx scripts/test-auth.ts
```

应该看到：
```
✅ 管理员登录成功!
   用户ID: a7853331-d2df-448c-bd9a-7273a58ba0a7
```

#### 3. 清除浏览器 cookies

```
1. 打开开发者工具 (F12)
2. 切换到 Application 标签
3. 在左侧找到 "Cookies"
4. 展开 http://localhost:3000
5. 删除所有 sb- 开头的 cookies
6. 刷新页面重新登录
```

#### 4. 检查浏览器网络请求

```
1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 登录一次
4. 查找请求到 https://qpdmmzfravgswrezxsci.supabase.co
```

**应该看到成功的请求** (200 状态码)

---

## 🔧 手动验证登录状态

### 方法 1: 使用浏览器控制台

在登录后的页面控制台中输入：

```javascript
// 检查 localStorage
console.log('localStorage:', localStorage);

// 检查是否有 Supabase session
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://qpdmmzfravgswrezxsci.supabase.co',
  'eyJhbGci...'  // 使用完整的 anon key
);

supabase.auth.getUser().then(console.log);
```

### 方法 2: 直接访问 API

```bash
curl -X POST 'https://qpdmmzfravgswrezxsci.supabase.co/auth/v1/token?grant_type=password' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGci...' \
  -d '{
    "email": "admin@echospeak.test",
    "password": "admin1234"
  }'
```

---

## 📝 已创建的正确用户

| 邮箱 | 密码 | 用户 ID |
|------|------|---------|
| `admin@echospeak.test` | `admin1234` | `a7853331-d2df-448c-bd9a-7273a58ba0a7` |
| `free-user@echospeak.test` | `test1234` | `a684e0d3-4af3-4fef-97d1-1adc3f81d09f` |
| `pro-user@echospeak.test` | `test1234` | `def0a768-136e-449a-bba3-ed00287f549e` |
| `premium-user@echospeak.test` | `test1234` | `78ced267-247b-4e5a-b59a-ab90db297f76` |

---

## 🚨 常见错误及解决方案

### 错误 1: "Database error querying schema"
**原因**: 用户密码加密方式错误
**解决**: 已使用 Auth Admin API 重新创建用户

### 错误 2: 登录成功但立即重定向回登录页
**原因**: Session 没有正确保存
**解决**:
1. 清除浏览器 cookies
2. 确保中间件配置正确
3. 检查环境变量

### 错误 3: "此账户无管理员权限"
**原因**: 用户角色不是 admin
**解决**: 确保使用 `admin@echospeak.test`

---

## ✅ 验证成功的标志

1. **登录页面** 显示 "✓ 登录成功，正在跳转..."
2. **控制台** 显示登录成功的用户数据
3. **页面** 自动跳转到首页 `/`
4. **首页** 显示上传工作台等内容
5. **导航栏** 右上角显示 "退出登录" 按钮
6. **Session** 存储在 cookies 中 (不是 localStorage)

---

## 📞 如果问题仍然存在

请提供以下信息：

1. **浏览器控制台的完整输出** (Console 标签)
2. **Network 标签中的请求响应**
3. **环境变量配置** (可以隐藏密钥的部分)
4. **是否能看到 "登录成功，正在跳转" 的消息**

---

生成时间: 2025-12-30
版本: v1.0
