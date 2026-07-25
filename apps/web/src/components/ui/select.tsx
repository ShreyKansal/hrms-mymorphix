import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/ui/cn';

// Native <select>, not Radix Select — same call this app made before (see the old
// SelectField.tsx's own reasoning): a native select is simpler, fully accessible/keyboard-
// operable for free, and every use here is a plain flat option list with no need for custom-
// rendered dropdown items. Styled to match Input's real measured box.
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-border-input bg-background px-2.5 pr-8 text-sm text-foreground',
            'focus-visible:border-border-focused focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
      </div>
    );
  },
);
Select.displayName = 'Select';
