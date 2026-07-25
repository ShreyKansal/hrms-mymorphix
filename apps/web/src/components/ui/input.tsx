import * as React from 'react';
import { cn } from '../../lib/ui/cn';

// Height/radius/border match Atlaskit's real measured TextField box (40px/3px/1px — see
// docs/build/03-ui-patterns.md §7), not Tailwind's defaults.
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-border-input bg-background px-2.5 text-sm text-foreground',
          'placeholder:text-text-subtlest',
          'focus-visible:border-border-focused focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
