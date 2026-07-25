import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmploymentAssignment } from '../../lib/database.types';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { cn } from '../../lib/ui/cn';
import TransferEmployeeModal from './TransferEmployeeModal';

const labelClass = 'text-xs font-semibold text-text-subtle';
const valueClass = 'mt-0.5 text-foreground';

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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Current assignment</h3>
        {role === 'admin' && <Button onClick={() => setTransferOpen(true)}>Transfer</Button>}
      </div>
      {current ? (
        <div className="mb-6 mt-2 grid grid-cols-2 gap-x-6">
          <p className={labelClass}>Department</p>
          <p className={labelClass}>Designation</p>
          <p className={valueClass}>{current.departments?.name ?? '—'}</p>
          <p className={valueClass}>{current.designations?.title ?? '—'}</p>
          <p className={cn(labelClass, 'mt-3')}>Grade</p>
          <p className={cn(labelClass, 'mt-3')}>Reports to</p>
          <p className={valueClass}>{current.grades?.name ?? '—'}</p>
          <p className={valueClass}>
            {current.manager ? (
              <Link to={`/employees/${current.manager.id}`} className="text-selected hover:underline">
                {current.manager.legal_name}
              </Link>
            ) : (
              '—'
            )}
          </p>
          <p className={cn(labelClass, 'mt-3')}>Employment type</p>
          <p className={cn(labelClass, 'mt-3')}>Since</p>
          <p className={valueClass}>{current.employment_type}</p>
          <p className={valueClass}>{new Date(current.effective_from).toLocaleDateString()}</p>
        </div>
      ) : (
        <p className="mt-2 text-text-subtle">No current assignment.</p>
      )}

      <h3 className="text-sm font-semibold text-foreground">History</h3>
      <p className="my-2 text-text-subtle">
        Every row below is a separate, permanent record — nothing here was ever overwritten. The row with no end date is the current one.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reason</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Effective from</TableHead>
            <TableHead>Effective to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.reason_code}</TableCell>
              <TableCell>{a.departments?.name ?? '—'}</TableCell>
              <TableCell>{a.designations?.title ?? '—'}</TableCell>
              <TableCell>{new Date(a.effective_from).toLocaleDateString()}</TableCell>
              <TableCell>{a.effective_to ? new Date(a.effective_to).toLocaleDateString() : <Badge>current</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
