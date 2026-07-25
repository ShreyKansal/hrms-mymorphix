import { useEffect, useState, type FormEvent } from 'react';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore } from './store';
import type { EmploymentAssignment } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../../components/ui/dialog';

const REASON_CODES = ['Promotion', 'Transfer', 'ManagerChange', 'Correction'];

// docs/hrms-prd/modules/01-core-hr-employee-information.md §7.2 — a transfer never edits the
// current assignment row in place, it closes it out and inserts a new one. That's entirely the
// transfer_employee() RPC's job; this dialog is just the form in front of it. Fields default to
// the current assignment's values — a transfer is usually a change to ONE thing, not a
// from-scratch re-entry of everything.
//
// Stays a Dialog (not a Sheet/full page) — re-assessed against the same researched criteria
// used for Create Employee (docs/build/03-ui-patterns.md §2) and genuinely earns it: one
// category of fields (all "this employee's next assignment"), defaults-driven, brief.
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
  // Can't be your own manager — the only self-reference rule worth enforcing client-side;
  // reporting-chain cycles further up are a Module 2 org-chart concern, not this form's job.
  const managerOptions = employees.filter((e) => e.id !== employeeId);

  useEffect(() => {
    fetchAll();
    // Refetched here too, not just relied on from the directory: this modal can open from
    // the Employee Detail page, which doesn't otherwise populate this store.
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
        </DialogHeader>
        {/* Submit button lives in DialogFooter, outside this <form> — the `form` attribute on
            that button associates it back to this form by id, the standard pattern for a
            footer that isn't nested inside the form element itself. */}
        <form id="transfer-employee-form" onSubmit={handleSubmit}>
          <DialogBody>
            {error && <p className="mb-3 text-sm text-text-danger">{error}</p>}
            <div className="space-y-3">
              <div>
                <Label htmlFor="effectiveFrom" required>
                  Effective from
                </Label>
                <Input id="effectiveFrom" name="effectiveFrom" type="date" required autoFocus />
              </div>
              <div>
                <Label htmlFor="reasonCode" required>
                  Reason
                </Label>
                <Select id="reasonCode" name="reasonCode" required defaultValue={REASON_CODES[0]}>
                  {REASON_CODES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="departmentId">Department</Label>
                <Select id="departmentId" name="departmentId" defaultValue={current?.department_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="designationId">Designation</Label>
                <Select id="designationId" name="designationId" defaultValue={current?.designation_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="gradeId">Grade</Label>
                <Select id="gradeId" name="gradeId" defaultValue={current?.grade_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="employmentType">Employment type</Label>
                <Input id="employmentType" name="employmentType" defaultValue={current?.employment_type ?? ''} />
              </div>
              <div>
                <Label htmlFor="managerId">Reports to</Label>
                <Select id="managerId" name="managerId" defaultValue={current?.manager_id ?? ''}>
                  <option value="">— unchanged —</option>
                  {managerOptions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.legal_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
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
