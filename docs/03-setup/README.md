# 03-setup - 环境配置

本目录包含开发环境搭建和初始化配置指南。

## 📄 文档列表

### [`supabase-setup.md`](supabase-setup.md) ⭐
**Supabase 数据库集成设置指南** - 必读文档

包含内容：
- 前置要求
- 环境变量配置（密钥获取位置）
- 数据库表创建（SQL Editor / CLI）
- 验证安装（测试连接）
- 插入测试数据
- 故障排查

**适合人群**：所有开发者（必须完成此配置才能启动项目）

---

### [`supabase-setup-root.md`](supabase-setup-root.md)
**Supabase 配置指南（根目录版本）**

注：这是从根目录迁移过来的版本，内容与 `supabase-setup.md` 类似，建议合并。

---

### [`supabase-status.md`](supabase-status.md)
**Supabase 配置完成状态报告**

包含内容：
- 已完成的配置清单
- Supabase 项目信息（项目 ID、区域）
- 数据库表结构详细说明
- Storage Buckets 配置
- TypeScript 类型定义
- 下一步操作指引

**适合人群**：查看当前配置状态、验证设置是否正确

---

### [`auth-setup-complete.md`](auth-setup-complete.md)
**EchoSpeak 账户与认证系统配置完成**

包含内容：
- 用户账户创建（管理员 + 学员测试账户）
- 数据库表和函数（user_quotas、配额管理函数）
- Admin App 配置（登录验证中间件、登录页面）
- Learner App 配置（配额查询 API）
- 环境变量配置
- 使用指南（测试登录）

**适合人群**：测试登录功能、了解用户权限体系

---

### [`user-accounts.md`](user-accounts.md)
**用户账户说明文档**

包含内容：
- 测试账户列表（邮箱、密码、角色）
- 账户用途说明
- 登录入口区分

**适合人群**：快速查找测试账户

---

### [`learner-app-setup.md`](learner-app-setup.md)
**Learner App Supabase 集成指南**

包含内容：
- 配置说明（Vite vs Next.js 区别）
- 已安装的依赖
- 文件结构
- 环境变量配置（VITE_ 前缀）
- 使用示例（基础客户端、配额 Hook、检查和扣减配额）
- 常见问题

**适合人群**：Learner App 开发者

---

## 🚀 快速开始

### 首次配置（必须完成）

1. **复制环境变量**
   ```bash
   cp .env.local.example .env.local
   ```

2. **配置 Supabase**（按照 [`supabase-setup.md`](supabase-setup.md) 操作）
   - 创建 Supabase 项目
   - 获取 URL 和 Keys
   - 执行 SQL 脚本创建表

3. **配置 Gemini API**
   - 获取 API Key
   - 填入 `.env.local` 中的 `GEMINI_API_KEY`

4. **验证配置**
   ```bash
   npm install
   npm run dev:admin  # 访问 http://localhost:3000
   npm run dev:learner  # 访问 http://localhost:5173
   ```

### 测试账户

登录时使用（详见 [`user-accounts.md`](user-accounts.md)）：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@echospeak.test` | `admin1234` |
| Free 学员 | `free-user@echospeak.test` | `test1234` |
| Pro 学员 | `pro-user@echospeak.test` | `test1234` |
| Premium 学员 | `premium-user@echospeak.test` | `test1234` |

---

## 🔍 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 `.env.local` 中的 Supabase URL 和 Keys
   - 确认 SQL 脚本已执行完毕

2. **登录失败**
   - 检查用户账户是否已创建
   - 查看 [`auth-setup-complete.md`](auth-setup-complete.md)

3. **AI 功能不可用**
   - 确认 `GEMINI_API_KEY` 已配置
   - 检查 API 配额是否充足

---

**最后更新**：2026-01-02
