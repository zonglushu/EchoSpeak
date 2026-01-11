'use client';

/**
 * 工作流步骤内容包装器
 * 这个组件负责在步骤切换时自动加载数据
 */

import { useEffect } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useTranscriptStore } from '@/stores/transcriptStore';

interface WorkflowStepContentWrapperProps {
  children: React.ReactNode;
  step: 'upload' | 'subtitle' | 'notation' | 'publish';
}

export function WorkflowStepContentWrapper({ children, step }: WorkflowStepContentWrapperProps) {
  const { selectedAssetId, markStepComplete, currentMode } = useWorkflowStore();
  const { lines } = useTranscriptStore();

  // 当步骤完成且有数据时，自动标记为完成
  useEffect(() => {
    if (currentMode !== step) return;

    // 根据不同步骤判断完成条件
    let isComplete = false;

    switch (step) {
      case 'upload':
        isComplete = !!selectedAssetId;
        break;
      case 'subtitle':
        isComplete = lines.length > 0;
        break;
      case 'notation':
        isComplete = lines.length > 0 && lines.every(line => line.notation);
        break;
      case 'publish':
        // 发布步骤的完成条件由 ContentLibrary 组件管理
        break;
    }

    if (isComplete) {
      markStepComplete(step);
    }
  }, [selectedAssetId, lines, step, currentMode, markStepComplete]);

  return <>{children}</>;
}
