# 04-development - 开发指南

本目录包含日常开发、功能实现和问题解决文档。

## 📄 文档列表

### [`Admin-APP.md`](Admin-APP.md) ⭐
**Admin App 优化计划**

包含内容：
- 调研总结（Next.js 组件库推荐、多步骤表单最佳实践）
- 当前代码问题分析（旧版组件状态、页面结构问题、状态管理分析）
- 优化方案设计（Wizard 模式推荐 vs 现有模式对比）
- 实施计划（分阶段改造）
- 文件结构整理建议

**状态**：🚧 进行中  
**适合人群**：Admin App 开发者、前端架构师

---

### [`subtitle-extraction.md`](subtitle-extraction.md)
**字幕提取实现方案**

包含内容：
- 字幕提取技术方案（mp4box.js、mux.js、ffmpeg）
- 语言检测与对齐策略
- 单语补全（AI 翻译）
- 错误处理
- 实现步骤

**适合人群**：后端开发者、视频处理开发者

---

### [`user-quota-system.md`](user-quota-system.md)
**用户配额系统详细文档**

包含内容：
- 测试用户账户（Free/Pro/Premium）
- 数据库表结构（`user_quotas`）
- 数据库函数（`check_user_quota`, `consume_quota`, `reset_daily_quotas`）
- API 端点说明
- 配额检查流程
- 前端集成示例
- 管理员操作指南
- 故障排查

**适合人群**：全栈开发者、后端开发者

---

### [`AI4Writing.md`](AI4Writing.md)
**AI 写作功能说明**

包含内容：
- AI 写作功能概述
- 使用场景
- 实现方案

**适合人群**：功能规划、产品经理

---

## 🛠️ 开发工作流

### 日常开发

1. **启动开发服务器**
   ```bash
   # Admin App
   npm run dev:admin
   
   # Learner App
   npm run dev:learner
   
   # Storybook
   npm run storybook
   ```

2. **修改共享组件**
   - 在 `packages/ui` 中修改组件
   - 在 Storybook 中验证
   - 在 Admin/Learner App 中测试集成

3. **数据库变更**
   - 在 `sql/` 目录创建迁移脚本
   - 在 Supabase SQL Editor 中执行
   - 更新 TypeScript 类型（`supabase gen types`）

4. **提交代码**
   - 遵循提交规范（feat/fix/docs/refactor...）
   - 确保所有测试通过
   - 更新相关文档

### 功能开发流程

以"添加收藏功能"为例：

1. **规划阶段**
   - 设计数据库 schema（`favorites` 表）
   - 设计 API 接口
   - 创建或更新开发文档

2. **实现阶段**
   - 后端：创建 Supabase 表和 RLS 策略
   - 前端：实现 UI 组件
   - API：实现 Server Actions 或 API Routes
   - 测试：单元测试 + 集成测试

3. **集成阶段**
   - 在 Learner App 中集成
   - 在 Admin App 中添加管理界面（如需要）
   - 更新文档

4. **验收阶段**
   - 功能测试
   - 性能测试
   - 用户体验测试
   - 代码审查

---

## 🎯 当前开发重点

### 本周任务（参考 `Admin-APP.md`）

- [ ] 清理旧版组件（删除损坏的 `UploadWorkbench.tsx`）
- [ ] 重命名 `-new` 后缀组件
- [ ] 实现 Wizard 步骤导航
- [ ] 完善批量操作进度条

### 本月任务

- [ ] 学员端收藏功能
- [ ] 学员端笔记编辑器
- [ ] Admin 封面上传与编辑
- [ ] 实时进度推送（WebSocket/SSE）

---

## 📝 代码规范

### TypeScript
- 所有函数必须有明确的返回类型
- 优先使用 `interface` 定义对象类型
- 使用 `@echospeak/*` 路径别名

### React
- 优先使用函数组件和 Hooks
- 大型组件拆分为多个小组件
- 状态管理：简单状态用 useState，复杂状态用 Zustand

### 样式
- 使用 Tailwind CSS
- 复用 `packages/config` 的 theme token
- 避免内联样式

### 提交信息
```
feat: 添加收藏功能
fix: 修复字幕同步问题
docs: 更新 API 文档
refactor: 重构上传组件
perf: 优化虚拟列表性能
test: 添加配额系统测试
chore: 更新依赖版本
```

---

## 🐛 问题排查

### 常见开发问题

1. **类型错误**
   - 运行 `npm run build` 检查类型
   - 更新 `@echospeak/types` 包
   - 重新生成 Supabase 类型

2. **样式不生效**
   - 检查 Tailwind 配置
   - 确保 `theme.css` 已导入
   - 清除构建缓存

3. **API 调用失败**
   - 检查环境变量配置
   - 查看浏览器控制台错误
   - 检查 Supabase RLS 策略

4. **性能问题**
   - 使用 React DevTools Profiler
   - 检查虚拟列表配置
   - 优化数据查询（添加索引）

---

## 📚 相关资源

- **Supabase 文档**：https://supabase.com/docs
- **Next.js 文档**：https://nextjs.org/docs
- **Vite 文档**：https://vite.dev/
- **Tailwind CSS**：https://tailwindcss.com/docs
- **Gemini API**：https://ai.google.dev/docs

---

**最后更新**：2026-01-02
