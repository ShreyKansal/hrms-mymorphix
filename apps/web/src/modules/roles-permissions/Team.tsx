import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useTeamStore } from './store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableRow, TableCell } from '../../components/ui/table';

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
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-[864px] p-6">
      <h1 className="mb-6 text-2xl font-medium text-foreground">Team</h1>

      {error && <p className="text-sm text-text-danger">Could not load: {error}</p>}

      <h3 className="text-sm font-semibold text-foreground">Members</h3>
      <div className="mb-6 mt-2">
        <Table>
          <TableBody>
            {members.length === 0 && !loading && (
              <TableRow>
                <TableCell>No members yet.</TableCell>
              </TableRow>
            )}
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={m.role === 'admin' ? 'success' : 'default'}>{m.role}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pendingInvitations.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
          <div className="mb-6 mt-2">
            <Table>
              <TableBody>
                {pendingInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge>{inv.role}</Badge>
                    </TableCell>
                    <TableCell>invited {new Date(inv.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {role === 'admin' && (
        <>
          <h3 className="text-sm font-semibold text-foreground">Invite someone</h3>
          {inviteError && <p className="mt-2 text-sm text-text-danger">{inviteError}</p>}
          <form
            className="mt-2 flex items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setInviteError(null);
              setInviting(true);
              const form = e.currentTarget;
              const fd = new FormData(form);
              const { error } = await inviteUser(String(fd.get('email') ?? ''), fd.get('role') as 'admin' | 'employee');
              setInviting(false);
              if (error) setInviteError(error);
              else form.reset();
            }}
          >
            <div>
              <Label htmlFor="invite-email" required>
                Email
              </Label>
              <Input id="invite-email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select id="invite-role" name="role" defaultValue="employee" className="w-32">
                <option value="employee">employee</option>
                <option value="admin">admin</option>
              </Select>
            </div>
            <Button type="submit" variant="primary" loading={inviting}>
              Invite
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
