# 02-architecture - 架构设计

本目录包含系统架构、技术选型和设计决策文档。

## 📄 文档列表

### [`structure.md`](structure.md)
**代码结构规划（Learner vs Admin）**

包含内容：
- 现状与痛点分析
- 目标架构（Monorepo 结构）
- 模块职责分配
- 迁移路线与实施节奏
- 风险与对策
- Checklist

**状态**：✅ 已完成（Monorepo 迁移完成）  
**适合人群**：架构师、技术 Leader

---

### [`AIProvider.md`](AIProvider.md)
**AI 服务架构调研与方案**

包含内容：
- 核心架构分析（统一 LLM 客户端抽象）
- 流式传输实现（SSE）
- 配置灵活性（双模式）
- 模型发现与测试
- smart-excalidraw-next 案例研究
- 对比分析与改进建议
- 混合方案设计

**适合人群**：后端架构师、AI 集成开发者

---

### [`AI_PROVIDER_GUIDE.md`](AI_PROVIDER_GUIDE.md)
**AI 提供商集成指南**

包含内容：
- AI 提供商选择与配置
- API 调用最佳实践
- 错误处理与重试策略
- 成本优化建议

**适合人群**：后端开发者、DevOps

---

### [`figma-library.md`](figma-library.md)
**设计系统与 Figma 组件库**

包含内容：
- Figma 设计文件结构
- 组件库使用指南
- Design Token 管理
- 设计与开发协作流程

**适合人群**：设计师、前端开发者

---

## 💡 核心设计决策

### Monorepo 架构
- **工具**：npm workspaces
- **原因**：共享包管理、统一构建流程、版本同步
- **参考**：`structure.md`

### AI 服务
- **提供商**：Google Gemini 1.5 Flash
- **原因**：高质量输出、支持多模态、成本可控
- **参考**：`AIProvider.md`, `AI_PROVIDER_GUIDE.md`

### 后端即服务（BaaS）
- **选择**：Supabase
- **原因**：快速开发、全球部署、开源可迁移
- **参考**：`structure.md` 中的技术栈章节

---

**最后更新**：2026-01-02
