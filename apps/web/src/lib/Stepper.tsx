import { token } from '@atlaskit/tokens';

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
    <ol
      style={{
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        marginBottom: 32,
      }}
    >
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const circleColor = isDone
          ? token('color.background.success.bold', '#1F845A')
          : isCurrent
            ? token('color.background.selected.bold', '#0C66E4')
            : token('color.background.disabled', '#F1F2F4');
        const textColor = isCurrent
          ? token('color.text', '#172B4D')
          : isDone
            ? token('color.text', '#172B4D')
            : token('color.text.subtlest', '#8590A2');

        return (
          <li key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? '0 0 auto' : '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: circleColor,
                  color: isDone || isCurrent ? token('color.text.inverse', '#FFFFFF') : token('color.text.subtlest', '#8590A2'),
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: textColor }}>{step.label}</span>
            </div>
            {i !== steps.length - 1 && (
              <div
                style={{
                  flex: '1 1 auto',
                  height: 1,
                  margin: '0 12px',
                  backgroundColor: isDone ? token('color.background.success.bold', '#1F845A') : token('color.border', '#DCDFE4'),
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
