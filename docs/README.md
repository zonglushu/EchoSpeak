# EchoSpeak 文档中心

> 最后更新：2026年1月2日

本目录包含 EchoSpeak 项目的所有技术文档，按功能和阶段分类。

---

## 📁 文档分类

### 📋 01-overview（项目概览）
项目整体介绍、规划和进度追踪文档。

- **`project-overview.md`** - 项目全面概览（架构、进度、功能清单）
- **`plan.md`** - 总体规划与路线图
- **`stage1.md`** - 阶段 1：信息架构与设计系统
- **`stage2.md`** - 阶段 2：管理端工作台开发计划

### 🏗️ 02-architecture（架构设计）
系统架构、技术选型和设计决策文档。

- **`structure.md`** - Monorepo 代码结构规划
- **`AIProvider.md`** - AI 服务架构调研与方案
- **`AI_PROVIDER_GUIDE.md`** - AI 提供商集成指南
- **`figma-library.md`** - 设计系统与 Figma 组件库

### 🔧 03-setup（环境配置）
开发环境搭建和初始化配置指南。

- **`supabase-setup.md`** - Supabase 数据库集成设置（详细步骤）
- **`supabase-status.md`** - Supabase 配置完成状态报告
- **`auth-setup-complete.md`** - 账户与认证系统配置完成报告
- **`user-accounts.md`** - 用户账户说明文档
- **`learner-app-setup.md`** - 学员端 Supabase 集成指南

### 💻 04-development（开发指南）
日常开发、功能实现和问题解决文档。

- **`Admin-APP.md`** - Admin App 优化计划
- **`subtitle-extraction.md`** - 字幕提取实现方案
- **`user-quota-system.md`** - 用户配额系统详细文档
- **`AI4Writing.md`** - AI 写作功能说明

### 🔌 05-api（API 文档）
API 接口文档和调用说明（待补充）。

- _待添加 API 文档_

### 🚀 06-deployment（部署文档）
生产环境部署和运维相关文档（待补充）。

- _待添加部署文档_

### 📦 07-archive（历史归档）
已过时或已解决的问题文档。

- **`auth-fix-summary.md`** - 认证修复总结（已完成）
- **`auth-fixes-complete.md`** - 认证修复详细记录（已完成）
- **`login-troubleshooting.md`** - 登录问题排查（已解决）

---

## 🚀 快速导航

### 新人入门
1. 先读 **`01-overview/project-overview.md`** 了解项目全貌
2. 按照 **`03-setup/supabase-setup.md`** 配置开发环境
3. 查看 **`04-development/Admin-APP.md`** 了解当前开发重点

### 架构设计
- 代码结构：`02-architecture/structure.md`
- AI 服务：`02-architecture/AIProvider.md`
- 设计系统：`02-architecture/figma-library.md`

### 配置和部署
- 数据库配置：`03-setup/supabase-setup.md`
- 认证系统：`03-setup/auth-setup-complete.md`
- 配额管理：`04-development/user-quota-system.md`

---

## 📝 文档维护规范

### 文档命名
- 使用小写字母和连字符（kebab-case）
- 文件名要清晰描述内容
- 示例：`supabase-setup.md`, `user-quota-system.md`

### 文档更新
- 每次重大更新后修改文档顶部的"最后更新"日期
- 添加版本号（如适用）
- 标注文档状态：✅ 完成 / 🚧 进行中 / 📝 待补充 / 📦 已归档

### 文档分类原则
1. **01-overview**：面向所有人，介绍项目是什么
2. **02-architecture**：面向架构师/技术 Leader，为什么这样设计
3. **03-setup**：面向新人，如何搭建环境
4. **04-development**：面向开发者，如何实现功能
5. **05-api**：面向集成者，如何调用接口
6. **06-deployment**：面向运维，如何部署上线
7. **07-archive**：历史文档，已过时但保留参考

---

## 🔄 文档状态

| 分类 | 文档数 | 状态 |
|------|--------|------|
| 01-overview | 4 | ✅ 完整 |
| 02-architecture | 4 | ✅ 完整 |
| 03-setup | 5 | ✅ 完整 |
| 04-development | 4 | 🚧 更新中 |
| 05-api | 0 | 📝 待补充 |
| 06-deployment | 0 | 📝 待补充 |
| 07-archive | 3 | 📦 归档 |

---

## 🤝 贡献指南

### 添加新文档
1. 确定文档属于哪个分类
2. 按命名规范创建文件
3. 更新本 README 的分类列表
4. 提交 PR 并说明文档用途

### 更新现有文档
1. 修改文档内容
2. 更新"最后更新"日期
3. 如有重大变更，添加版本记录
4. 提交 PR

### 归档文档
1. 将过时文档移动到 `07-archive`
2. 在文件顶部添加归档说明和日期
3. 更新本 README
4. 提交 PR

---

**维护者**：EchoSpeak 团队  
**最后审核**：2026-01-02
