import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import DynamicTable from '@atlaskit/dynamic-table';
import Heading from '@atlaskit/heading';
import TextField from '@atlaskit/textfield';
import { token } from '@atlaskit/tokens';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import { avatarColor, initials } from '../../lib/avatar';
import { useAuthStore } from '../auth/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Employee } from '../../lib/database.types';

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
  draft: '#8590A2',
  active: '#22A06B',
  on_leave: '#E56910',
  suspended: '#E2483D',
  separation_initiated: '#E2483D',
  separated: '#6B778C',
};

// Inline-editable status (colored dot + text, click to change) rather than a static read-only
// badge — the Qubit reference this table is benchmarked against treats status as something you
// act on from the list, not just read. Admin-gated the same way every other write action in
// this app is (UX only — the real gate would be RLS/an RPC role check if this needs one later;
// today `employees` writes are tenant-scoped only, same as ProfileTab's existing edit path,
// not a new gap this feature introduces).
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
          // Don't wait on Realtime to refresh the row — it will eventually, but a status change
          // the user just made should be reflected the instant it's saved, not whenever the
          // subscription round-trip happens to land. Realtime still handles updates from other
          // tabs/users; this just removes the wait for *this* one.
          await fetchEmployees();
          setSaving(false);
          setEditing(false);
        }}
        style={{ fontSize: 13, height: 28, borderRadius: 4, border: `1px solid ${token('color.border.focused', '#388BFF')}` }}
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: canEdit ? 'pointer' : 'default',
        font: 'inherit',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_DOT_COLOR[employee.status], flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: token('color.text', '#172B4D'), textTransform: 'capitalize' }}>{employee.status.replace('_', ' ')}</span>
    </button>
  );
}

function NameCell({ employee }: { employee: EmployeeWithCurrentAssignment }) {
  return (
    <Link to={`/employees/${employee.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: avatarColor(employee.legal_name),
          color: token('color.text.inverse', '#FFFFFF'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
        }}
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

  // Clear out selections that scrolled out of the filtered/sorted view — keeping them would let
  // "Export CSV" silently include rows the user can no longer see, which is worse than just
  // dropping them from the selection.
  useEffect(() => {
    const visibleIds = new Set(visibleEmployees.map((e) => e.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEmployees]);

  const allVisibleSelected = visibleEmployees.length > 0 && visibleEmployees.every((e) => selectedIds.has(e.id));
  const toggleAll = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleEmployees.map((e) => e.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // The first genuinely real bulk action — a client-side CSV export needs no new backend
  // surface and no new write-permission questions, unlike e.g. bulk status change would.
  // Checkboxes with nothing real behind them would be decoration; this is why they exist here.
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

  // Column widths as a percentage of the table's own width, not left to DynamicTable's default
  // even-split — an even split is what stretched every column to the same width regardless of
  // content (Name and Status ending up equally wide), which read as sparse/unfinished rather
  // than deliberate. Real real-browser measurement (see docs/build/03-ui-patterns.md) is what
  // caught this, not a guess.
  const head = {
    cells: [
      {
        key: 'select',
        content: (
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all employees" style={{ cursor: 'pointer' }} />
        ),
        width: 4,
      },
      { key: 'name', content: 'Name', width: 24, isSortable: true },
      { key: 'code', content: 'Employee ID', width: 20, isSortable: true },
      { key: 'designation', content: 'Designation', width: 17, isSortable: true },
      { key: 'department', content: 'Department', width: 17, isSortable: true },
      { key: 'status', content: 'Status', width: 18, isSortable: true },
    ],
  };

  const rows = visibleEmployees.map((emp) => ({
    key: emp.id,
    cells: [
      {
        key: 'select',
        content: (
          <input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleOne(emp.id)} aria-label={`Select ${emp.legal_name}`} style={{ cursor: 'pointer' }} />
        ),
      },
      { key: 'name', content: <NameCell employee={emp} /> },
      { key: 'code', content: emp.employee_code },
      { key: 'designation', content: emp.employment_assignments[0]?.designations?.title ?? '—' },
      { key: 'department', content: emp.employment_assignments[0]?.departments?.name ?? '—' },
      { key: 'status', content: <StatusCell employee={emp} canEdit={role === 'admin'} /> },
    ],
  }));

  // A genuine, if simple, use of Recharts — headcount by status. Real value once there are
  // enough employees and statuses for the breakdown to say something; wired up now so the
  // pattern exists for Module 19's real dashboards to build on, not left as an unused
  // dependency.
  const statusCounts = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return (
    <div style={{ maxWidth: 1296, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Heading size="large">Employee Directory</Heading>
        {role === 'admin' && (
          <Link to="/employees/new">
            <Button appearance="primary">Add employee</Button>
          </Link>
        )}
      </div>

      {error && <p style={{ color: 'red' }}>Could not load employees: {error}</p>}

      {chartData.length > 0 && (
        <div style={{ height: 120, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              {/* Explicit domain, not Recharts' default auto-padded one — with few status
                  buckets (often just one, "active", early on) the default rounds the axis max
                  up to a "nice" number well past the real data max, so even a 100%-active
                  breakdown renders as a short, inexplicable-looking bar instead of a full one. */}
              <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax']} hide />
              <YAxis type="category" dataKey="status" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#0C66E4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 16 }}>
        <div style={{ width: 280 }}>
          <TextField
            placeholder="Filter this list…"
            value={filterText}
            onChange={(e) => setFilterText(e.currentTarget.value)}
            isCompact
          />
        </div>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: token('color.text.subtle', '#44546F') }}>
            <span>{selectedIds.size} selected</span>
            <Button appearance="subtle" spacing="compact" onClick={exportSelectedCsv}>
              Export CSV
            </Button>
            <Button appearance="subtle" spacing="compact" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <DynamicTable
        head={head}
        rows={rows}
        isLoading={loading}
        emptyView={<h4>No employees yet — add your first one to get started.</h4>}
        rowsPerPage={20}
        defaultPage={1}
        sortKey={sortKey ?? undefined}
        sortOrder={sortOrder}
        onSort={({ key, sortOrder: order }) => {
          setSortKey(key as SortKey);
          setSortOrder(order);
        }}
      />
    </div>
  );
}
