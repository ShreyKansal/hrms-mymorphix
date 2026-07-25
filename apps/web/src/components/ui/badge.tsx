import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/ui/cn';

// Supabase Badge (components/badge.md): a small pill for contextual state/category — subtle
// tinted fill, matching hairline border, colored text. Kept fully rounded and one/two words, as
// the component guidance instructs (don't alter case or roundedness). `danger` is retained as an
// alias for `destructive` since existing call sites use it.
const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'border-strong bg-surface-200 text-foreground-light',
      secondary: 'border-transparent bg-transparent text-foreground-lighter',
      success: 'border-brand-500/30 bg-brand-200 text-brand-600',
      brand: 'border-brand-500/30 bg-brand-200 text-brand-600',
      warning: 'border-warning-400/30 bg-warning-200 text-warning-600',
      destructive: 'border-destructive-400/30 bg-destructive-200 text-destructive-600',
      danger: 'border-destructive-400/30 bg-destructive-200 text-destructive-600',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
