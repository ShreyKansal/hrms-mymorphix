import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import type { EmploymentAssignment } from '../../lib/database.types';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { InfoField } from '../../components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import TransferEmployeeModal from './TransferEmployeeModal';

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Current assignment</CardTitle>
          {role === 'admin' && (
            <Button variant="default" size="small" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transfer
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {current ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              <InfoField label="Department">{current.departments?.name ?? '—'}</InfoField>
              <InfoField label="Designation">{current.designations?.title ?? '—'}</InfoField>
              <InfoField label="Grade">{current.grades?.name ?? '—'}</InfoField>
              <InfoField label="Reports to">
                {current.manager ? (
                  <Link to={`/employees/${current.manager.id}`} className="text-brand-link hover:underline">
                    {current.manager.legal_name}
                  </Link>
                ) : (
                  '—'
                )}
              </InfoField>
              <InfoField label="Employment type">{current.employment_type}</InfoField>
              <InfoField label="Since">{new Date(current.effective_from).toLocaleDateString()}</InfoField>
            </dl>
          ) : (
            <p className="text-sm text-foreground-lighter">No current assignment.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3">
          <h2 className="text-sm font-medium text-foreground">Assignment history</h2>
          <p className="mt-0.5 text-sm text-foreground-lighter">
            Every row is a separate, permanent record — nothing here is ever overwritten. The row with no end date is current.
          </p>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Reason</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Effective to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-foreground-lighter">
                    No assignment history yet.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-foreground">{a.reason_code}</TableCell>
                    <TableCell>{a.departments?.name ?? '—'}</TableCell>
                    <TableCell>{a.designations?.title ?? '—'}</TableCell>
                    <TableCell className="tabular-nums">{new Date(a.effective_from).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {a.effective_to ? (
                        <span className="tabular-nums">{new Date(a.effective_to).toLocaleDateString()}</span>
                      ) : (
                        <Badge variant="success">Current</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

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
