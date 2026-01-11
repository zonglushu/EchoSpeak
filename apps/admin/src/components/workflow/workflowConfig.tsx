import { WorkflowStep } from '@/stores/workflowStore';

export interface WorkflowStepConfig {
  id: string;
  number: WorkflowStep;
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const workflowSteps: WorkflowStepConfig[] = [
  {
    id: 'upload',
    number: 0,
    label: '上传视频',
    description: '上传或选择视频文件',
  },
  {
    id: 'subtitle',
    number: 1,
    label: '字幕处理',
    description: 'AI 转写或手动编辑',
  },
  {
    id: 'notation',
    number: 2,
    label: 'AI 发音谱',
    description: '生成韵律标注',
  },
  {
    id: 'publish',
    number: 3,
    label: '发布内容',
    description: '发布到学员端',
  },
];
