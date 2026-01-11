# PWA 图标生成指南

## 方法一：使用在线生成器（推荐）

### 1. 使用本地的 HTML 生成器

```bash
# 在浏览器中打开
start apps/learner/scripts/generate-icons.html
```

然后：
1. 点击"生成所有图标"按钮
2. 点击"下载所有图标"按钮
3. 将下载的图标文件移动到 `apps/learner/public/icons/` 目录

### 2. 使用在线工具

访问以下任一网站：
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

上传一个 512×512 的源图标，自动生成所有尺寸。

## 方法二：使用图形设计工具

### Figma / Sketch

1. 创建 512×512 画布
2. 使用以下设计：
   - 背景：#0F172A（深空蓝）
   - 渐变圆：#3B82F6 → #2563EB
   - 文字："ES" 白色，粗体
   - 装饰：声波纹效果
3. 导出为多个尺寸

### Adobe Illustrator / Photoshop

使用脚本批量导出不同尺寸。

## 方法三：使用命令行工具（高级）

### 使用 ImageMagick

```bash
# 创建一个简单的文本图标
convert -size 512x512 xc:#0F172A \
  -gravity center \
  -pointsize 200 \
  -fill white \
  -annotate +0+0 "ES" \
  icon-512x512.png

# 调整到其他尺寸
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 384x384 icon-384x384.png
# ... 等等
```

## 临时占位符（仅用于开发测试）

如果只是想快速测试 PWA 功能，可以使用纯色方块：

```bash
# 使用 Windows PowerShell 创建占位符
Add-Type -AssemblyName System.Drawing
$ sizes = @(72,96,128,144,152,192,384,512)

foreach ($ size in $ sizes) {
  $ bmp = New-Object System.Drawing.Bitmap($ size, $ size)
  $ g = [System.Drawing.Graphics]::FromImage($ bmp)
  $ g.Clear([System.Drawing.Color]::FromArgb(15, 23, 42))
  $ g.DrawString("ES", [System.Drawing.Font]::new("Arial", $ size * 0.35),
    [System.Drawing.Brushes]::White, $ size * 0.1, $ size * 0.3)
  $ bmp.Save("apps\learner\public\icons\icon-$ size" + "x$ size.png")
  $ g.Dispose()
  $ bmp.Dispose()
}
```

## 验证图标

生成图标后，检查以下文件是否存在：

```
apps/learner/public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── icon-maskable-512x512.png
└── continue-96x96.png
```

## 下一步

图标准备好后：
1. 运行 `npm run dev:learner` 启动开发服务器
2. 打开 Chrome DevTools → Application
3. 检查 Manifest 和 Service Worker 是否正确加载
4. 运行 Lighthouse 审计

## 注意事项

- 图标必须是 **PNG** 格式
- 建议使用 **透明背景** 或 **品牌色背景**
- iOS 需要 192×192 的 Apple Touch Icon
- Android 自适应图标需要在中心 70% 区域内放置内容
