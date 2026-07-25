import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from './store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

// Module 2 PRD's "Departments, Locations, Grades/Bands/Designations CRUD" story, scoped down
// to what's needed to unblock Module 1's Transfer flow: a flat list + create, no edit/delete,
// no department hierarchy (parent_id exists in the schema but isn't exposed here yet).
export default function OrgManagement() {
  const { tenantId, legalEntityId } = useAuthStore();
  const { departments, designations, grades, loading, error, fetchAll, createDepartment, createDesignation, createGrade } = useOrgManagementStore();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-[864px] p-6">
      <h1 className="mb-6 text-2xl font-medium text-foreground">Organisation</h1>

      {error && <p className="text-sm text-text-danger">Could not load: {error}</p>}

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
    </div>
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
    <div>
      <Table>
        <TableBody>
          {departments.length === 0 && !loading && (
            <TableRow>
              <TableCell>No departments yet.</TableCell>
            </TableRow>
          )}
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="mt-2 text-sm text-text-danger">{error}</p>}
      <form
        className="mt-3 flex items-end gap-2"
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
        <div>
          <Label htmlFor="dept-name" required>
            New department
          </Label>
          <Input id="dept-name" name="name" required />
        </div>
        <Button type="submit">Add</Button>
      </form>
    </div>
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
    <div>
      <Table>
        <TableBody>
          {designations.length === 0 && !loading && (
            <TableRow>
              <TableCell>No designations yet.</TableCell>
            </TableRow>
          )}
          {designations.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.title}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="mt-2 text-sm text-text-danger">{error}</p>}
      <form
        className="mt-3 flex items-end gap-2"
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
        <div>
          <Label htmlFor="desig-title" required>
            New designation
          </Label>
          <Input id="desig-title" name="title" required />
        </div>
        <Button type="submit">Add</Button>
      </form>
    </div>
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
    <div>
      <Table>
        <TableBody>
          {grades.length === 0 && !loading && (
            <TableRow>
              <TableCell>No grades yet.</TableCell>
            </TableRow>
          )}
          {grades.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.code}</TableCell>
              <TableCell>{g.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p className="mt-2 text-sm text-text-danger">{error}</p>}
      <form
        className="mt-3 flex items-end gap-2"
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
        <div>
          <Label htmlFor="grade-code" required>
            Code
          </Label>
          <Input id="grade-code" name="code" required className="w-24" />
        </div>
        <div>
          <Label htmlFor="grade-name" required>
            New grade
          </Label>
          <Input id="grade-name" name="name" required />
        </div>
        <Button type="submit">Add</Button>
      </form>
    </div>
  );
}
