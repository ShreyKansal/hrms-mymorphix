import * as React from 'react';
import { Label } from './label';
import { cn } from '../../lib/ui/cn';

// Supabase FormItemLayout (fragments/form-item-layout.md): a label + optional helper description
// above the control, with an inline field-level error slot below. Matching Supabase's own markup,
// it wires `aria-describedby` (to the description and error) and `aria-invalid` onto the control —
// so screen readers announce the help/error text, and the Input's `aria-[invalid=true]:` styling
// engages automatically when an error is present.
export function Field({
  label,
  htmlFor,
  required,
  description,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const reactId = React.useId();
  const descId = description ? `${reactId}-desc` : undefined;
  const errId = error ? `${reactId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-describedby': [(children.props as Record<string, unknown>)['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : (children.props as Record<string, unknown>)['aria-invalid'],
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="space-y-0.5">
        <Label htmlFor={htmlFor} required={required} className="mb-0">
          {label}
        </Label>
        {description && (
          <p id={descId} className="text-xs text-foreground-lighter">
            {description}
          </p>
        )}
      </div>
      {control}
      {error && (
        <p id={errId} className="text-xs text-destructive-600">
          {error}
        </p>
      )}
    </div>
  );
}
