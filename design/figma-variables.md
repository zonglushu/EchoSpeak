# EchoSpeak Figma 变量手动录入指南

> 当 Tokens Studio (Design Tokens) 插件不可用或需要免费方案时，可按照本指南在 Figma 原生 Variables / Styles 中手动创建同样的 token。

## 1. 建议的 Variables 结构

| Collection | Mode | 内容 |
| --- | --- | --- |
| `Echo / Color` | `light` / `dark` | 背景、面板、品牌色、提示色等颜色变量 |
| `Echo / Typography` | `base` | 文字样式（H1/H2/H3/Body/Caption/Prosody 等） |
| `Echo / Spacing` | `base` | 间距常量（4/8/12/.../72） |
| `Echo / Effects` | `base` | 毛玻璃阴影、Panel 阴影 |
| `Echo / Radius` | `base` | 圆角常量（Glass、Pill、XL） |

在 Figma 中打开 **Assets → Variables** 面板：
1. 点击 “+” 新建 Variable Collection，例如 `Echo / Color`。
2. 点击 “Add mode”，添加 `light` 与 `dark`。
3. 按下面的表格输入变量名称与值。
4. 对 Typography 建议在 Variables 中创建文本变量，然后使用 “Create style” 按钮同步为 Text Style。

## 2. 颜色变量

| 名称 | Light | Dark | 说明 |
| --- | --- | --- | --- |
| `color.bg` | `#F8FAFF` | `#030712` | 页面背景 |
| `color.surface` | `rgba(255,255,255,0.85)` | `rgba(15,23,42,0.85)` | 毛玻璃卡片背景 |
| `color.primary` | `#2563EB` | `#60A5FA` | 主色（按钮/高亮） |
| `color.primary-light` | `#60A5FA` | `#93C5FD` | 主色 hover/浅色 |
| `color.primary-dark` | `#1D4ED8` | `#1E3A8A` | 主色按下/深色 |
| `color.accent` | `#F4D35E` | `#F2C14E` | 收藏/进度提示 |
| `color.muted` | `#94A3B8` | `#CBD5F5` | 次级文字/描边 |
| `color.success` | `#22C55E` | `#4ADE80` | AI 成功/正向状态 |
| `color.warning` | `#F97316` | `#FDBA74` | 告警/上传状态 |
| `color.danger` | `#EF4444` | `#F87171` | 错误/危险提示 |

## 3. 字体与排版

| 变量名 | 字体 | Font Size | Line Height | Letter Spacing | Font Weight |
| --- | --- | --- | --- | --- | --- |
| `type.heading.h1` | SF Pro Display / Inter | 34 px | 38–40 px (约 115%) | -0.01 em | 900 (Black) |
| `type.heading.h2` | 同上 | 28 px | 34 px | -0.005 em | 900 |
| `type.heading.h3` | 同上 | 22 px | 28 px | 0 em | 700 |
| `type.body.default` | 同上 | 16 px | 24 px | 0 em | 500 |
| `type.body.caption` | 同上 | 13 px | 18 px | 0.02 em | 500 |
| `type.body.prosody` | JetBrains Mono | 15 px | 24 px | 0.02 em | 500 |

> Figma 当前尚不支持在 Text Variables 内直接记录字体族/行高，因此可使用 Text Styles：创建文本框 → 在右侧 `Text` 面板设置字体、字号、行高、字距 → 点击 “Style (四点图标) → Create style”，命名为 `Echo / Heading / H1` 等。

## 4. 间距、圆角与阴影

### 间距 Variables（`Echo / Spacing`）

| 名称 | 数值 |
| --- | --- |
| `spacing.1` | 4 px |
| `spacing.2` | 8 px |
| `spacing.3` | 12 px |
| `spacing.4` | 16 px |
| `spacing.6` | 24 px |
| `spacing.8` | 32 px |
| `spacing.12` | 48 px |
| `spacing.18` | 72 px |

### 圆角 Variables（`Echo / Radius`）

| 名称 | 数值 |
| --- | --- |
| `radius.glass` | 24 px |
| `radius.xl` | 32 px |
| `radius.pill` | 999 px |

### 阴影 Variables（`Echo / Effects`）

| 名称 | 描述 |
| --- | --- |
| `shadow.glass` | `0px 20px 70px rgba(15, 23, 42, 0.25)` |
| `shadow.panel` | `0px 12px 32px rgba(15, 23, 42, 0.18)` |

在 Figma 中添加 Effect 变量：
1. 选中一个图层，应用所需阴影（Effects → Drop shadow）。
2. 打开 `Effects` 面板右侧的 “Styles” 图标 → `Create style` → 命名为 `Echo / Shadow / Glass`。

## 5. 在组件中引用变量
1. 选择组件或框架 → 打开右侧样式面板。
2. 在 Fill/Stroke/Effect/Corner Radius 等字段旁边点击变量图标（数据库图标）。
3. 选择上面创建的变量（如 `color.primary`、`radius.glass`）。
4. 组件 Variant 可设定属性（state/size），并使用同一套变量，保证与 Storybook 控件名称一致。

## 6. 与代码同步
- 所有数值已与 `packages/config/tailwind-preset`、`styles/theme.css` 对齐，可随时核对。
- 若日后 token 变化：
  1. 更新本仓库中的 `design/figma-variables.md` 或 `design/figma-tokens.json`。
  2. 在 Figma 中调整对应变量/样式。
  3. 提交 PR 记录更改，方便前端在 Tailwind/Storybook 中同步。

这样就算没有 Tokens Studio 插件，也能在 Figma 原生功能里搭建完整的 Design Library。
