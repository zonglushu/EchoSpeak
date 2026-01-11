import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface Step {
  id: string
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && index <= currentStep

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:border-primary/80",
                    !isClickable && "cursor-default"
                  )}
                  type="button"
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-all",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  style={{ maxWidth: "120px", margin: "0 1rem" }}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// Alternative horizontal stepper with compact design
export function StepperHorizontal({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick // 允许点击所有步骤

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all whitespace-nowrap",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default opacity-50"
                )}
                type="button"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isCompleted && "bg-primary-foreground text-primary",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span>{step.label}</span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-all",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
