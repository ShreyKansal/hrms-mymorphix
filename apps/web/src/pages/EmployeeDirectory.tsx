import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@atlaskit/button/new';
import DynamicTable from '@atlaskit/dynamic-table';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import { api } from '../api/client';
import type { Employee } from '../api/types';
import CreateEmployeeModal from './CreateEmployeeModal';

// docs/build/build-guides/01-core-hr-employee-information.md screen #1 —
// "keep row actions minimal ... click a row -> Employee Detail page."
export default function EmployeeDirectory() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/api/v1/employees'),
  });

  const head = {
    cells: [
      { key: 'name', content: 'Name' },
      { key: 'code', content: 'Employee ID' },
      { key: 'designation', content: 'Designation' },
      { key: 'department', content: 'Department' },
      { key: 'status', content: 'Status' },
    ],
  };

  const rows = (employees ?? []).map((emp) => {
    const current = emp.employmentAssignments[0];
    return {
      key: emp.id,
      cells: [
        {
          key: 'name',
          content: <Link to={`/employees/${emp.id}`}>{emp.legalName}</Link>,
        },
        { key: 'code', content: emp.employeeCode },
        { key: 'designation', content: current?.designation?.title ?? '—' },
        { key: 'department', content: current?.department?.name ?? '—' },
        {
          key: 'status',
          content: <Lozenge appearance={emp.status === 'ACTIVE' ? 'success' : 'default'}>{emp.status}</Lozenge>,
        },
      ],
    };
  });

  return (
    <div style={{ maxWidth: 1296, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Heading size="large">Employee Directory</Heading>
        <Button appearance="primary" onClick={() => setCreateOpen(true)}>
          Add employee
        </Button>
      </div>

      {error && <p style={{ color: 'red' }}>Could not load employees: {(error as Error).message}</p>}

      <DynamicTable
        head={head}
        rows={rows}
        isLoading={isLoading}
        emptyView={<h4>No employees yet — add your first one to get started.</h4>}
        rowsPerPage={20}
        defaultPage={1}
      />

      {isCreateOpen && (
        <CreateEmployeeModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }}
        />
      )}
    </div>
  );
}
