import { Check } from 'lucide-react';
import { cn } from './ui/cn';

// First real multi-step flow in the app (docs/build/03-ui-patterns.md §2's researched
// threshold: >6-7 fields or distinct field categories + an infrequent task → full page with a
// wizard, not a Modal). Pulled into src/lib/ rather than left local to Create Employee because
// the same shape will apply to the next infrequent, multi-category flow this PRD calls out
// (Onboarding/Module 3, Separation/Module 15) — one implementation to keep in sync with NN/g's
// wizard rules, not a copy per module.
//
// Renders the rules directly: a persistent progress indicator, steps labeled with their actual
// name (not "Step 3"), and current/done/upcoming states — no skipping ahead is enforced by the
// caller (steps aren't clickable), not by this component.
export interface StepperStep {
  label: string;
}

export function Stepper({ steps, currentIndex }: { steps: StepperStep[]; currentIndex: number }) {
  return (
    <ol className="mb-8 flex list-none p-0">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.label} className={cn('flex items-center', i === steps.length - 1 ? 'flex-none' : 'flex-1')}>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone ? 'bg-success-text text-text-inverse' : isCurrent ? 'bg-selected text-text-inverse' : 'bg-secondary text-text-subtlest',
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('text-sm', isCurrent ? 'font-semibold text-foreground' : isDone ? 'text-foreground' : 'text-text-subtlest')}>
                {step.label}
              </span>
            </div>
            {i !== steps.length - 1 && <div className={cn('mx-3 h-px flex-1', isDone ? 'bg-success-text' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}
