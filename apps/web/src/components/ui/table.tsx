import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/ui/cn';

// Supabase Table (components/table.md + the rendered markup in raw-html/components/table.html).
// Matched to the real spec: header cells are h-10 with tertiary text, body cells are generously
// padded (p-4) and default to the FULL foreground colour — secondary/tertiary columns opt into
// `text-foreground-lighter`/`-muted` themselves (getting my earlier default wrong, a blanket
// `text-foreground-light`, is what made the whole table read as "greyed out"). Rows separate with
// a hairline and lift to surface-200 on hover. Usually presented inside a Card.
// `containerClassName` styles the scroll wrapper — pass `flex-1 min-h-0` to make the wrapper the
// vertical scroll region inside a height-constrained flex column (so the body scrolls while a
// footer stays pinned below). Default is horizontal-only scroll, unchanged for existing callers.
export function Table({
  className,
  containerClassName,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  return (
    <div className={cn('w-full overflow-auto', containerClassName)}>
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

// `sticky` pins the header to the top of the scroll container (opaque surface-100 background so
// rows don't show through). Only meaningful when the Table wrapper actually scrolls vertically.
export function TableHeader({
  className,
  sticky,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }) {
  return (
    <thead
      className={cn('[&_tr]:border-b [&_tr]:border-default', sticky && 'sticky top-0 z-10 bg-surface-100', className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'group border-b border-default transition-colors last:border-0 hover:bg-surface-200 data-[state=selected]:bg-surface-200',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-normal text-foreground-lighter transition-colors',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3.5 align-middle text-sm text-foreground transition-colors', className)} {...props} />;
}

// A clickable header cell with a wired sort indicator (Supabase's TableHeadSort equivalent):
// up when ascending, down when descending, chevrons when unsorted (shown on hover).
export function SortableHead({
  active,
  order,
  onClick,
  className,
  children,
}: {
  active: boolean;
  order: 'ASC' | 'DESC' | null;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = !active ? ChevronsUpDown : order === 'ASC' ? ArrowUp : ArrowDown;
  const ariaSort = !active ? 'none' : order === 'ASC' ? 'ascending' : 'descending';
  return (
    <th
      aria-sort={ariaSort}
      className={cn('h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-normal text-foreground-lighter transition-colors', className)}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn('group/sort inline-flex items-center gap-1.5 transition-colors hover:text-foreground', active && 'text-foreground')}
      >
        {children}
        <Icon className={cn('h-3.5 w-3.5', active ? 'text-brand' : 'text-foreground-muted opacity-0 group-hover/sort:opacity-100')} />
      </button>
    </th>
  );
}
