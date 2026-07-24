import { useEffect, useState } from 'react';
import Heading from '@atlaskit/heading';
import Button from '@atlaskit/button/new';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { labelStyle, valueStyle, rowStyle, cellStyle } from '../../lib/detailStyles';
import type { Employee, EmployeeEducation, EmployeePreviousEmployment } from '../../lib/database.types';

interface ProfileFormData {
  legalName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  personalEmail: string;
  personalPhone: string;
}

function PersonalContactSection({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div style={{ maxWidth: 480 }}>
        <Heading size="small">Personal</Heading>
        <p style={labelStyle}>Legal name</p>
        <p style={valueStyle}>{employee.legal_name}</p>
        <p style={labelStyle}>Date of birth</p>
        <p style={valueStyle}>
          {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '—'}
        </p>
        <p style={labelStyle}>Gender</p>
        <p style={valueStyle}>{employee.gender ?? '—'}</p>
        <p style={labelStyle}>PAN</p>
        <p style={valueStyle}>{employee.pan_number ?? '—'}</p>

        <Heading size="small">Contact</Heading>
        <p style={labelStyle}>Personal email</p>
        <p style={valueStyle}>{employee.personal_email ?? '—'}</p>
        <p style={labelStyle}>Personal phone</p>
        <p style={valueStyle}>{employee.personal_phone ?? '—'}</p>

        <div style={{ marginTop: 20 }}>
          <Button onClick={() => setEditing(true)}>Edit</Button>
        </div>
      </div>
    );
  }

  return (
    <Form<ProfileFormData>
      onSubmit={async (data) => {
        setError(null);
        const { data: updated, error: updateError } = await supabase
          .from('employees')
          .update({
            legal_name: data.legalName,
            date_of_birth: data.dateOfBirth || null,
            gender: data.gender || null,
            pan_number: data.panNumber || null,
            personal_email: data.personalEmail || null,
            personal_phone: data.personalPhone || null,
          })
          .eq('id', employee.id)
          .select()
          .single();
        if (updateError) {
          setError(updateError.message);
          return;
        }
        onSaved(updated);
        setEditing(false);
      }}
    >
      {({ formProps }) => (
        <form {...formProps} style={{ maxWidth: 480 }}>
          {error && (
            <MessageWrapper>
              <ErrorMessage>{error}</ErrorMessage>
            </MessageWrapper>
          )}
          <FormSection title="Personal">
            <Field name="legalName" label="Legal name" isRequired defaultValue={employee.legal_name}>
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="dateOfBirth" label="Date of birth" defaultValue={employee.date_of_birth ?? ''}>
              {({ fieldProps }) => <TextField {...fieldProps} type="date" />}
            </Field>
            <Field name="gender" label="Gender" defaultValue={employee.gender ?? ''}>
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="panNumber" label="PAN" defaultValue={employee.pan_number ?? ''}>
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
          </FormSection>
          <FormSection title="Contact">
            <Field name="personalEmail" label="Personal email" defaultValue={employee.personal_email ?? ''}>
              {({ fieldProps }) => <TextField {...fieldProps} type="email" />}
            </Field>
            <Field name="personalPhone" label="Personal phone" defaultValue={employee.personal_phone ?? ''}>
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
          </FormSection>
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <Button type="submit" appearance="primary">
              Save
            </Button>
            <Button appearance="subtle" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Form>
  );
}

interface EducationFormData {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

function EducationSection({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [rows, setRows] = useState<EmployeeEducation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    const { data } = await supabase
      .from('employee_education')
      .select('*')
      .eq('employee_id', employeeId)
      .order('end_year', { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <div style={{ marginTop: 24 }}>
      <Heading size="small">Education</Heading>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 16 }}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle}>No education records yet.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} style={rowStyle}>
              <td style={cellStyle}>{r.degree}</td>
              <td style={cellStyle}>{r.field_of_study ?? '—'}</td>
              <td style={cellStyle}>{r.institution}</td>
              <td style={cellStyle}>
                {r.start_year ?? '—'}–{r.end_year ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<EducationFormData>
        onSubmit={async (data) => {
          setError(null);
          if (!tenantId) {
            setError('No workspace context');
            return;
          }
          const { error: insertError } = await supabase.from('employee_education').insert({
            tenant_id: tenantId,
            employee_id: employeeId,
            institution: data.institution,
            degree: data.degree,
            field_of_study: data.fieldOfStudy || null,
            start_year: data.startYear ? Number(data.startYear) : null,
            end_year: data.endYear ? Number(data.endYear) : null,
          });
          if (insertError) {
            setError(insertError.message);
            return;
          }
          await fetchRows();
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
            {error && (
              <MessageWrapper>
                <ErrorMessage>{error}</ErrorMessage>
              </MessageWrapper>
            )}
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
    </div>
  );
}

interface PreviousEmploymentFormData {
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
}

function PreviousEmploymentSection({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [rows, setRows] = useState<EmployeePreviousEmployment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    const { data } = await supabase
      .from('employee_previous_employment')
      .select('*')
      .eq('employee_id', employeeId)
      .order('end_date', { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <div style={{ marginTop: 24 }}>
      <Heading size="small">Previous employment</Heading>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 16 }}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle}>No previous employment records yet.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} style={rowStyle}>
              <td style={cellStyle}>{r.company_name}</td>
              <td style={cellStyle}>{r.designation ?? '—'}</td>
              <td style={cellStyle}>
                {r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'} –{' '}
                {r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<PreviousEmploymentFormData>
        onSubmit={async (data) => {
          setError(null);
          if (!tenantId) {
            setError('No workspace context');
            return;
          }
          const { error: insertError } = await supabase.from('employee_previous_employment').insert({
            tenant_id: tenantId,
            employee_id: employeeId,
            company_name: data.companyName,
            designation: data.designation || null,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
          });
          if (insertError) {
            setError(insertError.message);
            return;
          }
          await fetchRows();
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
            {error && (
              <MessageWrapper>
                <ErrorMessage>{error}</ErrorMessage>
              </MessageWrapper>
            )}
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
    </div>
  );
}

// Module 01 PRD §15: Profile tab covers personal/contact/emergency/dependants/nominees, and
// §9 additionally lists education/previous-employment as employee profile field groups.
// Emergency contacts, dependants, and nominees still have no backing tables — adding empty
// sections for those would be a half-finished UI, so they stay out until they have real data
// behind them. Education and previous employment do now (see the 20260724030000 migration).
export default function ProfileTab({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  return (
    <div>
      <PersonalContactSection employee={employee} onSaved={onSaved} />
      <EducationSection employeeId={employee.id} />
      <PreviousEmploymentSection employeeId={employee.id} />
    </div>
  );
}
