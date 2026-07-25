import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/ui/cn';

// Plain <table>, not a virtualized/paginated Data Grid — matches this app's own §1 rule
// (docs/build/03-ui-patterns.md): a primary, unbounded list gets real sorting wired up by the
// consumer (see SortableHead below), a secondary embedded list just needs the bare pieces.
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-border', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-border last:border-0', className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-2 py-2 text-left text-xs font-semibold text-text-subtle', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-2 py-2 text-foreground', className)} {...props} />;
}

// A clickable header cell with a real, wired sort indicator — for a primary list's own
// controlled sort state (see EmployeeDirectory's use). Purely presentational: the consumer
// owns sortKey/sortOrder and does the actual sorting, this just renders the right icon and
// fires onSort with the next state, same three-way cycle (asc/desc/none) as before.
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
    <th className={cn('px-2 py-2 text-left text-xs font-semibold text-text-subtle', className)}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}
