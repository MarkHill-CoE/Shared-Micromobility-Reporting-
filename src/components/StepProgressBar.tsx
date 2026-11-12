import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick: (step: number) => void;
  completedSteps: boolean[];
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
  onStepClick,
  completedSteps,
}) => {
  return (
    <div className="w-full mb-8" aria-label="Form progress">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#005087]">
          Section {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-semibold text-[#767676] tabular-nums">
          {Math.round(((currentStep - 1) / (totalSteps - 1 || 1)) * 100)}% Completed
        </span>
      </div>

      {/* Progress track */}
      <div className="grid grid-cols-3 gap-2.5">
        {stepTitles.map((title, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = completedSteps[idx];
          const isClickable = isComplete || stepNumber < currentStep;

          return (
            <button
              key={stepNumber}
              type="button"
              disabled={!isClickable && !isActive}
              onClick={() => isClickable && onStepClick(stepNumber)}
              className={`group flex flex-col text-left transition-all ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`h-2 w-full rounded-xs transition-all duration-300 ${
                  isActive
                    ? 'bg-[#005087]'
                    : isComplete
                    ? 'bg-[#008269]'
                    : 'bg-[#D0D7DE]'
                }`}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    isComplete
                      ? 'bg-[#EBF7F4] text-[#008269]'
                      : isActive
                      ? 'bg-[#005087] text-white'
                      : 'bg-[#F3F5F7] text-[#767676] border border-[#D0D7DE]'
                  }`}
                >
                  {isComplete ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : stepNumber}
                </span>
                <span
                  className={`text-xs truncate font-medium ${
                    isActive
                      ? 'text-[#193A5A] font-bold'
                      : isComplete
                      ? 'text-[#444444]'
                      : 'text-[#767676]'
                  }`}
                >
                  {title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
