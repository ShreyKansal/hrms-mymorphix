import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Plus, Sparkles, Users, X } from 'lucide-react';
import { useAuthStore } from '../auth/store';
import { useLeaveStore, available, CURRENT_YEAR, type RequestRow, type BalanceRow } from './store';
import ApplyLeaveModal, { LeaveDot } from './ApplyLeaveModal';
import LeaveTypesTab from './LeaveTypesTab';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Badge, type BadgeProps } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Avatar } from '../../components/ui/avatar';
import { PageContainer, PageHeader, EmptyState } from '../../components/ui/page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../../components/ui/dialog';

const STATUS_VARIANT: Record<RequestRow['status'], BadgeProps['variant']> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'default',
  withdrawn: 'secondary',
};

const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fmtRange = (r: RequestRow) => (r.start_date === r.end_date ? fmtDate(r.start_date) : `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`);

export default function LeaveManagement() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';
  const { types, requests, loading, error, fetchAll, seedStandardTypes } = useLeaveStore();
  const [applying, setApplying] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasTypes = types.length > 0;
  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <PageContainer size="full">
      <PageHeader
        title="Leave"
        description={`Apply, approve, and track leave balances for ${CURRENT_YEAR}.`}
        actions={
          <Button variant="primary" onClick={() => setApplying(true)} disabled={!hasTypes}>
            <Plus className="h-4 w-4" />
            Apply for leave
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" title="Couldn't load leave data" className="mb-6">
          {error}
        </Alert>
      )}

      {!hasTypes && !loading ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="Set up leave to get started"
          description={
            isAdmin
              ? 'Add your leave types and yearly quotas — start from a standard Indian set (Earned, Casual, Sick, Unpaid) or configure your own.'
              : 'An administrator needs to configure leave types before anyone can apply.'
          }
          action={
            isAdmin ? (
              <Button
                variant="primary"
                loading={seeding}
                onClick={async () => {
                  setSeeding(true);
                  await seedStandardTypes();
                  setSeeding(false);
                }}
              >
                <Sparkles className="h-4 w-4" />
                Add standard leave types
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">
              Requests{pending.length > 0 && <span className="ml-1.5 rounded-full bg-warning-200 px-1.5 text-xs text-warning-600">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="types">Leave types</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <RequestsTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="balances">
            <BalancesTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="types">
            <LeaveTypesTab />
          </TabsContent>
        </Tabs>
      )}

      {applying && <ApplyLeaveModal onClose={() => setApplying(false)} onApplied={() => setApplying(false)} />}
    </PageContainer>
  );
}

// ── Requests: approval inbox (with team-calendar context) + full history ────────────────────────
function RequestsTab({ isAdmin }: { isAdmin: boolean }) {
  const { requests, decide, cancel } = useLeaveStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<RequestRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | RequestRow['status']>('all');

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const filtered = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);

  // US-2 team-calendar context: for a pending request, who else (approved) is out over the same
  // dates. Overlap = ranges intersect and it's a different person.
  const overlapsFor = (r: RequestRow) =>
    approved.filter((a) => a.employee_id !== r.employee_id && a.start_date <= r.end_date && a.end_date >= r.start_date);

  const act = async (fn: () => Promise<{ error: string | null }>, id: string) => {
    setBusy(id);
    await fn();
    setBusy(null);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Pending approval {pending.length > 0 && <span className="text-foreground-lighter">· {pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <Card className="px-4 py-8 text-center text-sm text-foreground-lighter">Nothing waiting for a decision.</Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const overlaps = overlapsFor(r);
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={r.employees?.legal_name ?? '—'} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                          <span className="font-medium text-foreground">{r.employees?.legal_name ?? 'Unknown'}</span>
                          <span className="inline-flex items-center gap-1.5 text-foreground-lighter">
                            <LeaveDot color={r.leave_types?.color ?? 'slate'} />
                            {r.leave_types?.name ?? 'Leave'}
                          </span>
                        </div>
                        <div className="mt-0.5 text-sm text-foreground-lighter">
                          {fmtRange(r)} · <span className="tabular-nums">{r.days}</span> day{r.days === 1 ? '' : 's'}
                          {r.day_part !== 'full' && ' (half-day)'}
                        </div>
                        {r.reason && <p className="mt-1 text-sm text-foreground-light">“{r.reason}”</p>}
                        {overlaps.length > 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-lighter">
                            <Users className="h-3.5 w-3.5" />
                            Also out then: {overlaps.map((o) => o.employees?.legal_name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button variant="primary" size="small" loading={busy === r.id} onClick={() => act(() => decide(r.id, true), r.id)}>
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button variant="outline" size="small" disabled={busy === r.id} onClick={() => setRejecting(r)}>
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="small" loading={busy === r.id} onClick={() => act(() => cancel(r.id), r.id)}>
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-foreground">All requests</h2>
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-foreground-lighter">
                    No requests to show.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <Avatar name={r.employees?.legal_name ?? '—'} size="xs" />
                        {r.employees?.legal_name ?? 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground-lighter">
                      <span className="flex items-center gap-1.5">
                        <LeaveDot color={r.leave_types?.color ?? 'slate'} />
                        {r.leave_types?.code ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground-light">{fmtRange(r)}</TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">{r.days}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(r.status === 'pending' || r.status === 'approved') && (
                        <Button variant="ghost" size="tiny" loading={busy === r.id} onClick={() => act(() => cancel(r.id), r.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {rejecting && (
        <RejectDialog
          request={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => setRejecting(null)}
        />
      )}
    </div>
  );
}

function RejectDialog({ request, onClose, onDone }: { request: RequestRow; onClose: () => void; onDone: () => void }) {
  const decide = useLeaveStore((s) => s.decide);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await decide(request.id, false, note.trim() || undefined);
    setSubmitting(false);
    if (error) setError(error);
    else onDone();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject leave request</DialogTitle>
          <DialogDescription>
            {request.employees?.legal_name} · {fmtRange(request)}. The held balance is released back.
          </DialogDescription>
        </DialogHeader>
        <form id="reject-form" onSubmit={submit}>
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Couldn't reject">
                {error}
              </Alert>
            )}
            <Field label="Reason (shared with the employee)" htmlFor="reject-note">
              <Input id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional but recommended" autoFocus />
            </Field>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reject-form" variant="destructive" loading={submitting}>
            Reject request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Balances ────────────────────────────────────────────────────────────────────────────────────
function BalancesTab({ isAdmin }: { isAdmin: boolean }) {
  const { balances, employees, loading } = useLeaveStore();
  const [adjusting, setAdjusting] = useState<BalanceRow | 'new' | null>(null);

  const empName = (id: string) => employees.find((e) => e.id === id)?.legal_name ?? 'Unknown';
  const sorted = useMemo(
    () => [...balances].sort((a, b) => empName(a.employee_id).localeCompare(empName(b.employee_id)) || (a.leave_types?.name ?? '').localeCompare(b.leave_types?.name ?? '')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balances, employees],
  );

  if (balances.length === 0 && !loading) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-5 w-5" />}
        title="No balances yet"
        description="A balance appears once someone applies for that leave type, or when an admin grants an opening balance."
        action={isAdmin ? <Button variant="primary" onClick={() => setAdjusting('new')}><Plus className="h-4 w-4" />Grant / adjust balance</Button> : undefined}
      />
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button variant="default" onClick={() => setAdjusting('new')}>
            <Plus className="h-4 w-4" />
            Grant / adjust balance
          </Button>
        </div>
      )}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Entitled</TableHead>
              <TableHead className="text-right">Adjust.</TableHead>
              <TableHead className="text-right">Taken</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Available</TableHead>
              {isAdmin && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <Avatar name={empName(b.employee_id)} size="xs" />
                    {empName(b.employee_id)}
                  </span>
                </TableCell>
                <TableCell className="text-foreground-lighter">
                  <span className="flex items-center gap-1.5">
                    <LeaveDot color={b.leave_types?.color ?? 'slate'} />
                    {b.leave_types?.name ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground-lighter">{b.entitled}</TableCell>
                <TableCell className="text-right tabular-nums text-foreground-lighter">{b.adjustment !== 0 ? (b.adjustment > 0 ? `+${b.adjustment}` : b.adjustment) : '—'}</TableCell>
                <TableCell className="text-right tabular-nums text-foreground-lighter">{b.taken}</TableCell>
                <TableCell className="text-right tabular-nums text-foreground-lighter">{b.pending}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-foreground">{available(b)}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="tiny" onClick={() => setAdjusting(b)}>
                      Adjust
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {adjusting && <AdjustBalanceDialog preset={adjusting === 'new' ? null : adjusting} onClose={() => setAdjusting(null)} />}
    </>
  );
}

function AdjustBalanceDialog({ preset, onClose }: { preset: BalanceRow | null; onClose: () => void }) {
  const { types, employees, adjustBalance } = useLeaveStore();
  const [employeeId, setEmployeeId] = useState(preset?.employee_id ?? '');
  const [typeId, setTypeId] = useState(preset?.leave_type_id ?? types[0]?.id ?? '');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const locked = preset !== null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await adjustBalance(employeeId, typeId, Number(delta), reason.trim());
    setSubmitting(false);
    if (error) setError(error);
    else onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locked ? 'Adjust balance' : 'Grant / adjust balance'}</DialogTitle>
          <DialogDescription>A signed change to the balance — positive to grant days, negative to deduct. A reason is required.</DialogDescription>
        </DialogHeader>
        <form id="adjust-form" onSubmit={submit}>
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Couldn't adjust balance">
                {error}
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee" htmlFor="adj-emp" required>
                <Select id="adj-emp" required value={employeeId} disabled={locked} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.legal_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Leave type" htmlFor="adj-type" required>
                <Select id="adj-type" required value={typeId} disabled={locked} onChange={(e) => setTypeId(e.target.value)}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Change (days)" htmlFor="adj-delta" required description="e.g. 2 or -1.5">
                <Input id="adj-delta" type="number" step="0.5" required value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Reason" htmlFor="adj-reason" required className="sm:col-span-2">
                <Input id="adj-reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Opening balance migrated from previous system" />
              </Field>
            </div>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-form" variant="primary" loading={submitting} disabled={!employeeId || !typeId || delta === ''}>
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
