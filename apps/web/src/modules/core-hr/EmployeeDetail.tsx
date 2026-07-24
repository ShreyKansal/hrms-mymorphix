import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import Button from '@atlaskit/button/new';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { supabase } from '../../lib/supabase';
import type { Employee, EmploymentAssignment } from '../../lib/database.types';
import TransferEmployeeModal from './TransferEmployeeModal';

const labelStyle = { color: '#626F86', fontSize: 12, fontWeight: 600, marginTop: 12 };
const valueStyle = { margin: '2px 0 0' };

interface ProfileFormData {
  legalName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  personalEmail: string;
  personalPhone: string;
}

// Module 01 PRD §15: Profile tab covers personal/contact/emergency/dependants/nominees.
// Emergency contacts, dependants, and nominees need their own tables — none exist in the
// Foundation-phase schema yet, so this deliberately covers only personal + contact, the
// two groups the current `employees` table actually has fields for. Adding empty
// placeholder sections for the rest would be a half-finished UI backed by nothing.
function ProfileTab({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
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

function EmploymentTab({
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading size="small">Current assignment</Heading>
        <Button onClick={() => setTransferOpen(true)}>Transfer</Button>
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

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<EmploymentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async (employeeId: string) => {
    // manager:employees!manager_id(...) — same disambiguation as employeesStore.ts's
    // !employee_id hint: employment_assignments has two FKs to employees, so an unhinted
    // embed of "employees" here is ambiguous between employee_id and manager_id.
    const { data: history } = await supabase
      .from('employment_assignments')
      .select('*, departments(*), designations(*), grades(*), manager:employees!manager_id(id, legal_name)')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false });
    setAssignments(history ?? []);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      // .maybeSingle(), not .single(): a bad/stale URL (deleted employee, wrong tenant)
      // legitimately resolves to zero rows — the "Not found" branch below already handles
      // that. .single() would log a 406 console error for what's a normal UI state.
      const { data: emp } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
      setEmployee(emp);
      await fetchAssignments(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <Tabs id="employee-detail-tabs">
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Employment</Tab>
        </TabList>
        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <ProfileTab employee={employee} onSaved={setEmployee} />
          </div>
        </TabPanel>
        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <EmploymentTab employeeId={employee.id} assignments={assignments} onTransferred={() => fetchAssignments(employee.id)} />
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
