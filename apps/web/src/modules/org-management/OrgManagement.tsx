import { useEffect, useState } from 'react';
import Heading from '@atlaskit/heading';
import Button from '@atlaskit/button/new';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Form, { Field, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { useAuthStore } from '../auth/store';
import { useOrgManagementStore } from './store';

const rowStyle = { borderBottom: '1px solid #DCDFE4' };
const cellStyle = { padding: 8 };

// Module 2 PRD's "Departments, Locations, Grades/Bands/Designations CRUD" story, scoped down
// to what's needed to unblock Module 1's Transfer flow: a flat list + create, no edit/delete,
// no department hierarchy (parent_id exists in the schema but isn't exposed here yet). Adding
// those now would be building ahead of any actual need for them.
export default function OrgManagement() {
  const { tenantId, legalEntityId } = useAuthStore();
  const { departments, designations, grades, loading, error, fetchAll, createDepartment, createDesignation, createGrade } =
    useOrgManagementStore();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Heading size="large">Organisation</Heading>
      </div>

      {error && <p style={{ color: 'red' }}>Could not load: {error}</p>}

      <Tabs id="org-management-tabs">
        <TabList>
          <Tab>Departments</Tab>
          <Tab>Designations</Tab>
          <Tab>Grades</Tab>
        </TabList>

        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <DepartmentSection
              departments={departments}
              loading={loading}
              onCreate={(name) =>
                tenantId && legalEntityId ? createDepartment(name, tenantId, legalEntityId) : Promise.resolve({ error: 'No workspace context' })
              }
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <DesignationSection
              designations={designations}
              loading={loading}
              onCreate={(title) => (tenantId ? createDesignation(title, tenantId) : Promise.resolve({ error: 'No workspace context' }))}
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div style={{ paddingTop: 16 }}>
            <GradeSection
              grades={grades}
              loading={loading}
              onCreate={(code, name) => (tenantId ? createGrade(code, name, tenantId) : Promise.resolve({ error: 'No workspace context' }))}
            />
          </div>
        </TabPanel>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {departments.length === 0 && !loading && (
            <tr>
              <td style={cellStyle}>No departments yet.</td>
            </tr>
          )}
          {departments.map((d) => (
            <tr key={d.id} style={rowStyle}>
              <td style={cellStyle}>{d.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<{ name: string }>
        onSubmit={async (data) => {
          setError(null);
          const { error } = await onCreate(data.name);
          if (error) setError(error);
        }}
      >
        {({ formProps, reset }) => (
          <form
            {...formProps}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
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
            <Field name="name" label="New department" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Button type="submit">Add</Button>
          </form>
        )}
      </Form>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {designations.length === 0 && !loading && (
            <tr>
              <td style={cellStyle}>No designations yet.</td>
            </tr>
          )}
          {designations.map((d) => (
            <tr key={d.id} style={rowStyle}>
              <td style={cellStyle}>{d.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<{ title: string }>
        onSubmit={async (data) => {
          setError(null);
          const { error } = await onCreate(data.title);
          if (error) setError(error);
        }}
      >
        {({ formProps, reset }) => (
          <form
            {...formProps}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
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
            <Field name="title" label="New designation" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Button type="submit">Add</Button>
          </form>
        )}
      </Form>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {grades.length === 0 && !loading && (
            <tr>
              <td style={cellStyle}>No grades yet.</td>
            </tr>
          )}
          {grades.map((g) => (
            <tr key={g.id} style={rowStyle}>
              <td style={cellStyle}>{g.code}</td>
              <td style={cellStyle}>{g.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form<{ code: string; name: string }>
        onSubmit={async (data) => {
          setError(null);
          const { error } = await onCreate(data.code, data.name);
          if (error) setError(error);
        }}
      >
        {({ formProps, reset }) => (
          <form
            {...formProps}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
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
            <Field name="code" label="Code" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Field name="name" label="New grade" isRequired defaultValue="">
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>
            <Button type="submit">Add</Button>
          </form>
        )}
      </Form>
    </div>
  );
}
