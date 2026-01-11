# AI 发音谱界面重设计完成

## 📋 改进内容

### 问题描述
管理员反馈原有的三栏布局（视频 | 发音谱 | 字幕列表）存在空间拥挤问题，每个区域都太小不便使用。

### 解决方案
采用**可拖拽调整的垂直分割布局**，使用 `react-resizable-panels` 库实现。

## 🎨 新布局特点

### 1. **发音谱优先显示**
每个字幕卡片内部结构：
```
┌─────────────────────┐
│ ✨ AI 发音谱 (顶部)  │ ← 重点区域，用渐变背景突出
├─────────────────────┤
│ 📝 原文 (中部)      │
├─────────────────────┤
│ 🌐 译文 (下部)      │
├─────────────────────┤
│ ⏱️ 元数据/操作栏    │
└─────────────────────┘
```

### 2. **可调整大小的分割面板**
- **左侧**：视频播放器（默认 50%，可调整 30-70%）
- **右侧**：字幕+发音谱列表（默认 50%，可调整 30-100%）
- **中间**：拖拽分隔条（hover 时高亮）

### 3. **智能交互**
- ✅ 点击字幕卡片 → 视频自动跳转到对应时间
- ✅ 视频播放 → 右侧自动高亮当前字幕
- ✅ 布局比例自动保存到 localStorage
- ✅ 悬停显示快捷操作（🔊 播放、🔄 重新生成）

## 📁 新增文件

1. **`apps/admin/src/components/prosody/SubtitleNotationCard.tsx`**
   - 单个字幕卡片组件
   - 发音谱在上方，原文和译文在下方
   - 支持置信度显示（未来可扩展）

2. **`apps/admin/src/components/prosody/ResizableProsodyLayout.tsx`**
   - 可调整大小的分割布局组件
   - 集成视频播放器和字幕列表
   - 使用 `react-resizable-panels` 库

## 🔧 修改文件

- **`apps/admin/src/components/prosody/ProsodyPanel.tsx`**
  - 替换旧的三栏布局为新的 `ResizableProsodyLayout`
  - 保留原有的批量生成、日志、符号说明等功能

## 📦 依赖安装

```bash
cd apps/admin
npm install react-resizable-panels@4.2.1
```

## 🎯 API 使用说明

### react-resizable-panels 正确导入

```tsx
import { Panel, Group, Separator } from 'react-resizable-panels';
```

- **`Group`**：容器组件（不是 `PanelGroup`）
- **`Panel`**：单个面板
- **`Separator`**：拖拽手柄（不是 `PanelResizeHandle`）

### 关键属性

```tsx
<Group orientation="horizontal" id="unique-id">
  <Panel defaultSize={50} minSize={30} maxSize={70}>
    {/* 内容 */}
  </Panel>

  <Separator className="拖拽手柄样式" />

  <Panel defaultSize={50} minSize={30}>
    {/* 内容 */}
  </Panel>
</Group>
```

- **`orientation`**：`"horizontal"` 或 `"vertical"`（不是 `direction`）
- **`defaultSize`**：默认大小（百分比 0-100）
- **`minSize`/``maxSize`**：最小/最大限制
- **`id`**：用于 localStorage 保存布局

## 🚀 使用方式

1. **选择视频** → 自动加载字幕
2. **拖拽中间分隔条** → 调整左右面板大小
3. **点击字幕卡片** → 视频跳转
4. **批量生成** → 一键生成所有发音谱
5. **单个重新生成** → 点击卡片的 🔄 按钮

## 📝 后续优化建议

### Phase 1: 当前实现 ✅
- [x] 可调整大小的分割布局
- [x] 发音谱优先显示
- [x] 点击字幕跳转视频
- [x] 布局比例记忆

### Phase 2: 增强功能（待实现）
- [ ] 键盘快捷键（Ctrl+Enter 通过、Ctrl+N 下一项）
- [ ] 批量操作（全部通过、批量重新生成）
- [ ] 搜索和筛选（置信度、状态）
- [ ] 置信度显示（需要后端 API 支持）

### Phase 3: 高级功能（可选）
- [ ] 布局预设（视频优先、字幕优先、均衡模式）
- [ ] 全屏模式（隐藏侧边栏）
- [ ] 多显示器支持
- [ ] 发音谱编辑器

## 🐛 已知问题

1. **置信度未显示**：`AdminTranscriptLine` 类型中缺少 `confidence` 字段
   - **解决方案**：暂时设为 `undefined`，等后端 API 返回置信度后再启用

2. **批量生成时的进度显示**：当前使用旧的状态管理
   - **优化方向**：使用 WebSocket 或 SSE 实时更新进度

## 📚 参考资料

- [react-resizable-panels](https://www.npmjs.com/package/react-resizable-panels) v4.2.1
- [Adobe Premiere Pro 工作空间设计](https://helpx.adobe.com/premiere/desktop/get-started/tour-the-workspace/what-are-workspaces.html)
- [视频编辑界面最佳实践](https://blog.openreplay.com/resizable-split-panels-from-scratch/)

---

**实施时间**：2025-01-05
**实施者**：Claude Code
**状态**：✅ 构建成功，待测试
