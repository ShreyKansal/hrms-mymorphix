import { Check } from 'lucide-react';
import { cn } from './ui/cn';

// The multi-step wizard progress indicator (used by Create Employee). Renders the researched
// rules directly: a persistent indicator, steps labelled with their real name (not "Step 3"),
// and current/done/upcoming states. Completed and current steps carry the brand green; no
// skipping ahead is enforced by the caller (steps aren't clickable).
export interface StepperStep {
  label: string;
}

export function Stepper({ steps, currentIndex }: { steps: StepperStep[]; currentIndex: number }) {
  return (
    <ol className="flex list-none items-center p-0">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.label} className={cn('flex items-center', i === steps.length - 1 ? 'flex-none' : 'flex-1')}>
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isDone
                    ? 'border-brand bg-brand text-brand-foreground'
                    : isCurrent
                      ? 'border-brand bg-brand/15 text-brand'
                      : 'border-strong bg-surface-100 text-foreground-muted',
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm transition-colors',
                  isCurrent ? 'font-medium text-foreground' : isDone ? 'text-foreground-light' : 'text-foreground-muted',
                )}
              >
                {step.label}
              </span>
            </div>
            {i !== steps.length - 1 && <div className={cn('mx-3 h-px flex-1 transition-colors', isDone ? 'bg-brand' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}
