import { useState } from 'react';
import { Link } from 'react-router-dom';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import Button from '@atlaskit/button/new';
import type { EmploymentAssignment } from '../../lib/database.types';
import { useAuthStore } from '../auth/store';
import TransferEmployeeModal from './TransferEmployeeModal';

const labelStyle = { color: '#626F86', fontSize: 12, fontWeight: 600, marginTop: 12 };
const valueStyle = { margin: '2px 0 0' };

export default function EmploymentTab({
  employeeId,
  assignments,
  onTransferred,
}: {
  employeeId: string;
  assignments: EmploymentAssignment[];
  onTransferred: () => void;
}) {
  const current = assignments.find((a) => a.effective_to === null);
  const [transferOpen, setTransferOpen] = useState(false);
  const role = useAuthStore((s) => s.role);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading size="small">Current assignment</Heading>
        {role === 'admin' && <Button onClick={() => setTransferOpen(true)}>Transfer</Button>}
      </div>
      {current ? (
        <div style={{ marginBottom: 24 }}>
          <p style={labelStyle}>Department</p>
          <p style={valueStyle}>{current.departments?.name ?? '—'}</p>
          <p style={labelStyle}>Designation</p>
          <p style={valueStyle}>{current.designations?.title ?? '—'}</p>
          <p style={labelStyle}>Grade</p>
          <p style={valueStyle}>{current.grades?.name ?? '—'}</p>
          <p style={labelStyle}>Reports to</p>
          <p style={valueStyle}>
            {current.manager ? <Link to={`/employees/${current.manager.id}`}>{current.manager.legal_name}</Link> : '—'}
          </p>
          <p style={labelStyle}>Employment type</p>
          <p style={valueStyle}>{current.employment_type}</p>
          <p style={labelStyle}>Since</p>
          <p style={valueStyle}>{new Date(current.effective_from).toLocaleDateString()}</p>
        </div>
      ) : (
        <p style={{ color: '#626F86' }}>No current assignment.</p>
      )}

      <Heading size="small">History</Heading>
      <p style={{ color: '#626F86', margin: '4px 0 16px' }}>
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

      {transferOpen && (
        <TransferEmployeeModal
          employeeId={employeeId}
          current={current}
          onClose={() => setTransferOpen(false)}
          onTransferred={() => {
            setTransferOpen(false);
            onTransferred();
          }}
        />
      )}
    </div>
  );
}
