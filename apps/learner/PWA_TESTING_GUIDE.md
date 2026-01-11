# EchoSpeak Learner PWA 测试指南
> 更新日期：2026-01-07
> 状态：基础功能已完成，待测试验证

---

## ✅ 已完成的配置

### 1. 核心文件配置
- ✅ `vite.config.ts` - VitePWA 插件配置
- ✅ `index.html` - PWA meta 标签优化
- ✅ `src/main.tsx` - Service Worker 注册
- ✅ `src/components/PWAInstallPrompt.tsx` - 安装提示组件
- ✅ `src/components/OfflineIndicator.tsx` - 离线指示器

### 2. 自动生成的文件
- ✅ `dist/manifest.webmanifest` - Web 应用清单
- ✅ `dist/sw.js` - Service Worker
- ✅ `dist/workbox-*.js` - Workbox 运行时

### 3. 缓存策略配置
- ✅ App Shell - CacheFirst（7天）
- ✅ Supabase API - NetworkFirst（24小时）
- ✅ YouTube - NetworkOnly
- ✅ 图片/封面 - StaleWhileRevalidate（7天）
- ✅ 字体文件 - CacheFirst（1年）

---

## 🧪 测试步骤

### 步骤 1：启动开发服务器

```bash
# 方式 A：开发模式（支持热更新）
npm run dev:learner

# 方式 B：构建预览（生产模式测试）
npm run build:learner
npm run preview --workspace @echospeak/learner
```

推荐使用**方式 B** 来测试 PWA 功能，因为某些 PWA 特性只在生产模式启用。

### 步骤 2：Chrome DevTools 检查

#### 2.1 打开 Chrome DevTools
- Windows/Linux: `F12` 或 `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

#### 2.2 检查 Application 面板

在 DevTools 中：
1. 点击 **Application** 标签
2. 检查以下部分：

##### Manifest
- [ ] **Manifest** 选项存在
- [ ] 显示应用名称：EchoSpeak - 口语练习
- [ ] 显示主题色：#0F172A
- [ ] 图标列表正确（72, 96, 128, 144, 152, 192, 384, 512）
- [ ] 快捷方式：继续学习

##### Service Workers
- [ ] **Service Workers** 选项显示激活的 SW
- [ ] 状态：`activated` 或 `activated and running`
- [ ] 可以看到 `sw.js` 文件

##### Cache Storage
- [ ] **Cache Storage** 展开显示多个缓存：
  - `echospeak-app-shell`
  - `echospeak-api-cache`
  - `echospeak-image-cache`
  - `echospeak-font-cache`
- [ ] 点击任意缓存，可以看到预缓存的内容

### 步骤 3：Lighthouse PWA 审计

#### 3.1 打开 Lighthouse
在 Chrome DevTools 中：
1. 点击 **Lighthouse** 标签
2. 选择 **Progressive Web App** 类别
3. 点击 **Analyze page load**

#### 3.2 检查评分

目标得分（满分 100）：
- **PWA 总体**: ⭐ ≥ 90
- **Installable**: ⭐ ✅ 通过
- **PWA Optimized**: ⭐ ≥ 80
- **Manifest**: ⭐ ✅ 通过

#### 3.3 关键审计项检查
- [ ] ✅ 注册了 Service Worker
- [ ] ✅ 响应式设计
- [ ] ✅ 有可用的 manifest
- [ ] ✅ 在 iOS Safari 上有启动画面
- [ ] ✅ 设置了 theme-color
- [ ] ✅ 图标至少 192×192
- [ ] ✅ 图标至少 512×512（自适应）
- [ ] ✅ 有可访问的视口
- [ ] ✅ 网页没有 HTTP 错误
- [ ] ✅ 离线时显示页面（自定义离线页面）

### 步骤 4：测试安装功能

#### 4.1 桌面 Chrome/Edge

1. 访问应用: `http://localhost:4173` (preview 模式)
2. 等待几秒，观察地址栏右侧
3. 应该看到 **安装图标** 📲（或提示"安装 EchoSpeak"）
4. 点击安装，确认应用安装成功
5. 检查：
   - [ ] 独立窗口打开（无浏览器地址栏）
   - [ ] 任务栏显示应用图标
   - [ ] 双击图标可以直接启动

#### 4.2 安装提示组件

1. 清空 localStorage: `localStorage.clear()`
2. 刷新页面
3. 应该看到：
   - [ ] 底部弹出蓝色安装提示横幅
   - [ ] 显示应用图标和名称
   - [ ] 有"立即安装"和"暂不"按钮
   - [ ] 关闭按钮（×）可用

#### 4.3 iOS Safari

1. 在 iPhone/iPad 上访问应用
2. 点击 Safari 底部的 **分享按钮** ↑
3. 向下滚动，找到 **"添加到主屏幕"**
4. 确认：
   - [ ] 显示正确的应用图标
   - [ ] 应用名称为 "EchoSpeak"
   - [ ] 添加后可以独立启动
   - [ ] 启动时显示启动画面

### 步骤 5：离线功能测试

#### 5.1 基础离线测试

1. 打开应用并浏览几个页面
2. 在 DevTools → **Network** 标签：
   - 勾选 **"Offline"** 模拟离线
3. 刷新页面
4. 检查：
   - [ ] 页面仍然可访问（显示 App Shell）
   - [ ] 顶部显示黄色警告条："⚠️ 网络已断开"
   - [ ] 已缓存的图片可以显示
   - [ ] 已浏览的内容可用

#### 5.2 IndexedDB 缓存测试

1. 观看一个视频（添加到 IndexedDB）
2. 断开网络
3. 刷新页面
4. 检查：
   - [ ] 视频记录仍然存在
   - [ ] 可以浏览已缓存的内容

#### 5.3 网络恢复测试

1. 在离线状态下
2. 取消 **"Offline"** 勾选
3. 观察页面：
   - [ ] 顶部警告自动消失
   - [ ] 后台同步队列执行
   - [ ] 未完成的请求重新发送

### 步骤 6：缓存策略验证

#### 6.1 App Shell 缓存

1. 打开 DevTools → **Network**
2. 刷新页面
3. 检查 JS/CSS 文件：
   - [ ] 大小显示 `(from disk cache)` 或 `(from ServiceWorker)`
   - [ ] 状态码 200

#### 6.2 API 缓存

1. 浏览包含 API 请求的页面
2. 刷新页面
3. 检查 Supabase 请求：
   - [ ] 首次访问：`(from network)` - 200
   - [ ] 再次访问：`(from disk cache)` - 200

#### 6.3 图片缓存

1. 浏览包含图片的页面
2. 刷新页面
3. 检查图片：
   - [ ] 显示 `(from ServiceWorker)`

### 步骤 7：性能测试

#### 7.1 首次加载（冷启动）
1. 隐私模式打开应用
2. 查看 **Network** → **Timing**
3. 目标：
   - [ ] 总加载时间 < 3 秒（3G 网络）
   - [ ] 首屏渲染 < 1.5 秒

#### 7.2 二次加载（缓存命中）
1. 普通模式刷新页面
2. 查看 **Network**
3. 目标：
   - [ ] 总加载时间 < 500ms
   - [ ] 大部分资源从缓存加载

### 步骤 8：更新机制测试

#### 8.1 Service Worker 更新

1. 修改应用代码（如 `main.tsx` 添加注释）
2. 重新构建：`npm run build:learner`
3. 刷新页面
4. 检查：
   - [ ] DevTools Console 显示 "New version available"
   - [ ] 弹出确认对话框
   - [ ] 点击"确定"后页面重新加载
   - [ ] 新版本生效

---

## 📱 移动端测试清单

### Android (Chrome)

- [ ] 可以安装到主屏幕
- [ ] 启动画面显示正常
- [ ] 全屏模式运行（无地址栏）
- [ ] 返回键行为正确
- [ ] 通知权限可用（如果需要）

### iOS (Safari)

- [ ] 可以添加到主屏幕
- [ ] iOS 样式的启动画面
- [ ] 状态栏样式正确
- [ ] 底部安全区域适配
- [ ] 手势导航不冲突

---

## 🐛 常见问题排查

### 问题 1：Service Worker 无法注册

**症状**: Console 显示 `SW registration failed`

**解决方案**:
1. 确认在 HTTPS 或 localhost 下访问
2. 检查 `vite.config.ts` 中的 `devOptions.enabled: true`
3. 清除所有缓存：DevTools → Application → Clear storage → Clear site data

### 问题 2：manifest 无法加载

**症状**: Application 面板显示 "No manifest detected"

**解决方案**:
1. 检查 `index.html` 是否有 manifest link（应该自动注入）
2. 检查构建输出：`dist/manifest.webmanifest` 是否存在
3. 确认 MIME 类型正确：`application/manifest+json`

### 问题 3：图标不显示

**症状**: 应用安装后显示默认图标

**解决方案**:
1. 确认 `public/icons/` 目录存在
2. 检查所有必需的图标文件：
   ```bash
   ls -la apps/learner/public/icons/
   ```
3. 使用在线工具生成完整的图标集

### 问题 4：离线时不工作

**症状**: 离线时显示"无法连接"

**解决方案**:
1. 检查 Service Worker 是否激活
2. 查看 Cache Storage 是否有内容
3. 检查 `workbox.globPatterns` 是否包含所有文件

### 问题 5：Lighthouse 得分低

**症状**: PWA 得分 < 90

**解决方案**:
1. 运行完整的审计，查看具体失败项
2. 常见扣分项：
   - HTTPS（生产环境需要）
   - 图标尺寸不足
   - 缺少 theme-color
   - 响应式视口问题

---

## 📊 性能基准

### 加载性能目标

| 指标 | 目标 | 实际 | 通过 |
|------|------|------|------|
| 首次内容绘制 (FCP) | < 1.8s | ___ | [ ] |
| 最大内容绘制 (LCP) | < 2.5s | ___ | [ ] |
| 首次输入延迟 (FID) | < 100ms | ___ | [ ] |
| 累积布局偏移 (CLS) | < 0.1 | ___ | [ ] |
| Time to Interactive (TTI) | < 3.8s | ___ | [ ] |

### PWA 特性检查

| 特性 | 状态 | 备注 |
|------|------|------|
| 可安装性 | ✅/❌ | ___________ |
| 离线可用 | ✅/❌ | ___________ |
| 后台同步 | ✅/❌ | ___________ |
| 推送通知 | ✅/❌ | ___________ |
| 安全上下文 (HTTPS) | ✅/❌ | ___________ |

---

## 🚀 下一步优化

### 短期（本周）
- [ ] 生成完整的图标集
- [ ] 添加自定义离线页面
- [ ] 优化 Service Worker 更新提示 UI

### 中期（本月）
- [ ] 实现 Background Sync API
- [ ] 添加 Periodic Sync（定期更新内容）
- [ ] 优化缓存策略（基于实际使用）

### 长期（下个月）
- [ ] 集成 Web Push 通知
- [ ] 实现 Web Share Target（分享到应用）
- [ ] 添加短菜单（Shortcuts）

---

## 📝 测试报告模板

完成测试后，填写以下报告：

```markdown
## PWA 测试报告

**测试日期**: 2026-01-__
**测试人员**: ___________
**环境**: Chrome ___ / Safari ___ / Node ___

### 测试结果汇总
- Lighthouse PWA 得分: _____ / 100
- 可安装: ✅ / ❌
- 离线可用: ✅ / ❌
- 推荐安装提示: ✅ / ❌

### 发现的问题
1.
2.
3.

### 性能数据
- FCP: _____ ms
- LCP: _____ ms
- TTI: _____ ms

### 下一步行动
- [ ]
- [ ]
```

---

**文档版本**: v1.0
**最后更新**: 2026-01-07
**下次测试**: 部署到生产环境后
