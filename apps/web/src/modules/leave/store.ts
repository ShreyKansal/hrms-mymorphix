import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { LeaveType, LeaveBalance, LeaveRequest } from '../../lib/database.types';

// The leave-year the whole module operates in. A configurable leave-year that differs from the
// calendar year (§7.3) is part of the year-end-closure build that isn't in this slice — until
// then the calendar year is the leave year.
export const CURRENT_YEAR = new Date().getFullYear();

// Lightweight employee shape — enough to pick who a request/balance is for without pulling the
// whole Core-HR record. Kept local so the Leave module doesn't depend on Core-HR's store.
export type LeaveEmployee = { id: string; legal_name: string; employee_code: string };

// Requests and balances are read back with their type (and, for requests, employee) embedded, so
// the UI can render names/colours without a second lookup. PostgREST returns each embed as a
// single nested object here (child → parent direction), per the Relationships arrays in
// database.types.ts.
export type RequestRow = LeaveRequest & {
  leave_types: Pick<LeaveType, 'name' | 'code' | 'color' | 'is_paid'> | null;
  employees: Pick<LeaveEmployee, 'legal_name' | 'employee_code'> | null;
};
export type BalanceRow = LeaveBalance & {
  leave_types: Pick<LeaveType, 'name' | 'code' | 'color'> | null;
};

// Available = entitled + adjustment - taken - pending. The single source of truth for "can this
// person take this leave?" — mirrors the arithmetic the RPCs enforce server-side.
export function available(b: Pick<LeaveBalance, 'entitled' | 'adjustment' | 'taken' | 'pending'>): number {
  return b.entitled + b.adjustment - b.taken - b.pending;
}

// Inclusive working-day count (Mon–Fri) — the client-side mirror of leave_working_days() in SQL,
// used only for the live day/balance preview while applying. The server recomputes authoritatively
// on submit, so this never needs to be trusted, just close enough to preview accurately.
export function workingDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  let count = 0;
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

// Named leave-type colours → concrete hex, so a type's dot/badge reads the same everywhere. Keys
// match the `color` column's allowed vocabulary; anything unknown falls back to slate.
export const LEAVE_COLORS: Record<string, string> = {
  slate: '#64748b',
  blue: '#0ea5e9',
  green: '#3ecf8e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  teal: '#14b8a6',
};
export function leaveColor(name: string): string {
  return LEAVE_COLORS[name] ?? LEAVE_COLORS.slate;
}

export type LeaveTypeInput = {
  id?: string;
  name: string;
  code: string;
  annual_quota: number;
  color?: string;
  is_paid?: boolean;
  allow_half_day?: boolean;
  allow_negative?: boolean;
  negative_cap?: number;
  requires_reason?: boolean;
  is_active?: boolean;
};

export type ApplyInput = {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  day_part?: 'full' | 'first_half' | 'second_half';
  reason?: string | null;
};

type Result = { error: string | null };

interface LeaveState {
  types: LeaveType[];
  employees: LeaveEmployee[];
  requests: RequestRow[];
  balances: BalanceRow[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  applyLeave: (input: ApplyInput) => Promise<Result>;
  decide: (requestId: string, approve: boolean, note?: string) => Promise<Result>;
  cancel: (requestId: string) => Promise<Result>;
  upsertType: (input: LeaveTypeInput) => Promise<Result>;
  adjustBalance: (employeeId: string, leaveTypeId: string, delta: number, reason: string) => Promise<Result>;
  seedStandardTypes: () => Promise<Result>;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  types: [],
  employees: [],
  requests: [],
  balances: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const [types, employees, requests, balances] = await Promise.all([
      supabase.from('leave_types').select('*').order('name'),
      supabase.from('employees').select('id, legal_name, employee_code').order('legal_name'),
      supabase
        .from('leave_requests')
        .select('*, leave_types(name, code, color, is_paid), employees(legal_name, employee_code)')
        .order('created_at', { ascending: false }),
      supabase
        .from('leave_balances')
        .select('*, leave_types(name, code, color)')
        .eq('year', CURRENT_YEAR),
    ]);
    const error =
      types.error?.message ?? employees.error?.message ?? requests.error?.message ?? balances.error?.message ?? null;
    set({
      types: types.data ?? [],
      employees: employees.data ?? [],
      requests: (requests.data as RequestRow[]) ?? [],
      balances: (balances.data as BalanceRow[]) ?? [],
      loading: false,
      error,
    });
  },

  applyLeave: async (input) => {
    const { error } = await supabase.rpc('apply_leave', {
      p_employee_id: input.employee_id,
      p_leave_type_id: input.leave_type_id,
      p_start_date: input.start_date,
      p_end_date: input.end_date,
      p_day_part: input.day_part ?? 'full',
      p_reason: input.reason ?? null,
    });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  decide: async (requestId, approve, note) => {
    const { error } = await supabase.rpc('decide_leave', {
      p_request_id: requestId,
      p_approve: approve,
      p_note: note ?? null,
    });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  cancel: async (requestId) => {
    const { error } = await supabase.rpc('cancel_leave', { p_request_id: requestId });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  upsertType: async (input) => {
    const { error } = await supabase.rpc('upsert_leave_type', {
      p_id: input.id ?? null,
      p_name: input.name,
      p_code: input.code,
      p_annual_quota: input.annual_quota,
      p_color: input.color ?? 'slate',
      p_is_paid: input.is_paid ?? true,
      p_allow_half_day: input.allow_half_day ?? true,
      p_allow_negative: input.allow_negative ?? false,
      p_negative_cap: input.negative_cap ?? 0,
      p_requires_reason: input.requires_reason ?? false,
      p_is_active: input.is_active ?? true,
    });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  adjustBalance: async (employeeId, leaveTypeId, delta, reason) => {
    const { error } = await supabase.rpc('adjust_leave_balance', {
      p_employee_id: employeeId,
      p_leave_type_id: leaveTypeId,
      p_year: CURRENT_YEAR,
      p_delta: delta,
      p_reason: reason,
    });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  // Convenience for a fresh tenant: create the four leave types most Indian companies run, so the
  // module is usable without first hand-configuring policy. Runs sequentially (each is a distinct
  // insert) and stops on the first failure so a partial-seed error is surfaced honestly.
  seedStandardTypes: async () => {
    const defaults: LeaveTypeInput[] = [
      { name: 'Earned Leave', code: 'EL', annual_quota: 18, color: 'blue' },
      { name: 'Casual Leave', code: 'CL', annual_quota: 12, color: 'green' },
      { name: 'Sick Leave', code: 'SL', annual_quota: 12, color: 'amber', requires_reason: true },
      { name: 'Unpaid Leave', code: 'LOP', annual_quota: 0, color: 'slate', is_paid: false, allow_negative: true, negative_cap: 30 },
    ];
    for (const d of defaults) {
      const { error } = await get().upsertType(d);
      if (error) return { error };
    }
    return { error: null };
  },
}));
