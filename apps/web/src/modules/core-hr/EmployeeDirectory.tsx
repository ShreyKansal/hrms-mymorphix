import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import { avatarColor, initials } from '../../lib/avatar';
import { useAuthStore } from '../auth/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Employee } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHead } from '../../components/ui/table';
import { cn } from '../../lib/ui/cn';

type SortKey = 'name' | 'code' | 'designation' | 'department' | 'status';

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

// 'draft' isn't offered here — create_employee() no longer produces it (see
// docs/build/03-ui-patterns.md, the Create Employee wizard write-up), it's specifically for the
// not-yet-built Module 3 onboarding flow, so it shouldn't be a state anyone picks by hand.
const EDITABLE_STATUSES: Employee['status'][] = ['active', 'on_leave', 'suspended', 'separation_initiated', 'separated'];
const STATUS_DOT_COLOR: Record<Employee['status'], string> = {
  draft: 'bg-text-subtlest',
  active: 'bg-success-text',
  on_leave: 'bg-warning-text',
  suspended: 'bg-destructive',
  separation_initiated: 'bg-destructive',
  separated: 'bg-text-subtle',
};

// Inline-editable status (colored dot + text, click to change) rather than a static read-only
// badge — the Qubit reference this table is benchmarked against treats status as something you
// act on from the list, not just read. Admin-gated the same way every other write action in
// this app is.
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
          // Don't wait on Realtime to refresh the row — a status change the user just made
          // should be reflected the instant it's saved, not whenever the subscription
          // round-trip happens to land.
          await fetchEmployees();
          setSaving(false);
          setEditing(false);
        }}
        className="h-7 rounded border border-border-focused text-[13px]"
      >
        {EDITABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => canEdit && setEditing(true)}
      disabled={!canEdit}
      className={cn('flex items-center gap-1.5 bg-transparent p-0 font-sans', canEdit ? 'cursor-pointer' : 'cursor-default')}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_COLOR[employee.status])} />
      <span className="text-[13px] capitalize text-foreground">{employee.status.replace('_', ' ')}</span>
    </button>
  );
}

function NameCell({ employee }: { employee: EmployeeWithCurrentAssignment }) {
  return (
    <Link to={`/employees/${employee.id}`} className="flex items-center gap-2 text-selected hover:underline">
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-text-inverse"
        style={{ backgroundColor: avatarColor(employee.legal_name) }}
      >
        {initials(employee.legal_name)}
      </span>
      {employee.legal_name}
    </Link>
  );
}

function toCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const ROWS_PER_PAGE = 20;

// docs/build/build-guides/01-core-hr-employee-information.md screen #1 —
// "keep row actions minimal ... click a row -> Employee Detail page."
// Now backed by Zustand + Supabase Realtime instead of TanStack Query + REST polling —
// the list updates live on any insert/update to this tenant's employees, from any tab.
// "Add employee" is a Link to a full page (/employees/new), not a Modal — see
// docs/build/03-ui-patterns.md §2 for why: a 5-step, multi-category, infrequent task fails
// both NN/g's and Smashing Magazine's thresholds for staying a Modal.
export default function EmployeeDirectory() {
  const role = useAuthStore((s) => s.role);
  const { employees, loading, error, fetchEmployees, subscribeToChanges, unsubscribe } = useEmployeesStore();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [filterText, setFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

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
  }, [filterText, sortKey, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(visibleEmployees.length / ROWS_PER_PAGE));
  const pagedEmployees = visibleEmployees.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Clear out selections that scrolled out of the filtered/sorted view — keeping them would let
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

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder('ASC');
    } else {
      setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
    }
  };

  // The first genuinely real bulk action — a client-side CSV export needs no new backend
  // surface and no new write-permission questions, unlike e.g. bulk status change would.
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

  // A genuine, if simple, use of Recharts — headcount by status.
  const statusCounts = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return (
    <div className="mx-auto max-w-[1296px] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">Employee Directory</h1>
        {role === 'admin' && (
          <Link to="/employees/new">
            <Button variant="primary">Add employee</Button>
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-text-danger">Could not load employees: {error}</p>}

      {chartData.length > 0 && (
        <div className="mb-6 h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax']} hide />
              <YAxis type="category" dataKey="status" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#0052CC" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="w-[280px]">
          <Input placeholder="Filter this list…" value={filterText} onChange={(e) => setFilterText(e.currentTarget.value)} />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 text-sm text-text-subtle">
            <span>{selectedIds.size} selected</span>
            <Button variant="ghost" size="small" onClick={exportSelectedCsv}>
              Export CSV
            </Button>
            <Button variant="ghost" size="small" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input type="checkbox" checked={allPageSelected} onChange={toggleAll} aria-label="Select all employees" className="cursor-pointer" />
            </TableHead>
            <SortableHead active={sortKey === 'name'} order={sortKey === 'name' ? sortOrder : null} onClick={() => toggleSort('name')}>
              Name
            </SortableHead>
            <SortableHead active={sortKey === 'code'} order={sortKey === 'code' ? sortOrder : null} onClick={() => toggleSort('code')}>
              Employee ID
            </SortableHead>
            <SortableHead active={sortKey === 'designation'} order={sortKey === 'designation' ? sortOrder : null} onClick={() => toggleSort('designation')}>
              Designation
            </SortableHead>
            <SortableHead active={sortKey === 'department'} order={sortKey === 'department' ? sortOrder : null} onClick={() => toggleSort('department')}>
              Department
            </SortableHead>
            <SortableHead active={sortKey === 'status'} order={sortKey === 'status' ? sortOrder : null} onClick={() => toggleSort('status')}>
              Status
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-text-subtlest">
                Loading…
              </TableCell>
            </TableRow>
          ) : pagedEmployees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-text-subtlest">
                No employees yet — add your first one to get started.
              </TableCell>
            </TableRow>
          ) : (
            pagedEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.id)}
                    onChange={() => toggleOne(emp.id)}
                    aria-label={`Select ${emp.legal_name}`}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell>
                  <NameCell employee={emp} />
                </TableCell>
                <TableCell>{emp.employee_code}</TableCell>
                <TableCell>{emp.employment_assignments[0]?.designations?.title ?? '—'}</TableCell>
                <TableCell>{emp.employment_assignments[0]?.departments?.name ?? '—'}</TableCell>
                <TableCell>
                  <StatusCell employee={emp} canEdit={role === 'admin'} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-end gap-3 text-sm text-text-subtle">
          <Button variant="ghost" size="small" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pageCount}
          </span>
          <Button variant="ghost" size="small" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
