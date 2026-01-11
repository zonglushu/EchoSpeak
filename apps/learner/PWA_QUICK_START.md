# EchoSpeak PWA 使用指南

## ✅ 问题已修复

之前的错误已解决！现在开发模式和生产模式分别优化：

## 🚀 启动方式

### 开发模式（日常开发）
```bash
npm run dev:learner
```
- ✅ 快速热更新
- ✅ 无 Service Worker 错误
- ✅ 正常开发体验
- **PWA 功能：禁用**（开发时不需要）

### 生产模式（测试 PWA）
```bash
# 1. 构建
npm run build:learner

# 2. 预览
npm run preview --workspace @echospeak/learner
```
- ✅ Service Worker 已启用
- ✅ PWA 功能完整
- ✅ 可以测试安装、离线等功能
- **PWA 功能：启用**

---

## 📋 测试 PWA 功能的完整流程

### 步骤 1：构建应用
```bash
cd apps/learner
npm run build
```

### 步骤 2：启动预览
```bash
npm run preview
```

### 步骤 3：访问应用
```
http://localhost:4173
```

### 步骤 4：验证 PWA
打开 Chrome DevTools（F12）：

1. **检查 Service Worker**
   ```
   Application → Service Workers
   ```
   ✅ 应该看到：Status: activated

2. **检查 Manifest**
   ```
   Application → Manifest
   ```
   ✅ 应该看到：应用名称、图标等

3. **检查缓存**
   ```
   Application → Cache Storage
   ```
   ✅ 应该看到：workbox-precache-v2-...

4. **运行 Lighthouse**
   ```
   Lighthouse → Progressive Web App → Analyze
   ```
   ✅ 目标得分 ≥ 90

---

## 🔧 配置说明

### vite.config.ts
```typescript
devOptions: {
  enabled: false, // 开发模式禁用 PWA
}
```
**原因**：开发模式下，Vite 不支持 Service Worker 的正确 MIME type

### main.tsx
```typescript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // 只在生产模式下注册 SW
}
```
**原因**：避免开发模式下的注册错误

---

## 💡 工作流程对比

### 开发时（日常）
```bash
npm run dev:learner    # 启动开发服务器
# 访问 http://localhost:5173
# 正常开发，热更新工作
# PWA 功能：禁用 ✅
```

### 测试 PWA 时（发布前）
```bash
npm run build:learner  # 构建
npm run preview        # 预览
# 访问 http://localhost:4173
# PWA 功能：启用 ✅
# 可以测试安装、离线
```

### 部署到生产
```bash
npm run build:learner  # 构建
# 上传 dist/ 目录到服务器
# PWA 功能：自动启用 ✅
```

---

## 🎯 常见问题

### Q1: 为什么开发模式不启用 PWA？
**A**:
- 开发时需要快速热更新
- Service Worker 会干扰开发体验
- Vite 开发服务器不支持 SW 的正确 MIME type
- 生产构建时才启用，测试更准确

### Q2: 如何测试 PWA 功能？
**A**:
```bash
npm run build:learner
npm run preview
```
然后访问 http://localhost:4173

### Q3: 开发模式能看到 PWA 效果吗？
**A**:
- 开发模式：不能（但开发更快）
- 生产预览：可以（`npm run build && npm run preview`）
- 生产部署：可以（上线后自动启用）

### Q4: YouTube API 错误怎么办？
**A**: 这个错误可以忽略：
```
no-response: The strategy could not generate a response for 'https://www.youtube.com/iframe_api'
```
**原因**: YouTube 跨域请求被缓存策略拦截（正常现象）
**影响**: 无，YouTube 视频仍可正常播放

---

## ✅ 验证清单

### 开发模式 ✅
- [x] 启动成功
- [x] 热更新工作
- [x] 没有 Service Worker 错误
- [x] 正常开发体验

### 生产模式 ✅
- [x] 构建成功
- [x] Service Worker 注册
- [x] Manifest 正确
- [x] 图标显示
- [x] 可以安装
- [x] 离线可用

---

## 📊 PWA 功能状态

| 环境 | Service Worker | Manifest | 离线支持 | 安装提示 |
|------|---------------|----------|----------|----------|
| **开发模式** | ❌ 禁用 | ❌ 禁用 | ❌ 禁用 | ❌ 禁用 |
| **生产预览** | ✅ 启用 | ✅ 启用 | ✅ 启用 | ✅ 启用 |
| **生产部署** | ✅ 启用 | ✅ 启用 | ✅ 启用 | ✅ 启用 |

---

## 🚀 快速开始

### 日常开发（95% 的时间）
```bash
npm run dev:learner
```
访问 http://localhost:5173 → 正常开发

### 测试 PWA（发布前）
```bash
npm run build:learner && npm run preview
```
访问 http://localhost:4173 → 测试 PWA 功能

---

**现在可以正常开发了！** 🎉

开发时不用管 PWA，发布前构建测试即可！
