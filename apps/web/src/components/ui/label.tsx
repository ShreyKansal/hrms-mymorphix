import * as React from 'react';
import { cn } from '../../lib/ui/cn';

export function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1 block text-xs font-bold text-text-subtle', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-text-danger">*</span>}
    </label>
  );
}
