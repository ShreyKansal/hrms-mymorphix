import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import { api } from '../api/client';
import type { Employee } from '../api/types';

// Simplified version of docs/build/build-guides/01-core-hr-employee-information.md screen #2.
// Full tabs (Profile/Compensation/Documents/Assets) land as those modules get built —
// this proves the Employment History timeline, which is the part that actually matters
// for validating the effective-dating pattern end-to-end through the UI.
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get<Employee>(`/api/v1/employees/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!employee) return <p style={{ padding: 24 }}>Not found.</p>;

  return (
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <Link to="/employees">&larr; Back to directory</Link>
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <Heading size="xlarge">{employee.legalName}</Heading>
        <p>
          {employee.employeeCode} · <Lozenge appearance="success">{employee.status}</Lozenge>
        </p>
      </div>

      <Heading size="medium">Employment history</Heading>
      <p style={{ color: '#626F86', marginBottom: 16 }}>
        Every row below is a separate, permanent record — nothing here was ever overwritten. The
        row with no end date is the current one.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #DCDFE4' }}>
            <th style={{ padding: 8 }}>Reason</th>
            <th style={{ padding: 8 }}>Department</th>
            <th style={{ padding: 8 }}>Designation</th>
            <th style={{ padding: 8 }}>Effective from</th>
            <th style={{ padding: 8 }}>Effective to</th>
          </tr>
        </thead>
        <tbody>
          {employee.employmentAssignments.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #DCDFE4' }}>
              <td style={{ padding: 8 }}>{a.reasonCode}</td>
              <td style={{ padding: 8 }}>{a.department?.name ?? '—'}</td>
              <td style={{ padding: 8 }}>{a.designation?.title ?? '—'}</td>
              <td style={{ padding: 8 }}>{new Date(a.effectiveFrom).toLocaleDateString()}</td>
              <td style={{ padding: 8 }}>
                {a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : <Lozenge>current</Lozenge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
