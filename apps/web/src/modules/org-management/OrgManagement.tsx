import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from './store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Alert } from '../../components/ui/alert';
import { Card, CardFooter } from '../../components/ui/card';
import { PageContainer, PageHeader } from '../../components/ui/page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

// Module 2's "Departments, Locations, Grades/Designations CRUD" story, scoped to what unblocks
// Module 1's Transfer flow: a flat list + create.
export default function OrgManagement() {
  const { tenantId, legalEntityId } = useAuthStore();
  const { departments, designations, grades, loading, error, fetchAll, createDepartment, createDesignation, createGrade } = useOrgManagementStore();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Organisation" description="Departments, designations, and grades used across employee records." />

      {error && (
        <Alert variant="destructive" title="Couldn't load organisation data" className="mb-6">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentSection
            departments={departments}
            loading={loading}
            onCreate={(name) => (tenantId && legalEntityId ? createDepartment(name, tenantId, legalEntityId) : Promise.resolve({ error: 'No workspace context' }))}
          />
        </TabsContent>
        <TabsContent value="designations">
          <DesignationSection
            designations={designations}
            loading={loading}
            onCreate={(title) => (tenantId ? createDesignation(title, tenantId) : Promise.resolve({ error: 'No workspace context' }))}
          />
        </TabsContent>
        <TabsContent value="grades">
          <GradeSection grades={grades} loading={loading} onCreate={(code, name) => (tenantId ? createGrade(code, name, tenantId) : Promise.resolve({ error: 'No workspace context' }))} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function DepartmentSection({
  departments,
  loading,
  onCreate,
}: {
  departments: { id: string; name: string }[];
  loading: boolean;
  onCreate: (name: string) => Promise<{ error: string | null }>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Department name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.length === 0 && !loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell className="text-foreground-lighter">No departments yet — add your first below.</TableCell>
            </TableRow>
          ) : (
            departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-foreground">{d.name}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Couldn't add department">
            {error}
          </Alert>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            const { error } = await onCreate(String(fd.get('name') ?? ''));
            if (error) setError(error);
            else form.reset();
          }}
        >
          <Field label="New department" htmlFor="dept-name" required className="flex-1">
            <Input id="dept-name" name="name" required placeholder="e.g. Engineering" />
          </Field>
          <Button type="submit" variant="primary">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function DesignationSection({
  designations,
  loading,
  onCreate,
}: {
  designations: { id: string; title: string }[];
  loading: boolean;
  onCreate: (title: string) => Promise<{ error: string | null }>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Designation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {designations.length === 0 && !loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell className="text-foreground-lighter">No designations yet — add your first below.</TableCell>
            </TableRow>
          ) : (
            designations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-foreground">{d.title}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Couldn't add designation">
            {error}
          </Alert>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            const { error } = await onCreate(String(fd.get('title') ?? ''));
            if (error) setError(error);
            else form.reset();
          }}
        >
          <Field label="New designation" htmlFor="desig-title" required className="flex-1">
            <Input id="desig-title" name="title" required placeholder="e.g. Senior Engineer" />
          </Field>
          <Button type="submit" variant="primary">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function GradeSection({
  grades,
  loading,
  onCreate,
}: {
  grades: { id: string; code: string; name: string }[];
  loading: boolean;
  onCreate: (code: string, name: string) => Promise<{ error: string | null }>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32">Code</TableHead>
            <TableHead>Grade name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.length === 0 && !loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="text-foreground-lighter">
                No grades yet — add your first below.
              </TableCell>
            </TableRow>
          ) : (
            grades.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-xs text-foreground-lighter">{g.code}</TableCell>
                <TableCell className="font-medium text-foreground">{g.name}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <CardFooter className="flex-col items-stretch gap-3">
        {error && (
          <Alert variant="destructive" title="Couldn't add grade">
            {error}
          </Alert>
        )}
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            const { error } = await onCreate(String(fd.get('code') ?? ''), String(fd.get('name') ?? ''));
            if (error) setError(error);
            else form.reset();
          }}
        >
          <Field label="Code" htmlFor="grade-code" required>
            <Input id="grade-code" name="code" required className="w-24" placeholder="L4" />
          </Field>
          <Field label="New grade" htmlFor="grade-name" required className="flex-1">
            <Input id="grade-name" name="name" required placeholder="e.g. Senior" />
          </Field>
          <Button type="submit" variant="primary">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
