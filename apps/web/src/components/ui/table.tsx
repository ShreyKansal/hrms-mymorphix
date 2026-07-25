import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/ui/cn';

// Supabase Table (components/table.md + the rendered markup in raw-html/components/table.html).
// Matched to the real spec: header cells are h-10 with tertiary text, body cells are generously
// padded (p-4) and default to the FULL foreground colour — secondary/tertiary columns opt into
// `text-foreground-lighter`/`-muted` themselves (getting my earlier default wrong, a blanket
// `text-foreground-light`, is what made the whole table read as "greyed out"). Rows separate with
// a hairline and lift to surface-200 on hover. Usually presented inside a Card.
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-default', className)} {...props} />;
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
  return (
    <th className={cn('h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-normal text-foreground-lighter transition-colors', className)}>
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
