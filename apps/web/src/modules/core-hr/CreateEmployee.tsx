import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Heading from '@atlaskit/heading';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { SelectField } from '../../lib/SelectField';
import { labelStyle, valueStyle, rowStyle, cellStyle } from '../../lib/detailStyles';
import { Stepper } from '../../lib/Stepper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from '../org-management/store';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import type { Department, Designation, Grade } from '../../lib/database.types';

// Rebuilds Create Employee from a 7-field Modal into a full page + stepper — the "known
// violation" flagged in docs/build/03-ui-patterns.md §2. Researched thresholds it now actually
// meets: NN/g's wizard criteria (>6-7 fields, fields split into distinct categories, infrequent
// task) and Smashing Magazine's "never a Modal for a complex, lengthy multi-step task" rule.
// Field groups match the PRD's own list (docs/hrms-prd/modules/01-core-hr-employee-information.md
// §9) for the groups that already have real backing tables — emergency contacts/dependants/
// nominees/assets/compensation/bank/tax still don't (see ProfileTab.tsx's own note on this),
// so they stay out here too rather than adding empty steps for data with nowhere to go.
// Documents deliberately isn't a step: uploading needs a real employee_id (the storage path is
// tenant/employee-scoped), and DocumentsTab.tsx already does this well on the page this wizard
// lands on — duplicating that logic here to run before the employee exists isn't worth it.

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

const stepDescriptionStyle = { color: '#44546F', fontSize: 14, marginTop: 4, marginBottom: 24 };
const actionsRowStyle = { marginTop: 24, display: 'flex', gap: 8 };

interface PersonalContactFormData {
  legalName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  personalEmail: string;
  personalPhone: string;
}

function PersonalContactStep({
  data,
  onNext,
  onCancel,
}: {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <p style={stepDescriptionStyle}>Who this person is, and how to reach them outside work.</p>
      <Form<PersonalContactFormData> onSubmit={(d) => onNext(d)}>
        {({ formProps }) => (
          <form {...formProps}>
            <FormSection title="Personal">
              <Field name="legalName" label="Full legal name" isRequired defaultValue={data.legalName}>
                {({ fieldProps }) => <TextField {...fieldProps} autoFocus />}
              </Field>
              <Field name="dateOfBirth" label="Date of birth" defaultValue={data.dateOfBirth}>
                {({ fieldProps }) => <TextField {...fieldProps} type="date" />}
              </Field>
              <Field name="gender" label="Gender" defaultValue={data.gender}>
                {({ fieldProps }) => <TextField {...fieldProps} />}
              </Field>
              <Field name="panNumber" label="PAN" defaultValue={data.panNumber}>
                {({ fieldProps }) => <TextField {...fieldProps} />}
              </Field>
            </FormSection>
            <FormSection title="Contact">
              <Field name="personalEmail" label="Personal email" defaultValue={data.personalEmail}>
                {({ fieldProps }) => <TextField {...fieldProps} type="email" />}
              </Field>
              <Field name="personalPhone" label="Personal phone" defaultValue={data.personalPhone}>
                {({ fieldProps }) => <TextField {...fieldProps} />}
              </Field>
            </FormSection>
            <div style={actionsRowStyle}>
              <Button type="submit" appearance="primary">
                Next: Work information
              </Button>
              <Button appearance="subtle" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Form>
    </div>
  );
}

interface WorkInformationFormData {
  joiningDate: string;
  employmentType: string;
  departmentId: string;
  designationId: string;
  gradeId: string;
  managerId: string;
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
      <p style={stepDescriptionStyle}>Where this person sits in the org, and when they start.</p>
      <Form<WorkInformationFormData> onSubmit={(d) => onNext(d)}>
        {({ formProps }) => (
          <form {...formProps}>
            <FormSection>
              <Field name="joiningDate" label="Joining date" isRequired defaultValue={data.joiningDate}>
                {({ fieldProps }) => <TextField {...fieldProps} type="date" autoFocus />}
              </Field>
              <Field name="employmentType" label="Employment type" isRequired defaultValue={data.employmentType}>
                {({ fieldProps }) => <TextField {...fieldProps} />}
              </Field>
              <Field<string, HTMLSelectElement> name="departmentId" label="Department" defaultValue={data.departmentId}>
                {({ fieldProps }) => (
                  <SelectField fieldProps={fieldProps}>
                    <option value="">—</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </Field>
              <Field<string, HTMLSelectElement> name="designationId" label="Designation" defaultValue={data.designationId}>
                {({ fieldProps }) => (
                  <SelectField fieldProps={fieldProps}>
                    <option value="">—</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </SelectField>
                )}
              </Field>
              <Field<string, HTMLSelectElement> name="gradeId" label="Grade" defaultValue={data.gradeId}>
                {({ fieldProps }) => (
                  <SelectField fieldProps={fieldProps}>
                    <option value="">—</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code} — {g.name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </Field>
              <Field<string, HTMLSelectElement> name="managerId" label="Reports to" defaultValue={data.managerId}>
                {({ fieldProps }) => (
                  <SelectField fieldProps={fieldProps}>
                    <option value="">—</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.legal_name}
                      </option>
                    ))}
                  </SelectField>
                )}
              </Field>
            </FormSection>
            <div style={actionsRowStyle}>
              <Button appearance="subtle" onClick={onBack}>
                Previous
              </Button>
              <Button type="submit" appearance="primary">
                Next: Education
              </Button>
            </div>
          </form>
        )}
      </Form>
    </div>
  );
}

interface EducationRowFormData {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
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
      <p style={stepDescriptionStyle}>Optional — add any degrees on record. Skip if there's nothing to add yet.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle}>No education records added yet.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.tempId} style={rowStyle}>
              <td style={cellStyle}>{r.degree}</td>
              <td style={cellStyle}>{r.fieldOfStudy || '—'}</td>
              <td style={cellStyle}>{r.institution}</td>
              <td style={cellStyle}>
                {r.startYear || '—'}–{r.endYear || '—'}
              </td>
              <td style={cellStyle}>
                <Button appearance="subtle" spacing="none" onClick={() => setRows((prev) => prev.filter((x) => x.tempId !== r.tempId))}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<EducationRowFormData>
        onSubmit={(d) => {
          setRows((prev) => [...prev, { ...d, tempId: crypto.randomUUID() }]);
        }}
      >
        {({ formProps, reset }) => (
          <form
            {...formProps}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
            onSubmit={(e) => {
              formProps.onSubmit(e);
              reset();
            }}
          >
            <Field name="degree" label="Degree" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="fieldOfStudy" label="Field of study" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="institution" label="Institution" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="startYear" label="Start year" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} type="number" />}
            </Field>
            <Field name="endYear" label="End year" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} type="number" />}
            </Field>
            <Button type="submit">Add</Button>
          </form>
        )}
      </Form>
      <div style={actionsRowStyle}>
        <Button appearance="subtle" onClick={() => onBack({ education: rows })}>
          Previous
        </Button>
        <Button appearance="primary" onClick={() => onNext({ education: rows })}>
          Next: Previous employment
        </Button>
      </div>
    </div>
  );
}

interface PreviousEmploymentRowFormData {
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
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
      <p style={stepDescriptionStyle}>Optional — add prior employers. Skip if this is a fresher hire.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle}>No previous employment added yet.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.tempId} style={rowStyle}>
              <td style={cellStyle}>{r.companyName}</td>
              <td style={cellStyle}>{r.designation || '—'}</td>
              <td style={cellStyle}>
                {r.startDate || '—'} – {r.endDate || '—'}
              </td>
              <td style={cellStyle}>
                <Button appearance="subtle" spacing="none" onClick={() => setRows((prev) => prev.filter((x) => x.tempId !== r.tempId))}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<PreviousEmploymentRowFormData>
        onSubmit={(d) => {
          setRows((prev) => [...prev, { ...d, tempId: crypto.randomUUID() }]);
        }}
      >
        {({ formProps, reset }) => (
          <form
            {...formProps}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
            onSubmit={(e) => {
              formProps.onSubmit(e);
              reset();
            }}
          >
            <Field name="companyName" label="Company" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="designation" label="Designation" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="startDate" label="Start date" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} type="date" />}
            </Field>
            <Field name="endDate" label="End date" defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} type="date" />}
            </Field>
            <Button type="submit">Add</Button>
          </form>
        )}
      </Form>
      <div style={actionsRowStyle}>
        <Button appearance="subtle" onClick={() => onBack({ previousEmployment: rows })}>
          Previous
        </Button>
        <Button appearance="primary" onClick={() => onNext({ previousEmployment: rows })}>
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

  return (
    <div>
      <p style={stepDescriptionStyle}>Check everything below, then create the employee record.</p>
      {error && (
        <MessageWrapper>
          <ErrorMessage>{error}</ErrorMessage>
        </MessageWrapper>
      )}

      <Heading size="small">Personal</Heading>
      <p style={labelStyle}>Legal name</p>
      <p style={valueStyle}>{data.legalName || '—'}</p>
      <p style={labelStyle}>Date of birth</p>
      <p style={valueStyle}>{data.dateOfBirth || '—'}</p>
      <p style={labelStyle}>Gender</p>
      <p style={valueStyle}>{data.gender || '—'}</p>
      <p style={labelStyle}>PAN</p>
      <p style={valueStyle}>{data.panNumber || '—'}</p>

      <div style={{ marginTop: 24 }}>
        <Heading size="small">Contact</Heading>
        <p style={labelStyle}>Personal email</p>
        <p style={valueStyle}>{data.personalEmail || '—'}</p>
        <p style={labelStyle}>Personal phone</p>
        <p style={valueStyle}>{data.personalPhone || '—'}</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading size="small">Work information</Heading>
        <p style={labelStyle}>Joining date</p>
        <p style={valueStyle}>{data.joiningDate || '—'}</p>
        <p style={labelStyle}>Employment type</p>
        <p style={valueStyle}>{data.employmentType || '—'}</p>
        <p style={labelStyle}>Department</p>
        <p style={valueStyle}>{departmentName}</p>
        <p style={labelStyle}>Designation</p>
        <p style={valueStyle}>{designationTitle}</p>
        <p style={labelStyle}>Grade</p>
        <p style={valueStyle}>{gradeName ? `${gradeName.code} — ${gradeName.name}` : '—'}</p>
        <p style={labelStyle}>Reports to</p>
        <p style={valueStyle}>{managerName}</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading size="small">Education</Heading>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <tbody>
            {data.education.length === 0 && (
              <tr>
                <td style={cellStyle}>None added.</td>
              </tr>
            )}
            {data.education.map((r) => (
              <tr key={r.tempId} style={rowStyle}>
                <td style={cellStyle}>{r.degree}</td>
                <td style={cellStyle}>{r.institution}</td>
                <td style={cellStyle}>
                  {r.startYear || '—'}–{r.endYear || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <Heading size="small">Previous employment</Heading>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <tbody>
            {data.previousEmployment.length === 0 && (
              <tr>
                <td style={cellStyle}>None added.</td>
              </tr>
            )}
            {data.previousEmployment.map((r) => (
              <tr key={r.tempId} style={rowStyle}>
                <td style={cellStyle}>{r.companyName}</td>
                <td style={cellStyle}>{r.designation || '—'}</td>
                <td style={cellStyle}>
                  {r.startDate || '—'} – {r.endDate || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={actionsRowStyle}>
        <Button appearance="subtle" onClick={onBack} isDisabled={submitting}>
          Previous
        </Button>
        <Button appearance="primary" onClick={onSubmit} isLoading={submitting}>
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
  // still create_employee()'s own admin check. This just saves a non-admin from filling out
  // five steps before finding out the last one rejects.
  useEffect(() => {
    if (role && role !== 'admin') navigate('/employees', { replace: true });
  }, [role, navigate]);

  const goNext = (partial: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...partial }));
    setStepIndex((i) => i + 1);
  };
  // Takes an optional partial so a step that holds its own "already confirmed" list state
  // (Education, Previous employment — rows the user explicitly clicked Add for, not just
  // typed into a field) can persist it before unmounting. A single-record step's in-progress,
  // not-yet-submitted field edits are fine to drop on Back — same as leaving any unsubmitted
  // form — but a list a user already added rows to silently reverting on Back isn't; a real
  // browser run of this wizard caught exactly that regression.
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

    // The employee record — the part that actually matters — is already created at this
    // point. Education/previous-employment are best-effort follow-ups: if either insert fails,
    // the user still lands on a real employee record and can add these rows from the Profile
    // tab (ProfileTab.tsx) exactly like any other time, rather than losing the whole submission.
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
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <Heading size="large">Add employee</Heading>
      <div style={{ marginTop: 24 }}>
        <Stepper steps={STEPS} currentIndex={stepIndex} />
      </div>

      {stepIndex === 0 && (
        <PersonalContactStep data={wizardData} onNext={goNext} onCancel={() => navigate('/employees')} />
      )}
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
