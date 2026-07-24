import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import DynamicTable from '@atlaskit/dynamic-table';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuthStore } from '../auth/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';

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

  useEffect(() => {
    fetchEmployees();
    subscribeToChanges();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Column widths as a percentage of the table's own width, not left to DynamicTable's default
  // even-split — an even split is what stretched every column to the same width regardless of
  // content (Name and Status ending up equally wide), which read as sparse/unfinished rather
  // than deliberate. Real real-browser measurement (see docs/build/03-ui-patterns.md) is what
  // caught this, not a guess.
  const head = {
    cells: [
      { key: 'name', content: 'Name', width: 28, isSortable: true },
      { key: 'code', content: 'Employee ID', width: 18, isSortable: true },
      { key: 'designation', content: 'Designation', width: 20, isSortable: true },
      { key: 'department', content: 'Department', width: 20, isSortable: true },
      { key: 'status', content: 'Status', width: 14, isSortable: true },
    ],
  };

  const sortedEmployees = useMemo(() => {
    if (!sortKey) return employees;
    const copy = [...employees];
    copy.sort((a, b) => {
      const cmp = sortValue(a, sortKey).localeCompare(sortValue(b, sortKey));
      return sortOrder === 'ASC' ? cmp : -cmp;
    });
    return copy;
  }, [employees, sortKey, sortOrder]);

  const rows = sortedEmployees.map((emp) => {
    const current = emp.employment_assignments[0];
    return {
      key: emp.id,
      cells: [
        { key: 'name', content: <Link to={`/employees/${emp.id}`}>{emp.legal_name}</Link> },
        { key: 'code', content: emp.employee_code },
        { key: 'designation', content: current?.designations?.title ?? '—' },
        { key: 'department', content: current?.departments?.name ?? '—' },
        {
          key: 'status',
          content: <Lozenge appearance={emp.status === 'active' ? 'success' : 'default'}>{emp.status}</Lozenge>,
        },
      ],
    };
  });

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
