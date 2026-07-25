import * as React from 'react';
import { cn } from '../../lib/ui/cn';

// Supabase Input — the design system's own class string, verbatim (confirmed against the
// component's rendered markup in docs/design-system/supabase-design-system/raw-html/*, and the
// `focus-ring` recipe in getting-started/accessibility.md). A 34px control on a 2.6% foreground
// tint with a hairline `border-control`, the shared neutral offset `focus-ring`, and
// read-only / disabled / aria-invalid states. Consumers layer extra classes (e.g. `pr-10` for a
// trailing icon) via `className`.
const inputClass =
  'flex w-full rounded-md border border-control read-only:border-button bg-foreground/[0.026] ' +
  'file:border-0 file:bg-transparent file:text-sm file:font-medium ' +
  'placeholder:text-foreground-muted read-only:text-foreground-light ' +
  'focus:border-control focus-ring ' +
  'disabled:cursor-not-allowed disabled:text-foreground-muted ' +
  'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive ' +
  'text-base md:text-sm leading-4 px-3 py-2 h-[34px]';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} ref={ref} className={cn(inputClass, className)} {...props} />;
  },
);
Input.displayName = 'Input';

export { inputClass };
