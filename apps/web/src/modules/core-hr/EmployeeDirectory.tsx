import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Copy, Download, MoreHorizontal, Plus, Search, UserRound, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui/avatar';
import { useAuthStore } from '../auth/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Employee } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupInput, InputGroupAddon } from '../../components/ui/input-group';
import { Card } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { PageContainer, PageHeader, EmptyState, Skeleton } from '../../components/ui/page';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHead } from '../../components/ui/table';
import { TablePagination } from '../../components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '../../components/ui/dropdown-menu';
import { cn } from '../../lib/ui/cn';

type SortKey = 'name' | 'code' | 'designation' | 'department' | 'status';

// Columns that can be hidden via the "Columns" menu — Name (with the checkbox) and the row-
// actions column always stay, matching the reference DataTableDemo's select/actions columns
// (enableHiding: false).
const TOGGLEABLE_COLUMNS = [
  { key: 'code', label: 'Employee ID' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status' },
] as const;
type ToggleableColumn = (typeof TOGGLEABLE_COLUMNS)[number]['key'];

function sortValue(emp: EmployeeWithCurrentAssignment, key: SortKey): string {
  const current = emp.employment_assignments[0];
  switch (key) {
    case 'name':
      return emp.legal_name;
    case 'code':
      return emp.employee_code;
    case 'designation':
      return current?.designations?.title ?? '';
    case 'department':
      return current?.departments?.name ?? '';
    case 'status':
      return emp.status;
  }
}

// 'draft' isn't offered here — create_employee() no longer produces it (it's for the not-yet-
// built onboarding flow), so it shouldn't be a state anyone picks by hand.
const EDITABLE_STATUSES: Employee['status'][] = ['active', 'on_leave', 'suspended', 'separation_initiated', 'separated'];

// One source of truth for how each status looks — the inline dot, the distribution bar segment,
// and the summary all read from here.
const STATUS_META: Record<Employee['status'], { label: string; dot: string; bar: string }> = {
  draft: { label: 'Draft', dot: 'bg-foreground-muted', bar: 'hsl(var(--foreground-muted))' },
  active: { label: 'Active', dot: 'bg-brand', bar: 'hsl(var(--brand-500))' },
  on_leave: { label: 'On leave', dot: 'bg-warning', bar: 'hsl(var(--warning-default))' },
  suspended: { label: 'Suspended', dot: 'bg-destructive', bar: 'hsl(var(--destructive-default))' },
  separation_initiated: { label: 'Separation initiated', dot: 'bg-warning-600', bar: 'hsl(var(--warning-600))' },
  separated: { label: 'Separated', dot: 'bg-foreground-muted', bar: 'hsl(var(--foreground-muted))' },
};

function statusLabel(s: Employee['status']) {
  return STATUS_META[s]?.label ?? s.replace(/_/g, ' ');
}

// Inline-editable status (colored dot + text, click to change) rather than a static read-only
// badge — status is something you act on from the list, not just read. Admin-gated the same way
// every other write action is.
function StatusCell({ employee, canEdit }: { employee: EmployeeWithCurrentAssignment; canEdit: boolean }) {
  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={employee.status}
        disabled={saving}
        onBlur={() => setEditing(false)}
        onChange={async (e) => {
          setSaving(true);
          await supabase.from('employees').update({ status: e.target.value as Employee['status'] }).eq('id', employee.id);
          // Reflect the change immediately rather than waiting on the Realtime round-trip.
          await fetchEmployees();
          setSaving(false);
          setEditing(false);
        }}
        className="h-7 rounded-md border border-brand bg-foreground/[0.026] px-2 text-[13px] text-foreground outline-none"
      >
        {EDITABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => canEdit && setEditing(true)}
      disabled={!canEdit}
      className={cn(
        'flex items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 transition-colors',
        canEdit ? 'cursor-pointer hover:bg-surface-200' : 'cursor-default',
      )}
      title={canEdit ? 'Click to change status' : undefined}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_META[employee.status]?.dot ?? 'bg-foreground-muted')} />
      <span className="text-[13px] text-foreground">{statusLabel(employee.status)}</span>
    </button>
  );
}

function NameCell({ employee }: { employee: EmployeeWithCurrentAssignment }) {
  return (
    <Link to={`/employees/${employee.id}`} className="group flex items-center gap-2.5">
      <Avatar name={employee.legal_name} size="xs" />
      <span className="font-medium text-foreground group-hover:text-brand-link group-hover:underline">{employee.legal_name}</span>
    </Link>
  );
}

function RowActions({ employee }: { employee: EmployeeWithCurrentAssignment }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  return (
    <DropdownMenu onOpenChange={(open) => !open && setCopied(false)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="tiny"
          className="w-[26px] px-0"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${employee.legal_name}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => navigate(`/employees/${employee.id}`)}>
          <UserRound className="h-3.5 w-3.5" />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(employee.employee_code);
            setCopied(true);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy employee ID'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function toCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// docs/build/build-guides/01-core-hr-employee-information.md screen #1. Backed by Zustand +
// Supabase Realtime, so the list updates live on any insert/update to this tenant's employees.
// "Add employee" is a full page (/employees/new), not a modal — a multi-step, infrequent task.
export default function EmployeeDirectory() {
  const role = useAuthStore((s) => s.role);
  const { employees, loading, error, fetchEmployees, subscribeToChanges, unsubscribe } = useEmployeesStore();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [filterText, setFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [hiddenColumns, setHiddenColumns] = useState<Set<ToggleableColumn>>(new Set());
  const toggleColumn = (key: ToggleableColumn) =>
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  useEffect(() => {
    fetchEmployees();
    subscribeToChanges();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleEmployees = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const filtered = q
      ? employees.filter((e) => {
          const current = e.employment_assignments[0];
          return (
            e.legal_name.toLowerCase().includes(q) ||
            e.employee_code.toLowerCase().includes(q) ||
            (current?.designations?.title ?? '').toLowerCase().includes(q) ||
            (current?.departments?.name ?? '').toLowerCase().includes(q)
          );
        })
      : employees;
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const cmp = sortValue(a, sortKey).localeCompare(sortValue(b, sortKey));
      return sortOrder === 'ASC' ? cmp : -cmp;
    });
    return copy;
  }, [employees, filterText, sortKey, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [filterText, sortKey, sortOrder, rowsPerPage]);

  const pageCount = Math.max(1, Math.ceil(visibleEmployees.length / rowsPerPage));
  const pagedEmployees = visibleEmployees.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Clear selections that scrolled out of the filtered/sorted view — keeping them would let
  // "Export CSV" silently include rows the user can no longer see.
  useEffect(() => {
    const visibleIds = new Set(visibleEmployees.map((e) => e.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEmployees]);

  const allPageSelected = pagedEmployees.length > 0 && pagedEmployees.every((e) => selectedIds.has(e.id));
  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pagedEmployees.forEach((e) => next.delete(e.id));
      else pagedEmployees.forEach((e) => next.add(e.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Three-state cycle per column: unsorted -> ASC -> DESC -> unsorted (matching the design
  // system's TanStackTableHeadSort behavior, rather than trapping a column in ASC/DESC forever
  // once first clicked).
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder('ASC');
    } else if (sortOrder === 'ASC') {
      setSortOrder('DESC');
    } else {
      setSortKey(null);
    }
  };

  const exportSelectedCsv = () => {
    const selected = visibleEmployees.filter((e) => selectedIds.has(e.id));
    const header = ['Name', 'Employee ID', 'Designation', 'Department', 'Status'].map(toCsvValue).join(',');
    const lines = selected.map((e) => {
      const current = e.employment_assignments[0];
      return [e.legal_name, e.employee_code, current?.designations?.title ?? '', current?.departments?.name ?? '', e.status]
        .map(toCsvValue)
        .join(',');
    });
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasNoEmployees = !loading && employees.length === 0;

  return (
    <PageContainer size="full" className="flex h-full flex-col">
      <PageHeader
        title="Employees"
        description="Everyone in your organisation, with their current role and status."
        className="shrink-0"
      />

      {error && (
        <Alert variant="destructive" title="Couldn't load employees" className="mb-6 shrink-0">
          {error}
        </Alert>
      )}

      {hasNoEmployees ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No employees yet"
          description="Add your first team member to start building your directory."
          action={
            role === 'admin' && (
              <Button asChild variant="primary" size="small">
                <Link to="/employees/new">
                  <Plus className="h-4 w-4" />
                  Add employee
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Filter row — search left, actions right (design system layout.md List pattern). */}
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <InputGroup size="small" className="w-full max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Filter by name, ID, role…"
                value={filterText}
                onChange={(e) => setFilterText(e.currentTarget.value)}
              />
            </InputGroup>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm tabular-nums text-foreground-light">{selectedIds.size} selected</span>
                  <Button variant="default" size="small" onClick={exportSelectedCsv}>
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="small">
                    Columns
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {TOGGLEABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={!hiddenColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {role === 'admin' && (
                <Button asChild variant="primary" size="small">
                  <Link to="/employees/new">
                    <Plus className="h-4 w-4" />
                    Add employee
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Table containerClassName="min-h-0 flex-1">
              <TableHeader sticky>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pr-0">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAll}
                      aria-label="Select all employees on this page"
                      className="cursor-pointer align-middle"
                    />
                  </TableHead>
                  <SortableHead active={sortKey === 'name'} order={sortKey === 'name' ? sortOrder : null} onClick={() => toggleSort('name')}>
                    Name
                  </SortableHead>
                  {!hiddenColumns.has('code') && (
                    <SortableHead active={sortKey === 'code'} order={sortKey === 'code' ? sortOrder : null} onClick={() => toggleSort('code')}>
                      Employee ID
                    </SortableHead>
                  )}
                  {!hiddenColumns.has('designation') && (
                    <SortableHead active={sortKey === 'designation'} order={sortKey === 'designation' ? sortOrder : null} onClick={() => toggleSort('designation')}>
                      Designation
                    </SortableHead>
                  )}
                  {!hiddenColumns.has('department') && (
                    <SortableHead active={sortKey === 'department'} order={sortKey === 'department' ? sortOrder : null} onClick={() => toggleSort('department')}>
                      Department
                    </SortableHead>
                  )}
                  {!hiddenColumns.has('status') && (
                    <SortableHead active={sortKey === 'status'} order={sortKey === 'status' ? sortOrder : null} onClick={() => toggleSort('status')}>
                      Status
                    </SortableHead>
                  )}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && employees.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pr-0"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </TableCell>
                      {!hiddenColumns.has('code') && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {!hiddenColumns.has('designation') && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {!hiddenColumns.has('department') && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {!hiddenColumns.has('status') && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      <TableCell />
                    </TableRow>
                  ))
                ) : pagedEmployees.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3 + TOGGLEABLE_COLUMNS.length - hiddenColumns.size} className="py-10 text-center">
                      <p className="text-sm text-foreground">No matches</p>
                      <p className="mt-0.5 text-sm text-foreground-lighter">
                        No employees match “{filterText.trim()}”. Try a different search.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="pr-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(emp.id)}
                          onChange={() => toggleOne(emp.id)}
                          aria-label={`Select ${emp.legal_name}`}
                          className="cursor-pointer align-middle"
                        />
                      </TableCell>
                      <TableCell>
                        <NameCell employee={emp} />
                      </TableCell>
                      {!hiddenColumns.has('code') && (
                        <TableCell className="font-mono text-xs text-foreground-lighter">{emp.employee_code}</TableCell>
                      )}
                      {!hiddenColumns.has('designation') && (
                        <TableCell>{emp.employment_assignments[0]?.designations?.title ?? '—'}</TableCell>
                      )}
                      {!hiddenColumns.has('department') && (
                        <TableCell>{emp.employment_assignments[0]?.departments?.name ?? '—'}</TableCell>
                      )}
                      {!hiddenColumns.has('status') && (
                        <TableCell>
                          <StatusCell employee={emp} canEdit={role === 'admin'} />
                        </TableCell>
                      )}
                      <TableCell className="pl-0">
                        <RowActions employee={emp} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Footer lives inside the Card as a non-shrinking row under the scroll area —
                the table body above scrolls, this stays pinned and always visible. All three
                groups (rows-per-page + range + pagination) sit on one line — no wrapping — with
                the range text in the middle allowed to truncate first on narrow widths. */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-default px-4 py-3">
              <div className="flex shrink-0 items-center gap-2 text-sm text-foreground-lighter">
                <span className="hidden sm:inline">Rows per page</span>
                <Select
                  value={String(rowsPerPage)}
                  onChange={(e) => setRowsPerPage(Number(e.currentTarget.value))}
                  className="h-7 w-[4.5rem] py-0 text-xs"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <span className="hidden truncate text-sm tabular-nums text-foreground-lighter md:block">
                {visibleEmployees.length === 0
                  ? '0 employees'
                  : `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, visibleEmployees.length)} of ${visibleEmployees.length} ${visibleEmployees.length === 1 ? 'employee' : 'employees'}`}
              </span>
              <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} className="shrink-0" />
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
