import { create } from 'zustand';

export type WorkflowMode = 'upload' | 'subtitle' | 'notation' | 'publish';
export type WorkflowStep = 0 | 1 | 2 | 3;

interface StepCompletion {
  upload: boolean;
  subtitle: boolean;
  notation: boolean;
  publish: boolean;
}

export interface WorkflowState {
  // 当前步骤（0-based）
  currentStep: WorkflowStep;

  // 当前工作模式（用于兼容）
  currentMode: WorkflowMode;

  // 当前选中的资源（跨步骤共享）
  selectedAssetId: string | null;
  selectedAssetName: string | null;
  selectedVideoUrl: string | null;

  // 每个步骤的完成状态
  stepCompletion: StepCompletion;

  // Actions
  goToStep: (step: WorkflowStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectAsset: (assetId: string | null, assetName?: string | null, videoUrl?: string | null) => void;
  markStepComplete: (step: WorkflowMode) => void;
  canGoToStep: (step: WorkflowStep) => boolean;
  reset: () => void;
}

const stepToMode: Record<WorkflowStep, WorkflowMode> = {
  0: 'upload',
  1: 'subtitle',
  2: 'notation',
  3: 'publish',
};

const modeToStep: Record<WorkflowMode, WorkflowStep> = {
  upload: 0,
  subtitle: 1,
  notation: 2,
  publish: 3,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentStep: 0,
  currentMode: 'upload',
  selectedAssetId: null,
  selectedAssetName: null,
  selectedVideoUrl: null,
  stepCompletion: {
    upload: false,
    subtitle: false,
    notation: false,
    publish: false,
  },

  goToStep: (step) => {
    const state = get();
    // 只能跳转到已完成的步骤或下一个步骤
    if (state.canGoToStep(step)) {
      set({
        currentStep: step,
        currentMode: stepToMode[step],
      });
    }
  },

  nextStep: () => {
    const state = get();
    const nextStep = Math.min(state.currentStep + 1, 3) as WorkflowStep;
    if (state.canGoToStep(nextStep)) {
      set({
        currentStep: nextStep,
        currentMode: stepToMode[nextStep],
      });
    }
  },

  prevStep: () => {
    const state = get();
    const prevStep = Math.max(state.currentStep - 1, 0) as WorkflowStep;
    set({
      currentStep: prevStep,
      currentMode: stepToMode[prevStep],
    });
  },

  selectAsset: (assetId, assetName, videoUrl = null) => set({
    selectedAssetId: assetId,
    selectedAssetName: assetName || null,
    selectedVideoUrl: videoUrl,
  }),

  markStepComplete: (mode) => {
    set((state) => ({
      stepCompletion: {
        ...state.stepCompletion,
        [mode]: true,
      },
    }));
  },

  canGoToStep: (step) => {
    // 允许自由跳转到任何步骤 - 不再强制要求前面的步骤完成
    // 只是通过视觉提示建议用户按顺序完成
    return true;
  },

  reset: () => set({
    currentStep: 0,
    currentMode: 'upload',
    selectedAssetId: null,
    selectedAssetName: null,
    selectedVideoUrl: null,
    stepCompletion: {
      upload: false,
      subtitle: false,
      notation: false,
      publish: false,
    },
  }),
}));
