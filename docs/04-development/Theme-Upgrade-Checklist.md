# 🎨 Teal 主题升级 - 快速验证指南

## ✅ 完成项目

### 配置文件更新
- [x] `packages/config/src/tailwind/preset.ts` - Tailwind 主题配置
- [x] `apps/learner/src/index.css` - CSS 变量定义

### 批量颜色替换
- [x] 27 个 `.tsx` 文件
- [x] 215 处颜色替换（Blue/Purple → Teal/Cyan）

### 文档创建
- [x] `Theme-Colors-Guide.md` - 完整配色指南
- [x] `Theme-Upgrade-Comparison.md` - Before & After 对比
- [x] `update-theme-colors.ps1` - 批量替换脚本

---

## 🚀 启动验证

### 1. 启动开发服务器

```bash
cd d:\code\EchoSpeak
npm run dev:learner
```

### 2. 验证关键页面

访问以下页面，检查颜色是否已更新：

| 页面 | 路由 | 关键检查点 |
|------|------|----------|
| **个人中心** | `/profile` | 头部渐变（Teal-Cyan）、统计卡片图标 |
| **首页** | `/` | 快速入口卡片、推荐内容 |
| **学习页** | `/learn` | 信息卡片、课程卡片 |
| **练习页** | `/practice` | 练习卡片、难度标签 |
| **发现页** | `/discover` | 分类标签、内容卡片 |
| **视频学习** | `/video/:id` | 速度按钮、句子列表 |

### 3. 深色模式验证

点击右上角主题切换按钮，验证深色模式：

- [ ] 背景色正确（深蓝黑 `#0F172A`）
- [ ] 主色为 Cyan `#2DD4BF`（比浅色模式更亮）
- [ ] 边框可见（`border-teal-800`）
- [ ] 文字对比度合格

### 4. 交互验证

- [ ] 底部导航栏激活状态为 Teal
- [ ] 按钮悬停变色流畅（200ms）
- [ ] 进度条为 Teal-Cyan 渐变
- [ ] 所有交互元素有 `cursor-pointer`

---

## 🎨 快速色彩对照

### 主色检查

| 元素 | 应为 Teal | 不应为 Blue/Purple |
|------|----------|------------------|
| 导航激活 | ✅ `text-primary` | ❌ `text-blue-600` |
| 主按钮 | ✅ `bg-teal-600` | ❌ `bg-blue-600` |
| 渐变头部 | ✅ `from-teal-600` | ❌ `from-blue-600` |
| 进度条 | ✅ `from-teal-500` | ❌ `from-blue-500` |

### 视觉确认

打开浏览器开发者工具（F12），检查计算后的颜色：

```css
/* 主色应该是 */
color: rgb(13, 148, 136);  /* Teal #0D9488 */

/* 而不是 */
color: rgb(59, 130, 246);  /* Blue #3B82F6 */
```

---

## 🐛 常见问题

### Q1: 颜色没有更新？

**A**: 清除缓存并重新编译

```bash
# Windows PowerShell
cd d:\code\EchoSpeak\apps\learner
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

### Q2: Tailwind 类不生效？

**A**: 检查 Tailwind 配置是否正确读取

```bash
# 查看生成的 CSS
cat apps/learner/dist/assets/index-*.css | Select-String "teal-600"
```

### Q3: 深色模式颜色不对？

**A**: 检查 CSS 变量是否正确定义

```css
/* apps/learner/src/index.css */
.dark {
  --color-primary: #2DD4BF;  /* 应该是 Cyan */
}
```

---

## 📊 验证清单

### 浅色模式

- [ ] 主色为 Teal `#0D9488`
- [ ] 背景色为 Teal 极浅 `#F0FDFA`
- [ ] 渐变为 Teal-Cyan
- [ ] 按钮为 Teal 系
- [ ] 标签为 Teal/Cyan 系

### 深色模式

- [ ] 主色为 Cyan `#2DD4BF`
- [ ] 背景色为深蓝黑 `#0F172A`
- [ ] 边框可见（不透明）
- [ ] 文字对比度合格
- [ ] 悬停状态正确

### 交互

- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] 过渡动画流畅（200ms）
- [ ] 悬停反馈明确
- [ ] 无布局抖动

### 无障碍

- [ ] 支持 `prefers-reduced-motion`
- [ ] 键盘导航可用
- [ ] 颜色对比度 4.5:1+
- [ ] 屏幕阅读器友好

---

## 🎯 核心颜色值速查

| 颜色名 | 用途 | Hex | RGB |
|-------|------|-----|-----|
| **Teal 600** | 主色（浅色模式） | `#0D9488` | `rgb(13, 148, 136)` |
| **Cyan 400** | 主色（深色模式） | `#2DD4BF` | `rgb(45, 212, 191)` |
| **Teal 50** | 背景（浅色模式） | `#F0FDFA` | `rgb(240, 253, 250)` |
| **Orange 600** | CTA 按钮 | `#EA580C` | `rgb(234, 88, 12)` |

---

## 📸 截图对比建议

拍摄以下截图进行前后对比：

1. **个人中心** - 头部渐变 + 统计卡片
2. **学习页** - 信息卡片 + 课程列表
3. **练习页** - 练习卡片 + 难度标签
4. **深色模式** - 任意页面的深色模式效果

保存在 `docs/04-development/screenshots/` 目录。

---

## 🔗 相关文档

- [Theme-Colors-Guide.md](./Theme-Colors-Guide.md) - 完整配色指南
- [Theme-Upgrade-Comparison.md](./Theme-Upgrade-Comparison.md) - Before & After 对比
- [ProfilePage-Redesign.md](./ProfilePage-Redesign.md) - ProfilePage 重设计文档

---

**验证人**: ____________  
**验证日期**: 2026-01-12  
**验证结果**: [ ] 通过 / [ ] 需修改  
**问题记录**: ____________
