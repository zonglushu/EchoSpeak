# 06-deployment - 部署文档

本目录将包含生产环境部署和运维相关文档。

## 📝 待补充内容

### 计划添加的文档

1. **Vercel 部署指南**
   - Admin App 部署配置
   - Learner App 部署配置
   - 环境变量设置
   - 域名配置

2. **Supabase 生产配置**
   - 生产数据库迁移
   - Storage 配置优化
   - Edge Functions 部署
   - 备份策略

3. **CI/CD 流程**
   - GitHub Actions 配置
   - 自动化测试
   - 自动化部署
   - 版本发布流程

4. **监控与日志**
   - Vercel Analytics 集成
   - Supabase 监控
   - 错误追踪（Sentry）
   - 性能监控

5. **安全配置**
   - 环境变量安全管理
   - API Key 轮换策略
   - RLS 策略审计
   - CORS 配置

6. **性能优化**
   - CDN 配置
   - 缓存策略
   - 图片优化
   - 数据库索引优化

---

## 🚧 开发中

部署文档将在项目接近生产就绪时补充完整。

---

## 📄 临时部署笔记

### 当前部署架构（规划）

```
Vercel (Global CDN)
├── Admin App (SSR)
│   └── https://admin.echospeak.app
└── Learner App (Static)
    └── https://app.echospeak.com

Supabase (Singapore Region)
├── Postgres Database
├── Storage (S3-compatible)
└── Edge Functions
```

### 环境变量（生产）

#### Admin App
- `GEMINI_API_KEY` - Server-side only
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- `SUPABASE_DEFAULT_USER_ID`

#### Learner App
- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_ADMIN_API_URL`

---

## 🔒 安全检查清单

在部署到生产环境前，确保：

- [ ] 所有 API Keys 使用环境变量，不硬编码
- [ ] Service Role Key 仅在服务端使用
- [ ] Supabase RLS 策略已配置并测试
- [ ] CORS 已正确配置
- [ ] 敏感数据已加密
- [ ] 日志不包含敏感信息
- [ ] 备份策略已配置
- [ ] 监控和告警已设置

---

## 📊 性能目标

- **Admin App**
  - First Load: < 3s
  - Time to Interactive: < 5s
  - Lighthouse Score: > 90

- **Learner App**
  - First Load: < 2s
  - Time to Interactive: < 3s
  - Lighthouse Score: > 95

- **API Response**
  - 95th percentile: < 500ms
  - Error Rate: < 0.1%

---

## 🤝 贡献

如果你正在准备部署相关内容，请：
1. 在此目录创建对应的部署文档
2. 包含详细的步骤说明和截图
3. 提供故障排查指南
4. 更新本 README

---

**最后更新**：2026-01-02  
**状态**：📝 待补充
