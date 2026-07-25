import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePageTitleStore } from '../../lib/pageTitleStore';
import { avatarColor, initials } from '../../lib/avatar';
import type { Employee, EmploymentAssignment } from '../../lib/database.types';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import ProfileTab from './ProfileTab';
import EmploymentTab from './EmploymentTab';
import DocumentsTab from './DocumentsTab';

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

  // Feeds AppShell's breadcrumb — the last segment on this dynamic route is this employee's
  // actual name, not a generic label, and AppShell shouldn't need its own duplicate fetch just
  // to know it. Cleared on unmount so a stale name doesn't flash on the next page.
  useEffect(() => {
    usePageTitleStore.getState().setTitle(employee?.legal_name ?? null);
    return () => usePageTitleStore.getState().setTitle(null);
  }, [employee]);

  if (loading) return <p className="p-6 text-text-subtle">Loading…</p>;
  if (!employee) return <p className="p-6 text-text-subtle">Not found.</p>;

  return (
    <div className="mx-auto max-w-[864px] p-6">
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-text-inverse"
          style={{ backgroundColor: avatarColor(employee.legal_name) }}
        >
          {initials(employee.legal_name)}
        </div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">{employee.legal_name}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-text-subtle">
            {employee.employee_code}
            <Badge variant={employee.status === 'active' ? 'success' : 'default'}>{employee.status}</Badge>
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab employee={employee} onSaved={setEmployee} />
        </TabsContent>
        <TabsContent value="employment">
          <EmploymentTab employeeId={employee.id} assignments={assignments} onTransferred={() => fetchAssignments(employee.id)} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab employeeId={employee.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
