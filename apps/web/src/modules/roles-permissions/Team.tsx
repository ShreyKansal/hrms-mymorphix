import { useEffect, useState } from 'react';
import { Clock, Send } from 'lucide-react';
import { useAuthStore } from '../auth/store';
import { useTeamStore } from './store';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { PageContainer, PageHeader, PageSection, Skeleton } from '../../components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

// Module 21 (Roles and Permissions), first slice — enough to make a second user possible and to
// give "admin" vs "employee" a real, enforced meaning. The full composable role/scope model,
// segregation-of-duties, and access reviews are deferred until something concrete needs them.
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
    <PageContainer>
      <PageHeader title="Team" description="People with access to this workspace, and their roles." />

      {error && (
        <Alert variant="destructive" title="Couldn't load your team" className="mb-6">
          {error}
        </Alert>
      )}

      <PageSection title="Members" description="Everyone who can sign in to this workspace.">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && members.length === 0 ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="text-foreground-lighter">
                    No members yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.email ?? m.id} size="sm" />
                        <span className="font-medium text-foreground">{m.email ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={m.role === 'admin' ? 'success' : 'default'} className="capitalize">
                        {m.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </PageSection>

      {pendingInvitations.length > 0 && (
        <PageSection title="Pending invitations" description="Invited but not yet signed up.">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-foreground-lighter" />
                        {inv.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {inv.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground-lighter">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </PageSection>
      )}

      {role === 'admin' && (
        <PageSection title="Invite someone" description="Send an invitation by email. They'll join this workspace when they sign up.">
          <Card>
            <CardContent>
              {inviteError && (
                <Alert variant="destructive" title="Couldn't send invitation" className="mb-4">
                  {inviteError}
                </Alert>
              )}
              <form
                className="flex flex-wrap items-end gap-3"
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
                <Field label="Email" htmlFor="invite-email" required className="min-w-[16rem] flex-1">
                  <Input id="invite-email" name="email" type="email" required placeholder="teammate@company.com" />
                </Field>
                <Field label="Role" htmlFor="invite-role">
                  <Select id="invite-role" name="role" defaultValue="employee" className="w-36">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Field>
                <Button type="submit" variant="primary" loading={inviting}>
                  <Send className="h-4 w-4" />
                  Send invite
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-foreground-lighter">
              Admins can manage employees, the organisation, and the team. Employees have read access scoped by policy.
            </CardFooter>
          </Card>
        </PageSection>
      )}
    </PageContainer>
  );
}
