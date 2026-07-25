import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/ui/cn';

// Supabase Alert / Admonition (components/alert.md, fragments/admonition.md): a low-level callout
// with a leading icon, title, and description on a tinted surface. Used for form-level errors
// and inline guidance instead of a lone red line of text.
const alertVariants = cva('flex gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-default bg-surface-100 text-foreground-light [&>svg]:text-foreground-lighter',
      brand: 'border-brand-500/30 bg-brand-200 text-brand-600 [&>svg]:text-brand',
      warning: 'border-warning-400/30 bg-warning-200 text-warning-600 [&>svg]:text-warning',
      destructive: 'border-destructive-400/30 bg-destructive-200 text-destructive-600 [&>svg]:text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

const ICONS = {
  default: Info,
  brand: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  icon?: React.ReactNode;
}

export function Alert({ className, variant = 'default', title, icon, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? 'default'];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <span className="mt-0.5 shrink-0">{icon ?? <Icon className="h-4 w-4" />}</span>
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children && <div className="[&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}
