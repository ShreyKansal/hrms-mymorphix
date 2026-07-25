import { useEffect, useState, type FormEvent } from 'react';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore } from './store';
import type { EmploymentAssignment } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../../components/ui/dialog';

const REASON_CODES = ['Promotion', 'Transfer', 'ManagerChange', 'Correction'];

// A transfer never edits the current assignment row in place — it closes it out and inserts a new
// one (the transfer_employee() RPC's job). Fields default to the current assignment's values,
// since a transfer is usually a change to ONE thing, not a from-scratch re-entry. Stays a Dialog:
// one category of fields, defaults-driven, brief.
export default function TransferEmployeeModal({
  employeeId,
  current,
  onClose,
  onTransferred,
}: {
  employeeId: string;
  current: EmploymentAssignment | undefined;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { employees, fetchEmployees, transferEmployee } = useEmployeesStore();
  const { departments, designations, grades, fetchAll } = useOrgManagementStore();
  const managerOptions = employees.filter((e) => e.id !== employeeId);

  useEffect(() => {
    fetchAll();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const val = (k: string) => String(fd.get(k) ?? '');
    const { error } = await transferEmployee({
      employeeId,
      effectiveFrom: val('effectiveFrom'),
      reasonCode: val('reasonCode'),
      departmentId: val('departmentId') || undefined,
      designationId: val('designationId') || undefined,
      gradeId: val('gradeId') || undefined,
      employmentType: val('employmentType') || undefined,
      managerId: val('managerId') || undefined,
    });
    setSubmitting(false);
    if (error) setError(error);
    else onTransferred();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer employee</DialogTitle>
          <DialogDescription>Close out the current assignment and start a new one. Leave a field on “unchanged” to keep it.</DialogDescription>
        </DialogHeader>
        {/* Submit button lives in DialogFooter, outside this <form> — the `form` attribute on
            that button associates it back by id. */}
        <form id="transfer-employee-form" onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Couldn't transfer">
                {error}
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Effective from" htmlFor="effectiveFrom" required>
                <Input id="effectiveFrom" name="effectiveFrom" type="date" required autoFocus />
              </Field>
              <Field label="Reason" htmlFor="reasonCode" required>
                <Select id="reasonCode" name="reasonCode" required defaultValue={REASON_CODES[0]}>
                  {REASON_CODES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department" htmlFor="departmentId">
                <Select id="departmentId" name="departmentId" defaultValue={current?.department_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Designation" htmlFor="designationId">
                <Select id="designationId" name="designationId" defaultValue={current?.designation_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Grade" htmlFor="gradeId">
                <Select id="gradeId" name="gradeId" defaultValue={current?.grade_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Employment type" htmlFor="employmentType">
                <Input id="employmentType" name="employmentType" defaultValue={current?.employment_type ?? ''} />
              </Field>
              <Field label="Reports to" htmlFor="managerId" className="sm:col-span-2">
                <Select id="managerId" name="managerId" defaultValue={current?.manager_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {managerOptions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.legal_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="transfer-employee-form" variant="primary" loading={submitting}>
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
