import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import { supabase } from '../lib/supabase';
import type { Employee, EmploymentAssignment } from '../lib/database.types';

// Simplified version of docs/build/build-guides/01-core-hr-employee-information.md screen #2.
// Full tabs (Profile/Compensation/Documents/Assets) land as those modules get built — this
// proves the Employment History timeline, the part that actually matters for validating the
// effective-dating pattern end-to-end. A direct supabase.from() query here (not the Zustand
// store) is deliberate: this is a one-off detail fetch, not shared list state.
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<EmploymentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: emp }, { data: history }] = await Promise.all([
        supabase.from('employees').select('*').eq('id', id).single(),
        supabase
          .from('employment_assignments')
          .select('*, departments(*), designations(*)')
          .eq('employee_id', id)
          .order('effective_from', { ascending: false }),
      ]);
      setEmployee(emp);
      setAssignments(history ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!employee) return <p style={{ padding: 24 }}>Not found.</p>;

  return (
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <Link to="/employees">&larr; Back to directory</Link>
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <Heading size="xlarge">{employee.legal_name}</Heading>
        <p>
          {employee.employee_code} · <Lozenge appearance="success">{employee.status}</Lozenge>
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
          {assignments.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #DCDFE4' }}>
              <td style={{ padding: 8 }}>{a.reason_code}</td>
              <td style={{ padding: 8 }}>{a.departments?.name ?? '—'}</td>
              <td style={{ padding: 8 }}>{a.designations?.title ?? '—'}</td>
              <td style={{ padding: 8 }}>{new Date(a.effective_from).toLocaleDateString()}</td>
              <td style={{ padding: 8 }}>
                {a.effective_to ? new Date(a.effective_to).toLocaleDateString() : <Lozenge>current</Lozenge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
