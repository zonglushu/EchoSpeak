# 05-api - API 文档

本目录将包含 EchoSpeak 项目的 API 接口文档和调用说明。

## 📝 待补充内容

### 计划添加的文档

1. **Admin API 文档**
   - 上传 API（`/api/upload/*`）
   - 字幕处理 API（`/api/transcripts/*`）
   - AI 服务 API（`/api/ai/*`）
   - 内容管理 API（`/api/content/*`）
   - YouTube 集成 API（`/api/youtube/*`）

2. **Learner API 文档**
   - 配额查询 API（`/api/quota/*`）
   - 内容浏览 API
   - 收藏/笔记 API（规划中）

3. **Supabase API 使用指南**
   - 数据库查询最佳实践
   - RLS 策略说明
   - Storage API 使用

4. **外部 API 集成**
   - Gemini API 调用规范
   - YouTube API 使用指南

---

## 🚧 开发中

API 文档正在整理中，预计在 Stage 2 完成后补充完整。

当前可以参考：
- Admin App 源码：`apps/admin/src/app/api/`
- Learner App 源码：`apps/learner/src/app/api/`
- Services 包：`packages/services/src/`

---

## 📄 临时 API 速查

### Admin App API Routes

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/upload/sign` | POST | 获取上传签名 URL | ✅ |
| `/api/youtube/process` | POST | 处理 YouTube 视频 | ✅ |
| `/api/transcripts/:id` | GET | 获取字幕详情 | ✅ |
| `/api/ai/translate` | POST | AI 翻译服务 | ✅ |
| `/api/ai/notation` | POST | AI 发音谱生成 | ✅ |
| `/api/content/publish` | POST | 发布内容 | 🚧 |

### Learner App API Routes

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/quota` | GET | 查询用户配额 | ✅ |
| `/api/quota` | POST | 检查配额是否充足 | ✅ |

### Supabase Functions

| 函数名 | 参数 | 返回 | 说明 |
|--------|------|------|------|
| `check_user_quota` | `user_id`, `tier` | JSON | 检查配额 |
| `consume_quota` | `user_id`, `tier` | JSON | 扣减配额 |
| `reset_daily_quotas` | - | void | 重置每日配额 |

---

## 🤝 贡献

如果你正在开发 API 相关功能，请：
1. 在此目录创建对应的 API 文档
2. 使用 OpenAPI/Swagger 格式（推荐）
3. 包含请求/响应示例
4. 更新本 README 的速查表

---

**最后更新**：2026-01-02  
**状态**：📝 待补充
