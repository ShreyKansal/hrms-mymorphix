import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Heading from '@atlaskit/heading';
import Lozenge from '@atlaskit/lozenge';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { token } from '@atlaskit/tokens';
import { supabase } from '../../lib/supabase';
import { usePageTitleStore } from '../../lib/pageTitleStore';
import { avatarColor, initials } from '../../lib/avatar';
import type { Employee, EmploymentAssignment } from '../../lib/database.types';
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

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!employee) return <p style={{ padding: 24 }}>Not found.</p>;

  return (
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: avatarColor(employee.legal_name),
            color: token('color.text.inverse', '#FFFFFF'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          {initials(employee.legal_name)}
        </div>
        <div>
          <Heading size="large">{employee.legal_name}</Heading>
          <p style={{ margin: '2px 0 0', color: token('color.text.subtle', '#44546F') }}>
            {employee.employee_code} · <Lozenge appearance={employee.status === 'active' ? 'success' : 'default'}>{employee.status}</Lozenge>
          </p>
        </div>
      </div>

      <Tabs id="employee-detail-tabs">
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Employment</Tab>
          <Tab>Documents</Tab>
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
        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <DocumentsTab employeeId={employee.id} />
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
