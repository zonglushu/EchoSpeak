# EchoSpeak Figma Library 指南

> 目的：将 Stage 1 的色彩 / 字体 / 间距 token 与核心组件规范落地为 Figma Library，确保设计稿、Storybook 与代码使用同一份源数据。

## 1. 资源清单
- `design/figma-tokens.json`：遵循 Tokens Studio (Design Tokens) 插件规范，包含颜色（Light/Dark）、字体、间距、圆角、阴影、排版样式。
- `packages/config/tailwind-preset`：当前代码采用的 Tailwind 预设，可用于校验 Figma token 与代码实现是否一致。
- `stories/`：Storybook 中的 Button / Header / DesignTokens 示例，可作为 Figma 组件的结构参考。

## 2. 导入步骤
1. 在 Figma 中安装 [Tokens Studio](https://tokens.studio/) 插件（或使用 Figma Variables 的 Design Tokens Beta）。
2. 打开设计系统文件，运行插件并选择 **Import → JSON file**，指向 `design/figma-tokens.json`。
3. 确认 `light` / `dark` modes 均正确载入：
   - `color.bg`、`color.surface`、`color.primary` 等映射至 Color Styles；
   - `typography.heading.h1` 等映射至 Text Styles；
   - `dimension.spacing-*`、`borderRadius.*` 映射至 Effect/Radius Styles 或 Auto Layout 常量。
4. 使用 “Create Styles from Tokens” 命令，将导入的 token 写入 Figma 变量（Color / Number / Typography）。
5. 建议命名空间：`Echo/Color/Primary`, `Echo/Typography/H1`, `Echo/Shadow/Glass`，便于与代码侧的 `--color-primary` / `font-h1` 等名称对照。

## 3. 组件构建路线
| 分类 | 组件 | Token 对应 | Storybook 对应 |
| --- | --- | --- | --- |
| General | Button (Primary/Secondary/Ghost、不同状态) | `color.primary`, `radius.glass`, `shadow.panel` | `stories/Button.stories.ts` |
| Forms | Input, FileDrop, Textarea | `color.surface`, `spacing.*`, `shadow.panel` | （待添加 → 可基于 `packages/ui` 输入组件） |
| Navigation | Tabs Stack, Chips, Toolbar | `typography.caption`, `color.accent` | `stories/Header.stories.ts` 可参考结构 |
| Content | Glass Card / Panel, Modal / Sheet | `color.surface`, `shadow.glass`, `radius.glass` | `stories/Page.stories.ts` 布局示例 |
| Learning | Transcript Item, Player Controls, Prosody Renderer shell | `typography.prosody`, `color.primary` | `packages/ui` 中的 ProsodyRenderer / NotationLegend |

### 建议流程
1. **Token 复用**：创建 Auto Layout 模块化组件时，只引用 token 变量，避免写死颜色/圆角值。
2. **Variant 设计**：为每个组件建立 Variant（如 `state=default|hover|active|loading`）。Variant 的属性应与 Storybook Control 名称一致，方便后续自动化对齐。
3. **Assets 发布**：完成后将组件发布为 Figma Library（`Publish styles & components`），并邀请开发/运营成员使用。

## 4. Storybook ↔ Figma 同步
1. 在 Storybook 的 `designTokens` 页面展示 `design/figma-tokens.json` 中的主要变量（可复用现有 `DesignTokens.stories.tsx`）。
2. 使用 [storybook-addon-designs](https://github.com/pocka/storybook-addon-designs)（可选）在每个组件 Story 中附上 Figma 链接，确保设计审核直接跳转到对应组件。
3. 当 Figma 中的 token 变更时：
   - 从 Tokens Studio 导出新的 JSON；
   - 覆盖 `design/figma-tokens.json` 并运行 `npm run storybook` 核对；
   - 如需同步到 Tailwind，以 `packages/config/tailwind-preset` 为准进行增量更新。

## 5. 维护约定
- **单一事实来源**：任何视觉调整先改 Figma token → 导出 JSON → 同步到 `@echospeak/config` → 更新 Storybook。
- **版本控制**：所有 token/组件改动均通过 PR 进入仓库，方便回溯；必要时可在 JSON 中添加 `$version` 字段。
- **审核流程**：设计师在 Figma 发布后，提交“Tokens 更新” issue，附带生成的 diff（Tokens Studio 支持 compare），由前端在 Storybook 中验证通过后合并。

完成上述步骤后即可将 Stage 1 的 Figma Library 与代码同步，后续 Stage 2/3 的组件扩展（Uploader、Tabs Stack、Transcript Item 等）也可在此基础上迭代。
