import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { useLeaveStore, available, workingDays, leaveColor, CURRENT_YEAR } from './store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Field } from '../../components/ui/field';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../../components/ui/dialog';

// Apply-for-leave dialog. Its whole reason to exist as a distinct piece is US-1: show the real,
// current balance and the resulting balance *before* submission, so nobody discovers a shortfall
// after the fact. Day count and post-application balance are previewed live client-side; the
// apply_leave() RPC recomputes both authoritatively, so this preview is guidance, never trusted.
export default function ApplyLeaveModal({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const { types, employees, balances, applyLeave } = useLeaveStore();
  const activeTypes = useMemo(() => types.filter((t) => t.is_active), [types]);

  const [employeeId, setEmployeeId] = useState('');
  const [typeId, setTypeId] = useState(activeTypes[0]?.id ?? '');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dayPart, setDayPart] = useState<'full' | 'first_half' | 'second_half'>('full');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = activeTypes.find((t) => t.id === typeId);
  const isHalf = dayPart !== 'full';

  // The employee's live balance for the chosen type, if one exists yet. A brand-new employee with
  // no accrual row shows the type's annual quota as their entitlement-to-be (§24 empty state), not
  // a bare zero that reads like an error.
  const balance = balances.find((b) => b.employee_id === employeeId && b.leave_type_id === typeId);
  const availableDays = balance ? available(balance) : selectedType?.annual_quota ?? 0;

  const requestedDays = useMemo(() => {
    if (!start) return 0;
    if (isHalf) return 0.5;
    return end ? workingDays(start, end) : workingDays(start, start);
  }, [start, end, isHalf]);

  const resulting = availableDays - requestedDays;
  const negativeCap = selectedType?.allow_negative ? selectedType.negative_cap : 0;
  const wouldBlock = requestedDays > 0 && resulting < -negativeCap;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await applyLeave({
      employee_id: employeeId,
      leave_type_id: typeId,
      start_date: start,
      end_date: isHalf ? start : end,
      day_part: dayPart,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) setError(error);
    else onApplied();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
          <DialogDescription>Balance is checked before the request is submitted — no surprises after.</DialogDescription>
        </DialogHeader>
        <form id="apply-leave-form" onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Couldn't submit request">
                {error}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee" htmlFor="al-emp" required>
                <Select id="al-emp" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="" disabled>
                    Select employee…
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.legal_name} ({emp.employee_code})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Leave type" htmlFor="al-type" required>
                <Select id="al-type" required value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                  <option value="" disabled>
                    Select type…
                  </option>
                  {activeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Duration" htmlFor="al-part" className="sm:col-span-2">
                <Select
                  id="al-part"
                  value={dayPart}
                  onChange={(e) => setDayPart(e.target.value as typeof dayPart)}
                  disabled={!selectedType?.allow_half_day}
                >
                  <option value="full">Full day(s)</option>
                  <option value="first_half">First half (0.5)</option>
                  <option value="second_half">Second half (0.5)</option>
                </Select>
              </Field>

              <Field label="From" htmlFor="al-start" required>
                <Input id="al-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="To" htmlFor="al-end" required={!isHalf}>
                <Input
                  id="al-end"
                  type="date"
                  required={!isHalf}
                  value={isHalf ? start : end}
                  min={start || undefined}
                  disabled={isHalf}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>

              <Field
                label="Reason"
                htmlFor="al-reason"
                required={selectedType?.requires_reason}
                className="sm:col-span-2"
              >
                <Input
                  id="al-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={selectedType?.requires_reason ? 'Required for this leave type' : 'Optional'}
                  required={selectedType?.requires_reason}
                />
              </Field>
            </div>

            {/* Live balance preview — US-1's whole point. */}
            {employeeId && selectedType && (
              <div className="rounded-md border border-default bg-surface-100 px-4 py-3 text-sm">
                <div className="mb-2 flex items-center gap-2 text-foreground-lighter">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {selectedType.name} · {CURRENT_YEAR}
                    {!balance && <span className="ml-1 text-xs">(no accrual yet — showing annual quota)</span>}
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-3">
                  <PreviewStat label="Available now" value={availableDays} />
                  <PreviewStat label="This request" value={requestedDays} tone="neutral" />
                  <PreviewStat label="After approval" value={resulting} tone={wouldBlock ? 'bad' : 'good'} />
                </dl>
                {wouldBlock && (
                  <p className="mt-2 text-xs text-destructive-600">
                    {selectedType.allow_negative
                      ? `Exceeds the permitted negative limit of ${selectedType.negative_cap} day(s).`
                      : 'Insufficient balance — this request would go below zero and this type does not allow negative leave.'}
                  </p>
                )}
              </div>
            )}
          </DialogBody>
        </form>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="apply-leave-form" variant="primary" loading={submitting} disabled={wouldBlock}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'good' | 'bad' | 'neutral' }) {
  const color = tone === 'bad' ? 'text-destructive-600' : tone === 'good' ? 'text-foreground' : 'text-foreground';
  return (
    <div>
      <dt className="text-xs text-foreground-lighter">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

// Re-exported so the page can render a consistent colour dot without importing leaveColor twice.
export function LeaveDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: leaveColor(color) }} aria-hidden="true" />;
}
