import { useEffect, useState } from 'react';
import Heading from '@atlaskit/heading';
import Button from '@atlaskit/button/new';
import Lozenge from '@atlaskit/lozenge';
import Form, { Field, FormSection, ErrorMessage, MessageWrapper } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { SelectField } from '../../lib/SelectField';
import { useAuthStore } from '../auth/store';
import { useTeamStore } from './store';

const rowStyle = { borderBottom: '1px solid #DCDFE4' };
const cellStyle = { padding: 8 };

interface InviteFormData {
  email: string;
  role: 'admin' | 'employee';
}

// Module 21 (Roles and Permissions), first slice — see the migration this depends on
// (20260724050000_roles_and_invitations.sql) for why: this exists first to make a second
// user possible at all, and second to give "admin" vs "employee" a real, enforced meaning.
// Not built: the full composable multi-role/scope model, segregation-of-duties checks,
// time-boxed access, access-review reporting — all real Module 21 scope, all deferred until
// something concrete actually needs them.
export default function Team() {
  const role = useAuthStore((s) => s.role);
  const { members, pendingInvitations, loading, error, fetchTeam, inviteUser } = useTeamStore();
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 864, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Heading size="large">Team</Heading>
      </div>

      {error && <p style={{ color: 'red' }}>Could not load: {error}</p>}

      <Heading size="small">Members</Heading>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 24 }}>
        <tbody>
          {members.length === 0 && !loading && (
            <tr>
              <td style={cellStyle}>No members yet.</td>
            </tr>
          )}
          {members.map((m) => (
            <tr key={m.id} style={rowStyle}>
              <td style={cellStyle}>{m.email ?? '—'}</td>
              <td style={cellStyle}>
                <Lozenge appearance={m.role === 'admin' ? 'success' : 'default'}>{m.role}</Lozenge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pendingInvitations.length > 0 && (
        <>
          <Heading size="small">Pending invitations</Heading>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 24 }}>
            <tbody>
              {pendingInvitations.map((inv) => (
                <tr key={inv.id} style={rowStyle}>
                  <td style={cellStyle}>{inv.email}</td>
                  <td style={cellStyle}>
                    <Lozenge>{inv.role}</Lozenge>
                  </td>
                  <td style={cellStyle}>invited {new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {role === 'admin' && (
        <>
          <Heading size="small">Invite someone</Heading>
          <Form<InviteFormData>
            onSubmit={async (data) => {
              setInviteError(null);
              const { error } = await inviteUser(data.email, data.role);
              if (error) setInviteError(error);
            }}
          >
            {({ formProps, reset }) => (
              <form
                {...formProps}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8 }}
                onSubmit={(e) => {
                  formProps.onSubmit(e);
                  reset();
                }}
              >
                {inviteError && (
                  <MessageWrapper>
                    <ErrorMessage>{inviteError}</ErrorMessage>
                  </MessageWrapper>
                )}
                <FormSection>
                  <Field name="email" label="Email" isRequired defaultValue="">
                    {({ fieldProps }) => <TextField {...fieldProps} type="email" />}
                  </Field>
                </FormSection>
                <Field<string, HTMLSelectElement> name="role" label="Role" defaultValue="employee">
                  {({ fieldProps }) => (
                    <SelectField fieldProps={fieldProps}>
                      <option value="employee">employee</option>
                      <option value="admin">admin</option>
                    </SelectField>
                  )}
                </Field>
                <Button type="submit" appearance="primary">
                  Invite
                </Button>
              </form>
            )}
          </Form>
        </>
      )}
    </div>
  );
}
