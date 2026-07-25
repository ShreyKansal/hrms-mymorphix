import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { InfoField } from '../../components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import type { Employee, EmployeeEducation, EmployeePreviousEmployment } from '../../lib/database.types';

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

function fmtDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function PersonalContactSection({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Personal &amp; contact</CardTitle>
          <Button variant="default" size="small" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <InfoField label="Legal name">{employee.legal_name}</InfoField>
            <InfoField label="Date of birth">{fmtDate(employee.date_of_birth)}</InfoField>
            <InfoField label="Gender">{employee.gender ?? '—'}</InfoField>
            <InfoField label="PAN">{employee.pan_number ?? '—'}</InfoField>
            <InfoField label="Personal email">{employee.personal_email ?? '—'}</InfoField>
            <InfoField label="Personal phone">{employee.personal_phone ?? '—'}</InfoField>
          </dl>
        </CardContent>
      </Card>
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
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const fd = new FormData(e.currentTarget);
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
      <Card>
        <CardHeader>
          <CardTitle>Edit personal &amp; contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" title="Couldn't save changes">
              {error}
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Legal name" htmlFor="legalName" required className="sm:col-span-2">
              <Input id="legalName" name="legalName" required defaultValue={data.legalName} />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth">
              <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={data.dateOfBirth} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Input id="gender" name="gender" defaultValue={data.gender} />
            </Field>
            <Field label="PAN" htmlFor="panNumber">
              <Input id="panNumber" name="panNumber" defaultValue={data.panNumber} />
            </Field>
            <Field label="Personal email" htmlFor="personalEmail">
              <Input id="personalEmail" name="personalEmail" type="email" defaultValue={data.personalEmail} />
            </Field>
            <Field label="Personal phone" htmlFor="personalPhone">
              <Input id="personalPhone" name="personalPhone" defaultValue={data.personalPhone} />
            </Field>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="button" variant="default" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Degree</TableHead>
            <TableHead>Field of study</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead>Years</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="text-foreground-lighter">
                No education records yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-foreground">{r.degree}</TableCell>
                <TableCell>{r.field_of_study ?? '—'}</TableCell>
                <TableCell>{r.institution}</TableCell>
                <TableCell className="tabular-nums">
                  {r.start_year ?? '—'}–{r.end_year ?? '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Couldn't add record">
            {error}
          </Alert>
        )}
        <form
          className="flex flex-wrap items-end gap-2"
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
      </CardFooter>
    </Card>
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
    <Card>
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
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="text-foreground-lighter">
                No previous employment records yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-foreground">{r.company_name}</TableCell>
                <TableCell>{r.designation ?? '—'}</TableCell>
                <TableCell>
                  {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Couldn't add record">
            {error}
          </Alert>
        )}
        <form
          className="flex flex-wrap items-end gap-2"
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
      </CardFooter>
    </Card>
  );
}

// Module 01 PRD §15: Profile tab covers personal/contact plus education/previous-employment.
// Emergency contacts, dependants, and nominees still have no backing tables — adding empty
// sections for those would be a half-finished UI, so they stay out until they have real data.
export default function ProfileTab({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  return (
    <div className="space-y-6">
      <PersonalContactSection employee={employee} onSaved={onSaved} />
      <EducationSection employeeId={employee.id} />
      <PreviousEmploymentSection employeeId={employee.id} />
    </div>
  );
}
