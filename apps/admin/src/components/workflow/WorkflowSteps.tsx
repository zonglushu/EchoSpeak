'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useTranscriptStore } from '@/stores/transcriptStore';

// 动态导入所有工作流步骤组件（客户端组件）
const UploadWorkbench = dynamic(
  () => import('@/components/upload/UploadWorkbench').then(mod => ({ default: mod.UploadWorkbench })),
  {
    loading: () => <div className="flex items-center justify-center py-12">加载中...</div>,
  }
);

const SubtitleWorkbench = dynamic(
  () => import('@/components/subtitles/SubtitleWorkbench').then(mod => ({ default: mod.SubtitleWorkbench })),
  {
    loading: () => <div className="flex items-center justify-center py-12">加载中...</div>,
  }
);

const ProsodyPanel = dynamic(
  () => import('@/components/prosody/ProsodyPanel').then(mod => ({ default: mod.ProsodyPanel })),
  {
    loading: () => <div className="flex items-center justify-center py-12">加载中...</div>,
  }
);

const ContentLibrary = dynamic(
  () => import('@/components/library/ContentLibrary').then(mod => ({ default: mod.ContentLibrary })),
  {
    loading: () => <div className="flex items-center justify-center py-12">加载中...</div>,
  }
);

export function WorkflowSteps() {
  const { currentStep, selectedAssetId, currentMode, markStepComplete } = useWorkflowStore();
  const { lines } = useTranscriptStore();

  // 自动标记步骤完成
  useEffect(() => {
    switch (currentMode) {
      case 'upload':
        if (selectedAssetId) {
          markStepComplete('upload');
        }
        break;
      case 'subtitle':
        if (lines.length > 0) {
          markStepComplete('subtitle');
        }
        break;
      case 'notation':
        if (lines.length > 0 && lines.every(line => line.notation)) {
          markStepComplete('notation');
        }
        break;
    }
  }, [selectedAssetId, lines, currentMode, markStepComplete]);

  // 使用 useMemo 优化组件选择，避免每次渲染都重新判断
  const StepComponent = useMemo(() => {
    switch (currentStep) {
      case 0: // 上传
        return UploadWorkbench;
      case 1: // 字幕
        return SubtitleWorkbench;
      case 2: // 发音谱
        return ProsodyPanel;
      case 3: // 发布
        return ContentLibrary;
      default:
        return null;
    }
  }, [currentStep]);

  if (!StepComponent) {
    return null;
  }

  return (
    <div className="min-h-[400px]">
      <StepComponent />
    </div>
  );
}

