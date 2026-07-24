import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import DynamicTable from '@atlaskit/dynamic-table';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useEmployeesStore } from './store';
import CreateEmployeeModal from './CreateEmployeeModal';

// docs/build/build-guides/01-core-hr-employee-information.md screen #1 —
// "keep row actions minimal ... click a row -> Employee Detail page."
// Now backed by Zustand + Supabase Realtime instead of TanStack Query + REST polling —
// the list updates live on any insert/update to this tenant's employees, from any tab.
export default function EmployeeDirectory() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { employees, loading, error, fetchEmployees, subscribeToChanges, unsubscribe } = useEmployeesStore();

  useEffect(() => {
    fetchEmployees();
    subscribeToChanges();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const head = {
    cells: [
      { key: 'name', content: 'Name' },
      { key: 'code', content: 'Employee ID' },
      { key: 'designation', content: 'Designation' },
      { key: 'department', content: 'Department' },
      { key: 'status', content: 'Status' },
    ],
  };

  const rows = employees.map((emp) => {
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/organisation">Departments / designations / grades</Link>
          <Link to="/org-chart">Org chart</Link>
          <Button appearance="primary" onClick={() => setCreateOpen(true)}>
            Add employee
          </Button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>Could not load employees: {error}</p>}

      {chartData.length > 0 && (
        <div style={{ height: 120, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" allowDecimals={false} hide />
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
      />

      {isCreateOpen && <CreateEmployeeModal onClose={() => setCreateOpen(false)} onCreated={() => setCreateOpen(false)} />}
    </div>
  );
}
