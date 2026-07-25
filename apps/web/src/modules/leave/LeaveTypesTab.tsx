import { useState, type FormEvent } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useAuthStore } from '../auth/store';
import { useLeaveStore, LEAVE_COLORS, type LeaveTypeInput } from './store';
import type { LeaveType } from '../../lib/database.types';
import { LeaveDot } from './ApplyLeaveModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/page';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../../components/ui/dialog';

// Module 5's flagship story (US-3): HR configures leave types — quota, paid/unpaid, half-day,
// negative-leave permission — without engineering involvement. Writes go through the admin-gated
// upsert_leave_type() RPC; non-admins get a read-only view (the button-hiding is UX only, the RPC
// is the real gate).
export default function LeaveTypesTab() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';
  const { types, loading } = useLeaveStore();
  const [editing, setEditing] = useState<LeaveType | 'new' | null>(null);

  if (types.length === 0 && !loading) {
    return (
      <EmptyState
        title="No leave types configured"
        description={isAdmin ? 'Add your leave types and their yearly quotas. You can start from a standard Indian set on the Requests tab.' : 'An administrator hasn’t configured leave types yet.'}
        action={isAdmin ? <Button variant="primary" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />New leave type</Button> : undefined}
      />
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            New leave type
          </Button>
        </div>
      )}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Leave type</TableHead>
              <TableHead className="w-20">Code</TableHead>
              <TableHead className="w-24 text-right">Quota/yr</TableHead>
              <TableHead className="w-20">Paid</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead className="w-24">Status</TableHead>
              {isAdmin && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <LeaveDot color={t.color} />
                    {t.name}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground-lighter">{t.code}</TableCell>
                <TableCell className="text-right tabular-nums text-foreground">{t.annual_quota}</TableCell>
                <TableCell>
                  {t.is_paid ? <Badge variant="secondary">Paid</Badge> : <Badge variant="warning">Unpaid</Badge>}
                </TableCell>
                <TableCell className="text-foreground-lighter">
                  <span className="flex flex-wrap gap-1">
                    {t.allow_half_day && <Badge variant="secondary">Half-day</Badge>}
                    {t.allow_negative && <Badge variant="secondary">Negative ≤ {t.negative_cap}</Badge>}
                    {t.requires_reason && <Badge variant="secondary">Reason req.</Badge>}
                  </span>
                </TableCell>
                <TableCell>
                  {t.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button variant="ghost" size="tiny" onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editing && <LeaveTypeForm existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

const COLOR_KEYS = Object.keys(LEAVE_COLORS);

function LeaveTypeForm({ existing, onClose }: { existing: LeaveType | null; onClose: () => void }) {
  const upsertType = useLeaveStore((s) => s.upsertType);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [allowNegative, setAllowNegative] = useState(existing?.allow_negative ?? false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const input: LeaveTypeInput = {
      id: existing?.id,
      name: String(fd.get('name') ?? ''),
      code: String(fd.get('code') ?? ''),
      annual_quota: Number(fd.get('annual_quota') ?? 0),
      color: String(fd.get('color') ?? 'slate'),
      is_paid: fd.get('is_paid') === 'on',
      allow_half_day: fd.get('allow_half_day') === 'on',
      allow_negative: allowNegative,
      negative_cap: allowNegative ? Number(fd.get('negative_cap') ?? 0) : 0,
      requires_reason: fd.get('requires_reason') === 'on',
      is_active: fd.get('is_active') === 'on',
    };
    const { error } = await upsertType(input);
    setSubmitting(false);
    if (error) setError(error);
    else onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit leave type' : 'New leave type'}</DialogTitle>
          <DialogDescription>Policy takes effect immediately — no deployment needed.</DialogDescription>
        </DialogHeader>
        <form id="leave-type-form" onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Couldn't save leave type">
                {error}
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="lt-name" required className="sm:col-span-2">
                <Input id="lt-name" name="name" required defaultValue={existing?.name ?? ''} placeholder="e.g. Earned Leave" autoFocus />
              </Field>
              <Field label="Code" htmlFor="lt-code" required>
                <Input id="lt-code" name="code" required defaultValue={existing?.code ?? ''} placeholder="EL" />
              </Field>
              <Field label="Annual quota (days)" htmlFor="lt-quota" required>
                <Input id="lt-quota" name="annual_quota" type="number" min="0" step="0.5" required defaultValue={existing?.annual_quota ?? 0} />
              </Field>
              <Field label="Colour" htmlFor="lt-color">
                <Select id="lt-color" name="color" defaultValue={existing?.color ?? 'blue'}>
                  {COLOR_KEYS.map((c) => (
                    <option key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end pb-2">
                <CheckboxField name="is_paid" label="Paid leave" defaultChecked={existing ? existing.is_paid : true} />
              </div>

              <CheckboxField name="allow_half_day" label="Allow half-day" defaultChecked={existing ? existing.allow_half_day : true} />
              <CheckboxField name="requires_reason" label="Require a reason" defaultChecked={existing?.requires_reason ?? false} />

              <CheckboxField
                name="allow_negative"
                label="Allow negative balance"
                defaultChecked={allowNegative}
                onChange={(v) => setAllowNegative(v)}
              />
              <Field label="Negative cap (days)" htmlFor="lt-negcap">
                <Input id="lt-negcap" name="negative_cap" type="number" min="0" step="0.5" defaultValue={existing?.negative_cap ?? 0} disabled={!allowNegative} />
              </Field>

              <div className="sm:col-span-2">
                <CheckboxField name="is_active" label="Active" defaultChecked={existing ? existing.is_active : true} />
              </div>
            </div>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="leave-type-form" variant="primary" loading={submitting}>
            {existing ? 'Save changes' : 'Create leave type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A minimal labelled checkbox — there's no design-system checkbox primitive yet, so this is a
// local, consistently-styled native input (brand accent) rather than pulling in a new dependency.
function CheckboxField({
  name,
  label,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-strong accent-[#3ecf8e]"
      />
      {label}
    </label>
  );
}
