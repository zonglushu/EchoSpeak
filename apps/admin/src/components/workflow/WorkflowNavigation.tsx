'use client';

import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function WorkflowNavigation() {
  const { currentStep, prevStep, nextStep, stepCompletion, canGoToStep } = useWorkflowStore();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 3;

  const handleNext = () => {
    if (isLastStep) {
      // 最后一步，完成工作流
      // TODO: 触发完成逻辑
      console.log('Workflow completed');
    } else {
      nextStep();
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      <Button
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        上一步
      </Button>

      <div className="text-sm text-muted-foreground">
        步骤 {currentStep + 1} / 4
      </div>

      <Button
        onClick={handleNext}
      >
        {isLastStep ? '完成' : '下一步'}
        {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}
