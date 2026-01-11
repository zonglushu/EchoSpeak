import { Suspense } from 'react';
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper';
import { WorkflowSteps } from '@/components/workflow/WorkflowSteps';
import { WorkflowNavigation } from '@/components/workflow/WorkflowNavigation';

export default function ProcessingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">内容生产工作台</h1>
        <p className="mt-1 text-sm text-slate-500">
          上传 → 转写 → AI 打谱 → 发布 分步完成内容制作
        </p>
      </header>

      {/* Workflow Stepper */}
      <WorkflowStepper />

      {/* Workflow Steps Content */}
      <Suspense fallback={<div className="flex items-center justify-center py-12">加载中...</div>}>
        <WorkflowSteps />
      </Suspense>

      {/* Workflow Navigation */}
      <WorkflowNavigation />
    </div>
  );
}
