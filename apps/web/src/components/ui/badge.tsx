import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/ui/cn';

// Replaces @atlaskit/lozenge for read-only status/role/category tags — see
// docs/build/03-ui-patterns.md §8 for when to use this vs. the inline-editable dot-status
// pattern (EmployeeDirectory's StatusCell, which stays a plain colored dot + <select>, not
// this component — that one needs to swap into a real form control, a Badge can't do that).
const badgeVariants = cva('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      success: 'bg-success-bg text-success-text',
      warning: 'bg-warning-bg text-warning-text',
      danger: 'bg-danger-bg text-danger-text',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
