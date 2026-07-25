import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePageTitleStore } from '../../lib/pageTitleStore';
import { Avatar } from '../../components/ui/avatar';
import type { Employee, EmploymentAssignment } from '../../lib/database.types';
import { Badge, type BadgeProps } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { PageContainer, EmptyState, Skeleton } from '../../components/ui/page';
import ProfileTab from './ProfileTab';
import EmploymentTab from './EmploymentTab';
import DocumentsTab from './DocumentsTab';

const STATUS_BADGE: Record<Employee['status'], { variant: BadgeProps['variant']; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  on_leave: { variant: 'warning', label: 'On leave' },
  suspended: { variant: 'destructive', label: 'Suspended' },
  separation_initiated: { variant: 'warning', label: 'Separation initiated' },
  separated: { variant: 'default', label: 'Separated' },
};

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<EmploymentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async (employeeId: string) => {
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
      const { data: emp } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
      setEmployee(emp);
      await fetchAssignments(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    usePageTitleStore.getState().setTitle(employee?.legal_name ?? null);
    return () => usePageTitleStore.getState().setTitle(null);
  }, [employee]);

  if (loading) {
    return (
      <PageContainer>
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-full max-w-sm" />
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <EmptyState
          title="Employee not found"
          description="This record doesn't exist, or you don't have access to it."
          action={
            <Link to="/employees" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-link hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Employees
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const current = assignments.find((a) => a.effective_to === null);
  const subtitle = [current?.designations?.title, current?.departments?.name].filter(Boolean).join(' · ');
  const badge = STATUS_BADGE[employee.status] ?? { variant: 'default' as const, label: employee.status };

  return (
    <PageContainer>
      <div className="mb-8 flex items-start gap-4">
        <Avatar name={employee.legal_name} size="xl" />
        <div className="min-w-0 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{employee.legal_name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-foreground-lighter">
            <span className="font-mono text-xs">{employee.employee_code}</span>
            {subtitle && <span className="text-foreground-muted">·</span>}
            {subtitle && <span>{subtitle}</span>}
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
    </PageContainer>
  );
}
