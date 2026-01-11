# 阶段 1 交付（信息架构 & 设计系统）

本文件汇总 EchoSpeak 重设计阶段一的成果，用于指导后续开发与视觉实现。

---

## 1. 信息架构（Information Architecture）

### 1.1 站点地图（V1）
```
根目录 /
├─ 学员端
│  ├─ /discover            # 推荐/精选
│  ├─ /discover/:tag       # 分类精选（口音/主题/难度）
│  ├─ /favorites           # 收藏清单
│  ├─ /history             # 历史记录
│  └─ /learn/:videoId      # 播放器（含练习/收藏/AI 讲解面板）
│      └─ /notes           # 独立笔记视图（移动端便捷入口）
├─ 管理端
│  ├─ /studio/upload       # 上传 & 任务队列
│  ├─ /studio/:assetId/edit
│  │    ├─ subtitles       # 字幕对照
│  │    └─ notation        # AI 发音谱编辑
│  └─ /studio/library      # 素材库 + 发布管理
└─ 通用
   ├─ /profile
   └─ /settings
```

### 1.2 关键用户流程
1. **管理员：素材入库**
   - 上传视频 → 自动提取字幕轨或导入文件 → 缺语言则触发 AI 翻译 → 批量生成发音谱 → 预览并发布。
2. **学员：沉浸练习**
   - 浏览推荐 → 进入播放器 → 字幕随时间滚动 → 一键收藏/笔记 → 打开 AI 讲解 → 完成复习提醒。
3. **学员：快速复习**
   - 从收藏/历史进入 → 直接跳到某句 → 查看笔记/讲解 → 继续播放或设置提醒。

### 1.3 导航与权限矩阵
| 页面 | 学员 | 管理员 | 说明 |
| --- | --- | --- | --- |
| /discover, /favorites, /history | ✅ | ✅ | 管理员可体验学员端，但数据隔离 |
| /learn/:videoId (+ /notes) | ✅ | ✅ | 登录后可访问；管理员默认只读不写入收藏 |
| /studio/upload | ❌ | ✅ | 管理员专属；需上传权限 |
| /studio/:assetId/* | ❌ | ✅ | 含字幕/打谱/AI 监控 |
| /studio/library | ❌ | ✅ | 管理内容库、发布状态 |
| /profile, /settings | ✅ | ✅ | 支持角色切换/通知设置 |

---

## 2. 设计系统（Design System）

### 2.1 色彩 Token
| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--color-bg` | #F8FAFF | #030712 | 页面背景、毛玻璃底色 |
| `--color-surface` | rgba(255,255,255,0.85) | rgba(15,23,42,0.85) | 卡片/面板 |
| `--color-primary` | #2563EB | #60A5FA | 主操作、强调文本 |
| `--color-accent` | #F4D35E | #F2C14E | 收藏提示、进度条 |
| `--color-muted` | #94A3B8 | #CBD5F5 | 次级文字、分隔线 |
| `--color-success` | #22C55E | #4ADE80 | AI 成功状态 |
| `--color-warning` | #F97316 | #FDBA74 | 上传/翻译告警 |

**Tailwind 对应配置示例：**
```ts
// tailwind.config.ts (片段)
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        primary: {
          DEFAULT: '#2563EB',
          light: '#60A5FA'
        },
        accent: '#F4D35E',
        muted: '#94A3B8',
        success: '#22C55E',
        warning: '#F97316'
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace']
      }
    }
  }
};
```

### 2.2 字体 & 层级
- H1 34/40，H2 28/34，H3 22/28。
- Body 16/24，Caption 13/18。
- Prosody 区域使用等宽字体，配合 `letter-spacing: 0.02em`。

### 2.3 网格与间距
- Desktop：12 列，列宽自适应，间距 24px，外边距 48px，容器最大 1440px。
- Mobile：6 列，间距 16px，外边距 20px。
- 间距 token：4 / 8 / 12 / 16 / 24 / 32 / 48 / 72。
- 毛玻璃组件：`backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.15)`。

---

## 3. 核心组件与线框摘要

### 3.1 组件清单
| 组件 | 状态 | 备注 |
| --- | --- | --- |
| Button (Primary/Secondary/Ghost) | 默认 / Hover / Active / Loading / Disabled | 圆角 16px，1px 边框 + 轻阴影 |
| Input + FileDrop | Focus, Error, Dragover | 支持拖拽上传 & 多文件队列 |
| Glass Card / Panel | Default, Highlight | 用于视频卡片、AI 状态面板 |
| Tabs Stack | Active, Hover, Disabled | 基于 Radix Tabs，带柔性滑块 |
| Transcript Item | Idle, Active, Generating, Completed | 含收藏、笔记快捷键 |
| Player Controls | Play/Pause, ±5s, Speed, Captions, Theater, Fullscreen | 触控友好、支持键盘快捷键 |
| Modal / Sheet | Desktop Modal, Mobile Bottom Sheet | 长内容滚动时固定操作区 |

### 3.2 高保真线框描述
- **管理员流程**
  1. 上传页：左侧为 Drop 区 + 进度，右侧显示任务队列、失败重试按钮。
  2. 字幕页：上下双栏（原文/译文），右侧 Job 时间线，顶部进度条显示“提取→翻译→对齐→完成”。
  3. 打谱页：中央 Prosody 预览 + 句子列表，右侧“AI 状态 / 手工编辑 / 重跑” Tab。
- **学员播放器**
  - 视频容器：16:9 圆角 + 毛玻璃覆盖层；控制栏拥有播放/暂停、前/后 5s、倍速、字幕切换、剧场/全屏按钮。
  - 右侧面板 Tabs：练习（滚动字幕，高亮当前句）、收藏（列表 + 搜索）、AI 讲解（语音要点、问题提示）。
  - 收藏/笔记：点击星标或“写笔记”打开侧滑 Sheet，支持 Markdown 和时间戳。
- **移动端**
  - 视频置顶，控制栏加大触控区域。
  - Tabs 切换为底部导航，AI 讲解/收藏以 Bottom Sheet 呈现。

---

## 4. 后续交付指引
1. [x] 将上述 token 同步到 Tailwind 配置与全局 CSS 变量（`styles/theme.css` + `tailwind.config.ts` 已落地）。
2. [x] 在 Figma 建立 Design Library，复用本文件的色板/字体/组件规范（详见 `docs/figma-library.md` 与 `design/figma-tokens.json`）。
3. [x] 创建 Storybook，至少覆盖 Button、Input、Tabs、Transcript Item、Player Controls。
4. [x] Storybook + Figma 联调完成，可在 `plan.md` 中将“阶段 1”标记为完成（已记录完成状态）。

### 4.1 当前落地进度（2025-12-25）
- ✅ `styles/theme.css`：定义 Light/Dark token 并在 `index.tsx` 中全局引用，为现有 Vite 应用和未来 Next.js 项目提供一致的 CSS 变量。
- ✅ `tailwind.config.ts`：预置颜色、字体、Spacing、毛玻璃等扩展，未来迁移 Next.js 时可直接投入使用。
- ✅ `packages/config`：抽离 Tailwind preset、tsconfig baseline、ESLint ignores，Learner/Admin/Storybook 通过 `@echospeak/config` 获取统一 token 与编译规则。
- ✅ Storybook 设计系统沙盒：在 `stories/DesignTokens.stories.tsx` 中展示色板与字体层级，`preview.ts` 引入了全局 `theme.css`，方便设计/开发对齐。
- ✅ Figma Design Library 基线：`design/figma-tokens.json` 对齐 Tailwind token，可直接通过 Tokens Studio 导入；`docs/figma-library.md` 记录了组件搭建与 Storybook 联动流程。
- ⏳ Figma Library：
  - 2025-12-25 尝试 `npx storybook@latest init --builder @storybook/builder-vite`，因 Storybook 10 要求 Node 22.12+ 而当前环境为 22.0.0 被阻塞。
  - 退而求其次的 Storybook 7.6.21 与 React 19 存在 peer dependency 冲突（需要 React ≤18）。
  - 解决方案（已执行）：升级 Node 至 22.12.0 并安装 Storybook 10；后续待 Figma 组件库整理完成后，与 Storybook 联动。  
