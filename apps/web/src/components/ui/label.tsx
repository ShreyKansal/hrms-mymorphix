import * as React from 'react';
import { cn } from '../../lib/ui/cn';

// Supabase form label (components/label.md, fragments/form-item-layout.md): a quiet, sentence-
// case label above its control. The required marker is a brand-agnostic destructive asterisk.
export function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1.5 block text-sm font-normal text-foreground-light', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-destructive-600">*</span>}
    </label>
  );
}
