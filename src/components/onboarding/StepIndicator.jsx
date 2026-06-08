// StepIndicator — shared progress indicator for onboarding wizards (filled/empty dots)
import { cn } from '../../lib/utils';

const defaultLabels = ['Step 1', 'Step 2', 'Step 3'];

export default function StepIndicator({ currentStep, totalSteps = 3, stepLabels = defaultLabels }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
                  isCompleted && 'bg-brand text-white',
                  isActive && 'bg-brand text-white ring-4 ring-brand-100',
                  !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  isActive ? 'text-brand font-medium' : 'text-muted-foreground'
                )}
              >
                {stepLabels[i] || `Step ${stepNum}`}
              </span>
            </div>
            {stepNum < totalSteps && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-12 -mt-4 transition-colors duration-200',
                  isCompleted ? 'bg-brand' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
