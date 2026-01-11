# PWA Application Icons

此目录包含 PWA 所需的应用图标。

## 需要的图标尺寸

### 必需图标
- `icon-72x72.png` - 72×72px
- `icon-96x96.png` - 96×96px
- `icon-128x128.png` - 128×128px
- `icon-144x144.png` - 144×144px
- `icon-152x152.png` - 152×152px
- `icon-192x192.png` - 192×192px
- `icon-384x384.png` - 384×384px
- `icon-512x512.png` - 512×512px

### 自适应图标（Android）
- `icon-maskable-512x512.png` - 512×512px (安全区域 70%)

### 快捷方式图标
- `continue-96x96.png` - 96×96px

## 图标设计规范

### 主题
- **主色调**: #0F172A (深空蓝)
- **强调色**: #3B82F6 (霓虹蓝)
- **风格**: 简洁、现代、扁平化

### 设计元素建议
1. **字母 "E"** + 声波纹（象征语言学习）
2. **对话气泡** + 播放按钮（象征口语练习）
3. **抽象音波** + 书本图标（象征学习）

### 生成工具
- 在线工具: https://realfavicongenerator.net/
- Figma/Sketch: 导出多尺寸
- 命令行: `sharp` 包批量生成

## 临时占位符

目前可以暂时使用纯色方块或简单文本占位：
```bash
# 使用 ImageMagick 生成临时图标
convert -size 512x512 xc:#0F172A -gravity center -pointsize 200 -fill white -annotate +0+0 "ES" icon-512x512.png
```

## 下一步

创建图标后，更新 `vite.config.ts` 中的 `manifest.icons` 配置。
