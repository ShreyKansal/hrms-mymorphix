import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/table';
import type { Employee, EmployeeEducation, EmployeePreviousEmployment } from '../../lib/database.types';

const labelClass = 'mt-3 text-xs font-semibold text-text-subtle';
const valueClass = 'mt-0.5 text-foreground';

interface ProfileFormData {
  legalName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  personalEmail: string;
  personalPhone: string;
}

function field(data: FormData, key: string) {
  return String(data.get(key) ?? '');
}

function PersonalContactSection({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <div className="max-w-[480px]">
        <h3 className="text-sm font-semibold text-foreground">Personal</h3>
        <p className={labelClass}>Legal name</p>
        <p className={valueClass}>{employee.legal_name}</p>
        <p className={labelClass}>Date of birth</p>
        <p className={valueClass}>{employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '—'}</p>
        <p className={labelClass}>Gender</p>
        <p className={valueClass}>{employee.gender ?? '—'}</p>
        <p className={labelClass}>PAN</p>
        <p className={valueClass}>{employee.pan_number ?? '—'}</p>

        <h3 className="mt-4 text-sm font-semibold text-foreground">Contact</h3>
        <p className={labelClass}>Personal email</p>
        <p className={valueClass}>{employee.personal_email ?? '—'}</p>
        <p className={labelClass}>Personal phone</p>
        <p className={valueClass}>{employee.personal_phone ?? '—'}</p>

        <div className="mt-6">
          <Button onClick={() => setEditing(true)}>Edit</Button>
        </div>
      </div>
    );
  }

  const data: ProfileFormData = {
    legalName: employee.legal_name,
    dateOfBirth: employee.date_of_birth ?? '',
    gender: employee.gender ?? '',
    panNumber: employee.pan_number ?? '',
    personalEmail: employee.personal_email ?? '',
    personalPhone: employee.personal_phone ?? '',
  };

  return (
    <form
      className="max-w-[480px]"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const form = e.currentTarget;
          const fd = new FormData(form);
        const { data: updated, error: updateError } = await supabase
          .from('employees')
          .update({
            legal_name: field(fd, 'legalName'),
            date_of_birth: field(fd, 'dateOfBirth') || null,
            gender: field(fd, 'gender') || null,
            pan_number: field(fd, 'panNumber') || null,
            personal_email: field(fd, 'personalEmail') || null,
            personal_phone: field(fd, 'personalPhone') || null,
          })
          .eq('id', employee.id)
          .select()
          .single();
        setSaving(false);
        if (updateError) {
          setError(updateError.message);
          return;
        }
        onSaved(updated);
        setEditing(false);
      }}
    >
      {error && <p className="mb-3 text-sm text-text-danger">{error}</p>}
      <h3 className="text-sm font-semibold text-foreground">Personal</h3>
      <div className="mt-2 space-y-3">
        <div>
          <Label htmlFor="legalName" required>
            Legal name
          </Label>
          <Input id="legalName" name="legalName" required defaultValue={data.legalName} />
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

      <h3 className="mt-4 text-sm font-semibold text-foreground">Contact</h3>
      <div className="mt-2 space-y-3">
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
        <Button type="submit" variant="primary" loading={saving}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EducationSection({ employeeId }: { employeeId: string }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [rows, setRows] = useState<EmployeeEducation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    const { data } = await supabase.from('employee_education').select('*').eq('employee_id', employeeId).order('end_year', { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground">Education</h3>
      <Table>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell>No education records yet.</TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.degree}</TableCell>
              <TableCell>{r.field_of_study ?? '—'}</TableCell>
              <TableCell>{r.institution}</TableCell>
              <TableCell>
                {r.start_year ?? '—'}–{r.end_year ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="mt-2 text-sm text-text-danger">{error}</p>}
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!tenantId) {
            setError('No workspace context');
            return;
          }
          const form = e.currentTarget;
          const fd = new FormData(form);
          const { error: insertError } = await supabase.from('employee_education').insert({
            tenant_id: tenantId,
            employee_id: employeeId,
            institution: field(fd, 'institution'),
            degree: field(fd, 'degree'),
            field_of_study: field(fd, 'fieldOfStudy') || null,
            start_year: field(fd, 'startYear') ? Number(field(fd, 'startYear')) : null,
            end_year: field(fd, 'endYear') ? Number(field(fd, 'endYear')) : null,
          });
          if (insertError) {
            setError(insertError.message);
            return;
          }
          form.reset();
          await fetchRows();
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
    </div>
  );
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
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground">Previous employment</h3>
      <Table>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell>No previous employment records yet.</TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.company_name}</TableCell>
              <TableCell>{r.designation ?? '—'}</TableCell>
              <TableCell>
                {r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'} – {r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="mt-2 text-sm text-text-danger">{error}</p>}
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!tenantId) {
            setError('No workspace context');
            return;
          }
          const form = e.currentTarget;
          const fd = new FormData(form);
          const { error: insertError } = await supabase.from('employee_previous_employment').insert({
            tenant_id: tenantId,
            employee_id: employeeId,
            company_name: field(fd, 'companyName'),
            designation: field(fd, 'designation') || null,
            start_date: field(fd, 'startDate') || null,
            end_date: field(fd, 'endDate') || null,
          });
          if (insertError) {
            setError(insertError.message);
            return;
          }
          form.reset();
          await fetchRows();
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
    </div>
  );
}

// Module 01 PRD §15: Profile tab covers personal/contact/emergency/dependants/nominees, and
// §9 additionally lists education/previous-employment as employee profile field groups.
// Emergency contacts, dependants, and nominees still have no backing tables — adding empty
// sections for those would be a half-finished UI, so they stay out until they have real data
// behind them.
export default function ProfileTab({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  return (
    <div>
      <PersonalContactSection employee={employee} onSaved={onSaved} />
      <EducationSection employeeId={employee.id} />
      <PreviousEmploymentSection employeeId={employee.id} />
    </div>
  );
}
