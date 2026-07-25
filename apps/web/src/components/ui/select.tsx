import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from './input';
import { cn } from '../../lib/ui/cn';

// Native <select> sharing the Input's exact Supabase class base (so inputs and selects line up in
// forms and toolbars), plus `appearance-none` + right padding for the decorative chevron.
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select ref={ref} className={cn(inputClass, 'cursor-pointer appearance-none pr-9', className)} {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-lighter" />
      </div>
    );
  },
);
Select.displayName = 'Select';
