'use client';

import { useWorkflowStore } from '@/stores/workflowStore';
import { StepperHorizontal } from '@/components/ui/stepper';
import { workflowSteps } from './workflowConfig';

export function WorkflowStepper() {
  const { currentStep, goToStep } = useWorkflowStore();

  return (
    <div className="mb-8">
      <StepperHorizontal
        steps={workflowSteps}
        currentStep={currentStep}
        onStepClick={(step) => {
          goToStep(step as any);
        }}
      />
    </div>
  );
}
