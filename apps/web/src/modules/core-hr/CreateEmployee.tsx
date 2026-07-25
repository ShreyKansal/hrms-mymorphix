import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Stepper } from '../../lib/Stepper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Department, Designation, Grade } from '../../lib/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PageContainer, PageHeader, InfoField } from '../../components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

// Create Employee as a full page + stepper (not a modal): a multi-category, infrequent task that
// meets NN/g's wizard criteria. Documents deliberately isn't a step — uploading needs a real
// employee_id, and DocumentsTab handles it on the page this wizard lands on.

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

function StepShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-foreground-lighter">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function NavButtons({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex items-center justify-between gap-2">{children}</div>;
}

function PersonalContactStep({ data, onNext, onCancel }: { data: WizardData; onNext: (partial: Partial<WizardData>) => void; onCancel: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
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
      <StepShell title="Personal & contact" description="Who this person is, and how to reach them outside work.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full legal name" htmlFor="legalName" required className="sm:col-span-2">
            <Input id="legalName" name="legalName" required autoFocus defaultValue={data.legalName} placeholder="Priya Sharma" />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth">
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={data.dateOfBirth} />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <Input id="gender" name="gender" defaultValue={data.gender} />
          </Field>
          <Field label="PAN" htmlFor="panNumber">
            <Input id="panNumber" name="panNumber" defaultValue={data.panNumber} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Personal email" htmlFor="personalEmail">
            <Input id="personalEmail" name="personalEmail" type="email" defaultValue={data.personalEmail} placeholder="priya@example.com" />
          </Field>
          <Field label="Personal phone" htmlFor="personalPhone">
            <Input id="personalPhone" name="personalPhone" defaultValue={data.personalPhone} />
          </Field>
        </div>
      </StepShell>
      <NavButtons>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Continue
        </Button>
      </NavButtons>
    </form>
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
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
      <StepShell title="Work information" description="Where this person sits in the org, and when they start.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Joining date" htmlFor="joiningDate" required>
            <Input id="joiningDate" name="joiningDate" type="date" required autoFocus defaultValue={data.joiningDate} />
          </Field>
          <Field label="Employment type" htmlFor="employmentType" required>
            <Input id="employmentType" name="employmentType" required defaultValue={data.employmentType} />
          </Field>
          <Field label="Department" htmlFor="departmentId">
            <Select id="departmentId" name="departmentId" defaultValue={data.departmentId}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Designation" htmlFor="designationId">
            <Select id="designationId" name="designationId" defaultValue={data.designationId}>
              <option value="">—</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Grade" htmlFor="gradeId">
            <Select id="gradeId" name="gradeId" defaultValue={data.gradeId}>
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} — {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reports to" htmlFor="managerId">
            <Select id="managerId" name="managerId" defaultValue={data.managerId}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.legal_name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </StepShell>
      <NavButtons>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" variant="primary">
          Continue
        </Button>
      </NavButtons>
    </form>
  );
}

// Shared inline "add a row" table used by both the Education and Previous employment steps.
function RowTable({
  columns,
  rows,
  emptyLabel,
  onRemove,
  renderCells,
}: {
  columns: string[];
  rows: { tempId: string }[];
  emptyLabel: string;
  onRemove: (tempId: string) => void;
  renderCells: (row: { tempId: string }) => React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            <TableHead className="w-10 text-right">
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length + 1} className="text-foreground-lighter">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.tempId}>
                {renderCells(r)}
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(r.tempId)}
                    className="rounded p-1 text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-destructive"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
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
      <StepShell title="Education" description="Optional — add any degrees on record. Skip if there's nothing to add yet.">
        <RowTable
          columns={['Degree', 'Field of study', 'Institution', 'Years']}
          rows={rows}
          emptyLabel="No education records added yet."
          onRemove={(tempId) => setRows((prev) => prev.filter((x) => x.tempId !== tempId))}
          renderCells={(row) => {
            const r = row as WizardEducationRow;
            return (
              <>
                <TableCell className="font-medium text-foreground">{r.degree}</TableCell>
                <TableCell>{r.fieldOfStudy || '—'}</TableCell>
                <TableCell>{r.institution}</TableCell>
                <TableCell className="tabular-nums">
                  {r.startYear || '—'}–{r.endYear || '—'}
                </TableCell>
              </>
            );
          }}
        />
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
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
          <Field label="Degree" htmlFor="degree" required>
            <Input id="degree" name="degree" required className="w-32" />
          </Field>
          <Field label="Field of study" htmlFor="fieldOfStudy">
            <Input id="fieldOfStudy" name="fieldOfStudy" className="w-40" />
          </Field>
          <Field label="Institution" htmlFor="institution" required>
            <Input id="institution" name="institution" required className="w-40" />
          </Field>
          <Field label="Start year" htmlFor="startYear">
            <Input id="startYear" name="startYear" type="number" className="w-24" />
          </Field>
          <Field label="End year" htmlFor="endYear">
            <Input id="endYear" name="endYear" type="number" className="w-24" />
          </Field>
          <Button type="submit" variant="default">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </StepShell>
      <NavButtons>
        <Button type="button" variant="ghost" onClick={() => onBack({ education: rows })}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={() => onNext({ education: rows })}>
          Continue
        </Button>
      </NavButtons>
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
      <StepShell title="Previous employment" description="Optional — add prior employers. Skip if this is a fresher hire.">
        <RowTable
          columns={['Company', 'Designation', 'Period']}
          rows={rows}
          emptyLabel="No previous employment added yet."
          onRemove={(tempId) => setRows((prev) => prev.filter((x) => x.tempId !== tempId))}
          renderCells={(row) => {
            const r = row as WizardPreviousEmploymentRow;
            return (
              <>
                <TableCell className="font-medium text-foreground">{r.companyName}</TableCell>
                <TableCell>{r.designation || '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {r.startDate || '—'} – {r.endDate || '—'}
                </TableCell>
              </>
            );
          }}
        />
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
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
          <Field label="Company" htmlFor="companyName" required>
            <Input id="companyName" name="companyName" required className="w-36" />
          </Field>
          <Field label="Designation" htmlFor="designation">
            <Input id="designation" name="designation" className="w-36" />
          </Field>
          <Field label="Start date" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </Field>
          <Field label="End date" htmlFor="endDate">
            <Input id="endDate" name="endDate" type="date" />
          </Field>
          <Button type="submit" variant="default">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </StepShell>
      <NavButtons>
        <Button type="button" variant="ghost" onClick={() => onBack({ previousEmployment: rows })}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={() => onNext({ previousEmployment: rows })}>
          Continue
        </Button>
      </NavButtons>
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

  return (
    <div>
      {error && (
        <Alert variant="destructive" title="Couldn't create the employee" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal & contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
              <InfoField label="Legal name">{data.legalName || '—'}</InfoField>
              <InfoField label="Date of birth">{data.dateOfBirth || '—'}</InfoField>
              <InfoField label="Gender">{data.gender || '—'}</InfoField>
              <InfoField label="PAN">{data.panNumber || '—'}</InfoField>
              <InfoField label="Personal email">{data.personalEmail || '—'}</InfoField>
              <InfoField label="Personal phone">{data.personalPhone || '—'}</InfoField>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
              <InfoField label="Joining date">{data.joiningDate || '—'}</InfoField>
              <InfoField label="Employment type">{data.employmentType || '—'}</InfoField>
              <InfoField label="Department">{departmentName}</InfoField>
              <InfoField label="Designation">{designationTitle}</InfoField>
              <InfoField label="Grade">{gradeName ? `${gradeName.code} — ${gradeName.name}` : '—'}</InfoField>
              <InfoField label="Reports to">{managerName}</InfoField>
            </dl>
          </CardContent>
        </Card>

        {data.education.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Degree</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Years</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.education.map((r) => (
                  <TableRow key={r.tempId}>
                    <TableCell className="font-medium text-foreground">{r.degree}</TableCell>
                    <TableCell>{r.institution}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.startYear || '—'}–{r.endYear || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {data.previousEmployment.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Previous employment</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Company</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.previousEmployment.map((r) => (
                  <TableRow key={r.tempId}>
                    <TableCell className="font-medium text-foreground">{r.companyName}</TableCell>
                    <TableCell>{r.designation || '—'}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.startDate || '—'} – {r.endDate || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <NavButtons>
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button variant="primary" onClick={onSubmit} loading={submitting}>
          Create employee
        </Button>
      </NavButtons>
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

  // UX-only guard (mirrors the hidden nav entry point) — the real gate is create_employee()'s
  // own admin check.
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
      const { error: eduErr } = await supabase.from('employee_education').insert(
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
      if (eduErr) console.error('Failed to save education records:', eduErr.message);
    }
    if (wizardData.previousEmployment.length > 0) {
      const { error: prevErr } = await supabase.from('employee_previous_employment').insert(
        wizardData.previousEmployment.map((r) => ({
          tenant_id: tenantId,
          employee_id: employee.id,
          company_name: r.companyName,
          designation: r.designation || null,
          start_date: r.startDate || null,
          end_date: r.endDate || null,
        })),
      );
      if (prevErr) console.error('Failed to save previous employment records:', prevErr.message);
    }

    navigate(`/employees/${employee.id}`);
  };

  if (role !== 'admin') return null;

  return (
    <PageContainer>
      <PageHeader title="Add employee" description="Create a new employee record. It takes about a minute." />

      <div className="mb-8 rounded-lg border border-default bg-surface-100 px-5 py-4">
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
    </PageContainer>
  );
}
