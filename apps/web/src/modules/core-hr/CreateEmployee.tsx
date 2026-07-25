import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '../../lib/Stepper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Department, Designation, Grade } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/table';

// Rebuilds Create Employee from a 7-field Modal into a full page + stepper — the "known
// violation" flagged in docs/build/03-ui-patterns.md §2. Researched thresholds it now actually
// meets: NN/g's wizard criteria (>6-7 fields, fields split into distinct categories, infrequent
// task) and Smashing Magazine's "never a Modal for a complex, lengthy multi-step task" rule.
// Documents deliberately isn't a step: uploading needs a real employee_id (the storage path is
// tenant/employee-scoped), and DocumentsTab.tsx already does this well on the page this wizard
// lands on.

interface WizardEducationRow {
  tempId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

interface WizardPreviousEmploymentRow {
  tempId: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
}

interface WizardData {
  legalName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  personalEmail: string;
  personalPhone: string;
  joiningDate: string;
  employmentType: string;
  departmentId: string;
  designationId: string;
  gradeId: string;
  managerId: string;
  education: WizardEducationRow[];
  previousEmployment: WizardPreviousEmploymentRow[];
}

const EMPTY_WIZARD_DATA: WizardData = {
  legalName: '',
  dateOfBirth: '',
  gender: '',
  panNumber: '',
  personalEmail: '',
  personalPhone: '',
  joiningDate: '',
  employmentType: 'Permanent',
  departmentId: '',
  designationId: '',
  gradeId: '',
  managerId: '',
  education: [],
  previousEmployment: [],
};

const STEPS = [
  { label: 'Personal & contact' },
  { label: 'Work information' },
  { label: 'Education' },
  { label: 'Previous employment' },
  { label: 'Review & create' },
];

function val(fd: FormData, k: string) {
  return String(fd.get(k) ?? '');
}

// A single-column form where every field stretches to the full 864px page width reads as
// unfinished, not spacious — real SaaS forms (Attio, Linear) cap field width and pair short
// fields side by side. 2 columns capped at 640px keeps each field a sane ~300px.
const formGridClass = 'grid max-w-[640px] grid-cols-2 gap-x-6 gap-y-3';

function PersonalContactStep({ data, onNext, onCancel }: { data: WizardData; onNext: (partial: Partial<WizardData>) => void; onCancel: () => void }) {
  return (
    <div>
      <p className="mb-6 mt-1 text-sm text-text-subtle">Who this person is, and how to reach them outside work.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          onNext({
            legalName: val(fd, 'legalName'),
            dateOfBirth: val(fd, 'dateOfBirth'),
            gender: val(fd, 'gender'),
            panNumber: val(fd, 'panNumber'),
            personalEmail: val(fd, 'personalEmail'),
            personalPhone: val(fd, 'personalPhone'),
          });
        }}
      >
        <h3 className="text-sm font-semibold text-foreground">Personal</h3>
        <div className={`${formGridClass} mt-2`}>
          <div className="col-span-2">
            <Label htmlFor="legalName" required>
              Full legal name
            </Label>
            <Input id="legalName" name="legalName" required autoFocus defaultValue={data.legalName} />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={data.dateOfBirth} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Input id="gender" name="gender" defaultValue={data.gender} />
          </div>
          <div>
            <Label htmlFor="panNumber">PAN</Label>
            <Input id="panNumber" name="panNumber" defaultValue={data.panNumber} />
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-foreground">Contact</h3>
        <div className={`${formGridClass} mt-2`}>
          <div>
            <Label htmlFor="personalEmail">Personal email</Label>
            <Input id="personalEmail" name="personalEmail" type="email" defaultValue={data.personalEmail} />
          </div>
          <div>
            <Label htmlFor="personalPhone">Personal phone</Label>
            <Input id="personalPhone" name="personalPhone" defaultValue={data.personalPhone} />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button type="submit" variant="primary">
            Next: Work information
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function WorkInformationStep({
  data,
  employees,
  departments,
  designations,
  grades,
  onNext,
  onBack,
}: {
  data: WizardData;
  employees: EmployeeWithCurrentAssignment[];
  departments: Department[];
  designations: Designation[];
  grades: Grade[];
  onNext: (partial: Partial<WizardData>) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <p className="mb-6 mt-1 text-sm text-text-subtle">Where this person sits in the org, and when they start.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          onNext({
            joiningDate: val(fd, 'joiningDate'),
            employmentType: val(fd, 'employmentType'),
            departmentId: val(fd, 'departmentId'),
            designationId: val(fd, 'designationId'),
            gradeId: val(fd, 'gradeId'),
            managerId: val(fd, 'managerId'),
          });
        }}
      >
        <div className={formGridClass}>
          <div>
            <Label htmlFor="joiningDate" required>
              Joining date
            </Label>
            <Input id="joiningDate" name="joiningDate" type="date" required autoFocus defaultValue={data.joiningDate} />
          </div>
          <div>
            <Label htmlFor="employmentType" required>
              Employment type
            </Label>
            <Input id="employmentType" name="employmentType" required defaultValue={data.employmentType} />
          </div>
          <div>
            <Label htmlFor="departmentId">Department</Label>
            <Select id="departmentId" name="departmentId" defaultValue={data.departmentId}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="designationId">Designation</Label>
            <Select id="designationId" name="designationId" defaultValue={data.designationId}>
              <option value="">—</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="gradeId">Grade</Label>
            <Select id="gradeId" name="gradeId" defaultValue={data.gradeId}>
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} — {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="managerId">Reports to</Label>
            <Select id="managerId" name="managerId" defaultValue={data.managerId}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.legal_name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Previous
          </Button>
          <Button type="submit" variant="primary">
            Next: Education
          </Button>
        </div>
      </form>
    </div>
  );
}

function EducationStep({
  data,
  onNext,
  onBack,
}: {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  onBack: (partial: Partial<WizardData>) => void;
}) {
  const [rows, setRows] = useState<WizardEducationRow[]>(data.education);

  return (
    <div>
      <p className="mb-4 mt-1 text-sm text-text-subtle">Optional — add any degrees on record. Skip if there's nothing to add yet.</p>
      <Table>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell>No education records added yet.</TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.tempId}>
              <TableCell>{r.degree}</TableCell>
              <TableCell>{r.fieldOfStudy || '—'}</TableCell>
              <TableCell>{r.institution}</TableCell>
              <TableCell>
                {r.startYear || '—'}–{r.endYear || '—'}
              </TableCell>
              <TableCell>
                <Button variant="link" size="small" onClick={() => setRows((prev) => prev.filter((x) => x.tempId !== r.tempId))}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          setRows((prev) => [
            ...prev,
            {
              tempId: crypto.randomUUID(),
              degree: val(fd, 'degree'),
              fieldOfStudy: val(fd, 'fieldOfStudy'),
              institution: val(fd, 'institution'),
              startYear: val(fd, 'startYear'),
              endYear: val(fd, 'endYear'),
            },
          ]);
          form.reset();
        }}
      >
        <div>
          <Label htmlFor="degree" required>
            Degree
          </Label>
          <Input id="degree" name="degree" required className="w-32" />
        </div>
        <div>
          <Label htmlFor="fieldOfStudy">Field of study</Label>
          <Input id="fieldOfStudy" name="fieldOfStudy" className="w-40" />
        </div>
        <div>
          <Label htmlFor="institution" required>
            Institution
          </Label>
          <Input id="institution" name="institution" required className="w-40" />
        </div>
        <div>
          <Label htmlFor="startYear">Start year</Label>
          <Input id="startYear" name="startYear" type="number" className="w-24" />
        </div>
        <div>
          <Label htmlFor="endYear">End year</Label>
          <Input id="endYear" name="endYear" type="number" className="w-24" />
        </div>
        <Button type="submit">Add</Button>
      </form>
      <div className="mt-6 flex gap-2">
        <Button type="button" variant="ghost" onClick={() => onBack({ education: rows })}>
          Previous
        </Button>
        <Button type="button" variant="primary" onClick={() => onNext({ education: rows })}>
          Next: Previous employment
        </Button>
      </div>
    </div>
  );
}

function PreviousEmploymentStep({
  data,
  onNext,
  onBack,
}: {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  onBack: (partial: Partial<WizardData>) => void;
}) {
  const [rows, setRows] = useState<WizardPreviousEmploymentRow[]>(data.previousEmployment);

  return (
    <div>
      <p className="mb-4 mt-1 text-sm text-text-subtle">Optional — add prior employers. Skip if this is a fresher hire.</p>
      <Table>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell>No previous employment added yet.</TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.tempId}>
              <TableCell>{r.companyName}</TableCell>
              <TableCell>{r.designation || '—'}</TableCell>
              <TableCell>
                {r.startDate || '—'} – {r.endDate || '—'}
              </TableCell>
              <TableCell>
                <Button variant="link" size="small" onClick={() => setRows((prev) => prev.filter((x) => x.tempId !== r.tempId))}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          setRows((prev) => [
            ...prev,
            {
              tempId: crypto.randomUUID(),
              companyName: val(fd, 'companyName'),
              designation: val(fd, 'designation'),
              startDate: val(fd, 'startDate'),
              endDate: val(fd, 'endDate'),
            },
          ]);
          form.reset();
        }}
      >
        <div>
          <Label htmlFor="companyName" required>
            Company
          </Label>
          <Input id="companyName" name="companyName" required className="w-36" />
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" name="designation" className="w-36" />
        </div>
        <div>
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
        <Button type="submit">Add</Button>
      </form>
      <div className="mt-6 flex gap-2">
        <Button type="button" variant="ghost" onClick={() => onBack({ previousEmployment: rows })}>
          Previous
        </Button>
        <Button type="button" variant="primary" onClick={() => onNext({ previousEmployment: rows })}>
          Next: Review
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  data,
  departments,
  designations,
  grades,
  employees,
  error,
  submitting,
  onBack,
  onSubmit,
}: {
  data: WizardData;
  departments: Department[];
  designations: Designation[];
  grades: Grade[];
  employees: EmployeeWithCurrentAssignment[];
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const departmentName = departments.find((d) => d.id === data.departmentId)?.name ?? '—';
  const designationTitle = designations.find((d) => d.id === data.designationId)?.title ?? '—';
  const gradeName = grades.find((g) => g.id === data.gradeId);
  const managerName = employees.find((e) => e.id === data.managerId)?.legal_name ?? '—';
  const labelClass = 'mt-3 text-xs font-semibold text-text-subtle';
  const valueClass = 'mt-0.5 text-foreground';

  return (
    <div>
      <p className="mb-4 mt-1 text-sm text-text-subtle">Check everything below, then create the employee record.</p>
      {error && <p className="mb-3 text-sm text-text-danger">{error}</p>}

      <h3 className="text-sm font-semibold text-foreground">Personal</h3>
      <p className={labelClass}>Legal name</p>
      <p className={valueClass}>{data.legalName || '—'}</p>
      <p className={labelClass}>Date of birth</p>
      <p className={valueClass}>{data.dateOfBirth || '—'}</p>
      <p className={labelClass}>Gender</p>
      <p className={valueClass}>{data.gender || '—'}</p>
      <p className={labelClass}>PAN</p>
      <p className={valueClass}>{data.panNumber || '—'}</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Contact</h3>
        <p className={labelClass}>Personal email</p>
        <p className={valueClass}>{data.personalEmail || '—'}</p>
        <p className={labelClass}>Personal phone</p>
        <p className={valueClass}>{data.personalPhone || '—'}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Work information</h3>
        <p className={labelClass}>Joining date</p>
        <p className={valueClass}>{data.joiningDate || '—'}</p>
        <p className={labelClass}>Employment type</p>
        <p className={valueClass}>{data.employmentType || '—'}</p>
        <p className={labelClass}>Department</p>
        <p className={valueClass}>{departmentName}</p>
        <p className={labelClass}>Designation</p>
        <p className={valueClass}>{designationTitle}</p>
        <p className={labelClass}>Grade</p>
        <p className={valueClass}>{gradeName ? `${gradeName.code} — ${gradeName.name}` : '—'}</p>
        <p className={labelClass}>Reports to</p>
        <p className={valueClass}>{managerName}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Education</h3>
        <Table>
          <TableBody>
            {data.education.length === 0 && (
              <TableRow>
                <TableCell>None added.</TableCell>
              </TableRow>
            )}
            {data.education.map((r) => (
              <TableRow key={r.tempId}>
                <TableCell>{r.degree}</TableCell>
                <TableCell>{r.institution}</TableCell>
                <TableCell>
                  {r.startYear || '—'}–{r.endYear || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Previous employment</h3>
        <Table>
          <TableBody>
            {data.previousEmployment.length === 0 && (
              <TableRow>
                <TableCell>None added.</TableCell>
              </TableRow>
            )}
            {data.previousEmployment.map((r) => (
              <TableRow key={r.tempId}>
                <TableCell>{r.companyName}</TableCell>
                <TableCell>{r.designation || '—'}</TableCell>
                <TableCell>
                  {r.startDate || '—'} – {r.endDate || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Previous
        </Button>
        <Button variant="primary" onClick={onSubmit} loading={submitting}>
          Create employee
        </Button>
      </div>
    </div>
  );
}

export default function CreateEmployee() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const legalEntityId = useAuthStore((s) => s.legalEntityId);
  const tenantId = useAuthStore((s) => s.tenantId);
  const { employees, createEmployee } = useEmployeesStore();
  const { departments, designations, grades, fetchAll } = useOrgManagementStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UX-only guard (mirrors the hidden "Add employee" nav entry point) — the actual gate is
  // still create_employee()'s own admin check.
  useEffect(() => {
    if (role && role !== 'admin') navigate('/employees', { replace: true });
  }, [role, navigate]);

  const goNext = (partial: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...partial }));
    setStepIndex((i) => i + 1);
  };
  const goBack = (partial?: Partial<WizardData>) => {
    if (partial) setWizardData((prev) => ({ ...prev, ...partial }));
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleCreate = async () => {
    if (!legalEntityId || !tenantId) {
      setSubmitError('No workspace context for this account — run setup again.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const { error, employee } = await createEmployee({
      legalEntityId,
      legalName: wizardData.legalName,
      joiningDate: wizardData.joiningDate,
      personalEmail: wizardData.personalEmail || undefined,
      departmentId: wizardData.departmentId || undefined,
      designationId: wizardData.designationId || undefined,
      gradeId: wizardData.gradeId || undefined,
      managerId: wizardData.managerId || undefined,
      dateOfBirth: wizardData.dateOfBirth || undefined,
      gender: wizardData.gender || undefined,
      panNumber: wizardData.panNumber || undefined,
      personalPhone: wizardData.personalPhone || undefined,
    });

    if (error || !employee) {
      setSubmitError(error ?? 'Could not create the employee record.');
      setSubmitting(false);
      return;
    }

    if (wizardData.education.length > 0) {
      await supabase.from('employee_education').insert(
        wizardData.education.map((r) => ({
          tenant_id: tenantId,
          employee_id: employee.id,
          institution: r.institution,
          degree: r.degree,
          field_of_study: r.fieldOfStudy || null,
          start_year: r.startYear ? Number(r.startYear) : null,
          end_year: r.endYear ? Number(r.endYear) : null,
        })),
      );
    }
    if (wizardData.previousEmployment.length > 0) {
      await supabase.from('employee_previous_employment').insert(
        wizardData.previousEmployment.map((r) => ({
          tenant_id: tenantId,
          employee_id: employee.id,
          company_name: r.companyName,
          designation: r.designation || null,
          start_date: r.startDate || null,
          end_date: r.endDate || null,
        })),
      );
    }

    navigate(`/employees/${employee.id}`);
  };

  if (role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-[864px] p-6">
      <h1 className="text-2xl font-medium text-foreground">Add employee</h1>
      <div className="mt-6">
        <Stepper steps={STEPS} currentIndex={stepIndex} />
      </div>

      {stepIndex === 0 && <PersonalContactStep data={wizardData} onNext={goNext} onCancel={() => navigate('/employees')} />}
      {stepIndex === 1 && (
        <WorkInformationStep
          data={wizardData}
          employees={employees}
          departments={departments}
          designations={designations}
          grades={grades}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {stepIndex === 2 && <EducationStep data={wizardData} onNext={goNext} onBack={goBack} />}
      {stepIndex === 3 && <PreviousEmploymentStep data={wizardData} onNext={goNext} onBack={goBack} />}
      {stepIndex === 4 && (
        <ReviewStep
          data={wizardData}
          departments={departments}
          designations={designations}
          grades={grades}
          employees={employees}
          error={submitError}
          submitting={submitting}
          onBack={goBack}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
