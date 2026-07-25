import * as React from 'react';
import { cn } from '../../lib/ui/cn';

// Supabase page layout system (ui-patterns/layout.md + the Page* fragments). These wrappers give
// every screen the same width, spacing, and header structure so the app reads as one product:
//
//   <PageContainer>
//     <PageHeader title=… description=… actions={…} />
//     <PageSection title=… description=…> … </PageSection>
//   </PageContainer>
//
// Width is chosen by content, not page type: `small` for focused forms, `default` for lists and
// detail pages, `full` for dense/wide content.

const WIDTHS = {
  small: 'max-w-2xl',
  default: 'max-w-5xl',
  full: 'max-w-none',
} as const;

export function PageContainer({
  size = 'default',
  className,
  children,
}: {
  size?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mx-auto w-full px-6 py-6 md:px-8 md:py-8', WIDTHS[size], className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0 text-foreground-lighter">{icon}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-foreground-lighter">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('mb-10', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-sm font-medium text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-foreground-lighter">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// A read-only label/value pair for detail views. Intended inside a <dl> grid.
export function InfoField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-foreground-lighter">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children ?? '—'}</dd>
    </div>
  );
}

// A simple shimmer block for loading states (Supabase Skeleton, components/skeleton.md).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-300', className)} />;
}

// Supabase presentational empty state (ui-patterns/empty-states.md + fragments/empty-state-
// presentational.md): a centered icon, an action-oriented title, a short description, and an
// optional primary action. Used for initial "nothing here yet" states — active language, not
// "No X found".
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-strong bg-surface-100 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-default bg-surface-200 text-foreground-lighter">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-foreground-lighter">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
