import * as React from 'react';
import { cn } from '../../lib/ui/cn';

// Supabase InputGroup (components/input-group.md) — a search/affix input where the border and
// focus ring live on the *group*, not the inner `<input>`: the input itself is borderless and
// transparent so it and its icon addon read as one unified control. Reuses Input's real
// measurements (`border-control`, `bg-foreground/[0.026]`, the same offset focus-ring box-shadow)
// rather than duplicating a second set of tokens.
const GROUP_SIZE = {
  tiny: 'h-[26px]',
  small: 'h-[30px]',
  medium: 'h-[34px]',
} as const;

type InputGroupSize = keyof typeof GROUP_SIZE;

const InputGroupContext = React.createContext<InputGroupSize>('medium');

export function InputGroup({
  className,
  size = 'medium',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: InputGroupSize }) {
  return (
    <InputGroupContext.Provider value={size}>
      <div
        role="group"
        className={cn(
          'flex w-full items-center rounded-md border border-control bg-foreground/[0.026] transition-colors',
          'has-[:focus-visible]:border-control has-[:focus-visible]:[box-shadow:0_0_0_2px_hsl(var(--background-default)),0_0_0_4px_hsl(var(--ring))]',
          GROUP_SIZE[size],
          className,
        )}
        {...props}
      />
    </InputGroupContext.Provider>
  );
}

export const InputGroupInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-base leading-4 text-foreground outline-none',
        'placeholder:text-foreground-muted md:text-sm',
        className,
      )}
      {...props}
    />
  ),
);
InputGroupInput.displayName = 'InputGroupInput';

export function InputGroupAddon({
  className,
  align = 'start',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  const size = React.useContext(InputGroupContext);
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center text-foreground-lighter [&>svg]:h-3.5 [&>svg]:w-3.5',
        align === 'start' ? 'pl-2.5' : 'pr-2.5',
        size === 'tiny' ? 'pl-2' : undefined,
        className,
      )}
      {...props}
    />
  );
}
