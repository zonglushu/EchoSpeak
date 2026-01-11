  ---
  📋 Admin App 优化计划

  一、调研总结

  1. Next.js 组件库推荐（2025）

  根据搜索结果，shadcn/ui 是最佳选择：

  | 特性            | shadcn/ui   | Chakra UI | NextUI   |
  |-----------------|-------------|-----------|----------|
  | 2025 排名       | #1 ⭐       | #2        | #5       |
  | 与 Next.js 集成 | ✅ 完美     | ✅ 良好   | ✅ 优秀  |
  | 与 Tailwind     | ✅ 原生集成 | ⚠️ 需配置 | ✅ 内置  |
  | 组件复制方式    | 复制到项目  | npm 安装  | npm 安装 |
  | 可定制性        | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐  | ⭐⭐⭐⭐ |
  | Stepper 组件    | ✅ 有       | ✅ 有     | ✅ 有    |
  | 学习曲线        | 低          | 中        | 低       |

  推荐：shadcn/ui + Tailwind CSS（你们已经在用）

  2. 多步骤表单最佳实践

  根据搜索结果，业界主流方案：

  - Step 组件库：https://ui.shadcn.com/docs/components/stepper、https://www.npmjs.com/package/react-multistep
  - 表单管理：React Hook Form + Zod
  - 状态管理：Zustand（你们已在使用）

  ---
  二、当前代码问题分析

  1. 旧版组件状态

  | 组件                      | 状态                                            | 建议     |
  |---------------------------|-------------------------------------------------|----------|
  | UploadWorkbench.tsx       | 🗑️ 文件损坏（corrupted）                        | 立即删除 |
  | SubtitleWorkbench.tsx     | ⚠️ 旧版逻辑，依赖 workflowStore.uploadCompleted | 可删除   |
  | ProsodyPanel.tsx          | ⚠️ 旧版，无视频选择                             | 可删除   |
  | UploadWorkbench-new.tsx   | ✅ 完整功能                                     | 重命名   |
  | SubtitleWorkbench-new.tsx | ✅ 有独立视频选择                               | 重命名   |
  | ProsodyPanel-new.tsx      | ✅ 有独立视频选择                               | 重命名   |

  2. 页面结构问题

  当前结构（4 个组件堆叠）：
  ┌────────────────────────────────────┐
  │  UploadWorkbench-new               │
  ├────────────────────────────────────┤
  │  SubtitleWorkbench-new             │
  ├────────────────────────────────────┤
  │  ProsodyPanel-new                  │
  ├────────────────────────────────────┤
  │  ContentLibrary                    │
  └────────────────────────────────────┘

  问题：
  - ❌ 页面过长，需要滚动
  - ❌ 每个面板独立选择视频（重复操作）
  - ❌ 不清楚当前在哪一步
  - ❌ workflowStore 没有被充分利用

  3. 状态管理分析

  workflowStore.ts（已有但未充分利用）：
  export type WorkflowMode = 'upload' | 'subtitle' | 'notation' | 'publish';

  state: {
    currentMode: WorkflowMode;           // ✅ 当前模式
    selectedAssetId: string | null;     // ✅ 选中的资源
    uploadCompleted: boolean;            // ⚠️ 新版不使用
    videoFile: File | null;              // ⚠️ 新版不使用
    subtitleProcessingAssetId: string | null;
    notationProcessingAssetId: string | null;
  }

  ---
  三、优化方案设计

  方案 A：工作流 Wizard 模式（推荐）⭐

  ┌─────────────────────────────────────────────────────────┐
  │  EchoSpeak Admin - 内容生产工作台                        │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  Step 1 → Step 2 → Step 3 → Step 4                      │
  │  ●──────○──────○──────○                                  │
  │  上传    字幕    发音谱   发布                            │
  │                                                         │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │                                                 │   │
  │  │  [当前步骤的内容区域]                             │   │
  │  │                                                 │   │
  │  │  - Step 1: UploadWorkbench                     │   │
  │  │  - Step 2: SubtitleWorkbench                   │   │
  │  │  - Step 3: ProsodyPanel                        │   │
  │  │  - Step 4: ContentLibrary                      │   │
  │  │                                                 │   │
  │  └─────────────────────────────────────────────────┘   │
  │                                                         │
  │  [上一步]  [下一步]  [保存草稿]                          │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  技术栈：
  - Stepper 组件：shadcn/ui Stepper
  - 表单管理：React Hook Form（如果需要）
  - 状态管理：优化后的 workflowStore

  数据流：
  Step 1 选择视频 → workflowStore.selectedAssetId
      ↓
  Step 2 自动加载该视频的字幕 → workflowStore.subtitleProcessingAssetId
      ↓
  Step 3 自动加载该视频的发音谱 → workflowStore.notationProcessingAssetId
      ↓
  Step 4 发布内容

  ---
  方案 B：Tab 选项卡模式

  ┌─────────────────────────────────────────────────────────┐
  │  [上传视频] [字幕处理] [发音谱生成] [内容发布]             │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  当前选中 Tab 的内容                                      │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  ---
  四、详细实施计划

  阶段 1：清理旧代码 ⏱️ 30分钟

  删除文件：
  - apps/admin/src/components/upload/UploadWorkbench.tsx（损坏）
  - apps/admin/src/components/subtitles/SubtitleWorkbench.tsx（旧版）
  - apps/admin/src/components/prosody/ProsodyPanel.tsx（旧版）

  重命名文件：
  - UploadWorkbench-new.tsx → UploadWorkbench.tsx
  - SubtitleWorkbench-new.tsx → SubtitleWorkbench.tsx
  - ProsodyPanel-new.tsx → ProsodyPanel.tsx

  更新导入：
  - apps/admin/src/app/page.tsx（更新导入路径）

  ---
  阶段 2：引入 shadcn/ui ⏱️ 1小时

  安装依赖：
  npx shadcn@latest init
  npx shadcn@latest add stepper
  npx shadcn@latest add button
  npx shadcn@latest add card
  npx shadcn@latest add badge

  配置：
  - 更新 tailwind.config.js
  - 添加 components.json 配置
  - 创建 apps/admin/src/components/ui/ 目录

  ---
  阶段 3：重构 workflowStore ⏱️ 1小时

  优化状态结构：
  // apps/admin/src/stores/workflowStore.ts

  export type WorkflowMode = 'upload' | 'subtitle' | 'notation' | 'publish';
  export type WorkflowStep = 1 | 2 | 3 | 4;

  interface WorkflowState {
    // 当前步骤
    currentStep: WorkflowStep;

    // 选中的资源（跨步骤共享）
    selectedAssetId: string | null;
    selectedAssetName: string | null;

    // 每个步骤的完成状态
    stepCompletion: {
      upload: boolean;
      subtitle: boolean;
      notation: boolean;
      publish: boolean;
    };

    // Actions
    goToStep: (step: WorkflowStep) => void;
    nextStep: () => void;
    prevStep: () => void;
    selectAsset: (assetId: string, assetName: string) => void;
    markStepComplete: (step: WorkflowMode) => void;
    canProceedToStep: (step: WorkflowStep) => boolean;
    reset: () => void;
  }

  ---
  阶段 4：创建 Stepper 页面 ⏱️ 2小时

  文件结构：
  apps/admin/src/app/
  ├── page.tsx                        # 主页面（使用 Stepper）
  ├── workflow/
  │   ├── WorkflowStepper.tsx         # Stepper 组件
  │   ├── steps/
  │   │   ├── Step1Upload.tsx         # 上传步骤
  │   │   ├── Step2Subtitle.tsx       # 字幕步骤
  │   │   ├── Step3Notation.tsx       # 发音谱步骤
  │   │   └── Step4Publish.tsx        # 发布步骤
  │   └── WorkflowNavigation.tsx      # 上一步/下一步按钮

  页面布局：
  // apps/admin/src/app/page.tsx

  export default function Home() {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">内容生产工作台</h1>
          <p className="text-sm text-slate-500">
            上传 → 转写 → AI 打谱 → 发布 全流程管理
          </p>
        </header>

        <WorkflowStepper />
        <WorkflowSteps />
        <WorkflowNavigation />
      </div>
    );
  }

  ---
  阶段 5：优化组件通信 ⏱️ 2小时

  修改 SubtitleWorkbench.tsx：
  // 不再独立选择视频，从 workflowStore 读取
  export const SubtitleWorkbench = () => {
    const { selectedAssetId } = useWorkflowStore();

    // 如果没有选择视频，显示提示
    if (!selectedAssetId) {
      return <EmptyState message="请先在步骤1上传视频" />;
    }

    // 加载该视频的字幕
    useEffect(() => {
      loadSubtitles(selectedAssetId);
    }, [selectedAssetId]);

    // ... 其余逻辑
  };

  修改 ProsodyPanel.tsx：
  // 同样从 workflowStore 读取
  export const ProsodyPanel = () => {
    const { selectedAssetId } = useWorkflowStore();

    if (!selectedAssetId) {
      return <EmptyState message="请先在步骤1上传视频" />;
    }

    // ... 其余逻辑
  };

  ---
  阶段 6：UI 优化 ⏱️ 1小时

  添加进度指示器：
  - 当前步骤高亮
  - 已完成步骤显示 ✅
  - 禁用不可访问的步骤

  添加导航按钮：
  - "上一步"（第1步禁用）
  - "下一步"（第4步改为"完成"）
  - "保存草稿"（可选）

  ---
  五、时间估算

  | 阶段 | 任务               | 时间      |
  |------|--------------------|-----------|
  | 1    | 清理旧代码         | 30 分钟   |
  | 2    | 引入 shadcn/ui     | 1 小时    |
  | 3    | 重构 workflowStore | 1 小时    |
  | 4    | 创建 Stepper 页面  | 2 小时    |
  | 5    | 优化组件通信       | 2 小时    |
  | 6    | UI 优化            | 1 小时    |
  | 总计 |                    | ~7.5 小时 |

  ---
  六、风险评估

  | 风险                               | 影响 | 缓解措施               |
  |------------------------------------|------|------------------------|
  | shadcn/ui 安装失败                 | 中   | 使用手动复制组件代码   |
  | workflowStore 重构导致其他页面报错 | 高   | 全局搜索引用，逐一更新 |
  | 用户不习惯新布局                   | 低   | 添加引导提示和说明     |

  ---
  七、参考资料

  组件库相关：

  - https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra
  - https://dev.to/shaohzaibrehman/top-10-react-nextjs-ui-libraries-to-use-in-2025-11j6
  - https://hashbyt.com/blog/19-best-react-ui-component-libraries

  Admin Dashboard 相关：

  - https://www.aniq-ui.com/en/blog/nextjs-admin-dashboard-templates-2025
  - https://www.untitledui.com/blog/react-dashboards
  - https://github.com/NextAdminHQ/nextjs-admin-dashboard

  Multi-Step Form 相关：

  - https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793
  - https://coreui.io/react/docs/forms/stepper/
  - https://www.dhiwise.com/post/the-ultimate-guide-to-leveraging-react-wizard-for-seamless-user-experiences