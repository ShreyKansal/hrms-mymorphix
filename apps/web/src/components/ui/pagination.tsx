import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { buttonVariants } from './button';
import { cn } from '../../lib/ui/cn';

// Supabase design system Pagination (components/pagination.md) — this one is stock shadcn/ui
// (installed via `npx shadcn-ui add pagination`, unmodified by Supabase), per the design
// system's own docs. shadcn's version renders <a href> for Next.js routing; this app is a
// client-side <BrowserRouter> SPA with pagination held in component state (not the URL), so
// PaginationLink/Previous/Next render <button onClick> instead of <a href> — same markup,
// variants, and sizing, just wired for state instead of navigation.

export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...props} />;
}

export function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

export function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={className} {...props} />;
}

interface PaginationLinkProps extends React.ComponentProps<'button'> {
  isActive?: boolean;
}

export function PaginationLink({ className, isActive, disabled, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      disabled={disabled}
      className={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size: 'small' }), 'h-8 w-8 px-0', className)}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <PaginationLink aria-label="Go to previous page" className={cn('w-auto gap-1 px-2.5', className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <PaginationLink aria-label="Go to next page" className={cn('w-auto gap-1 px-2.5', className)} {...props}>
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span aria-hidden="true" className={cn('flex h-8 w-8 items-center justify-center text-foreground-lighter', className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// Windowed page numbers with ellipses (1 … 4 5 [6] 7 8 … 20), the pattern every real table with
// more than a handful of pages needs — always shows first, last, and a run around the current
// page, collapsing everything else into a single ellipsis per side.
function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  const add = (p: number) => pages.push(p);
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  add(1);
  if (windowStart > 2) pages.push('ellipsis');
  for (let p = windowStart; p <= windowEnd; p++) add(p);
  if (windowEnd < total - 1) pages.push('ellipsis');
  if (total > 1) add(total);

  return pages;
}

// Table-ready wrapper: give it the current page, total page count, and a setter — it renders
// Previous / numbered pages with ellipses / Next, fully wired. This is what screens with a
// paginated <Table> should reach for instead of hand-rolling Previous/Next buttons.
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <Pagination className={cn('justify-end', className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} onClick={() => onPageChange(page - 1)} />
        </PaginationItem>
        {pageWindow(page, pageCount).map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink isActive={p === page} onClick={() => onPageChange(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext disabled={page === pageCount} onClick={() => onPageChange(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
