import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Employee, EmploymentAssignment } from '../../lib/database.types';

export interface EmployeeWithCurrentAssignment extends Employee {
  employment_assignments: EmploymentAssignment[];
}

interface EmployeesState {
  employees: EmployeeWithCurrentAssignment[];
  loading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  fetchEmployees: () => Promise<void>;
  createEmployee: (input: {
    legalEntityId: string;
    legalName: string;
    joiningDate: string;
    personalEmail?: string;
    departmentId?: string;
    designationId?: string;
    gradeId?: string;
    managerId?: string;
    dateOfBirth?: string;
    gender?: string;
    panNumber?: string;
    personalPhone?: string;
  }) => Promise<{ error: string | null; employee: Employee | null }>;
  transferEmployee: (input: {
    employeeId: string;
    effectiveFrom: string;
    reasonCode: string;
    departmentId?: string;
    designationId?: string;
    gradeId?: string;
    employmentType?: string;
    managerId?: string;
  }) => Promise<{ error: string | null }>;
  subscribeToChanges: () => void;
  unsubscribe: () => void;
}

// RLS does all the tenant-scoping here — no x-tenant-id header, no manual filter needed,
// unlike the old REST-client version. A query for "all employees" genuinely can only ever
// return the caller's own tenant's rows; Postgres enforces it, not this store.
export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  channel: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    // employment_assignments has two FKs to employees (employee_id and manager_id), so the
    // embed is genuinely ambiguous to PostgREST without a hint — !employee_id picks the right
    // one. Confirmed against the generated relationship types in database.types.ts, which
    // encode both FKs; without the hint, Postgrest would (and did, in an earlier version of
    // this query) reject this at the type level with "more than one relationship was found".
    const { data, error } = await supabase
      .from('employees')
      .select('*, employment_assignments!employee_id(*, departments(*), designations(*), grades(*))')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    // Keep only each employee's current assignment (effective_to is null) for the
    // directory view — full history belongs to the detail page, not the list.
    const withCurrent = (data ?? []).map((emp) => ({
      ...emp,
      employment_assignments: (emp.employment_assignments as EmploymentAssignment[]).filter(
        (a) => a.effective_to === null,
      ),
    }));
    set({ employees: withCurrent, loading: false });
  },

  createEmployee: async ({
    legalEntityId,
    legalName,
    joiningDate,
    personalEmail,
    departmentId,
    designationId,
    gradeId,
    managerId,
    dateOfBirth,
    gender,
    panNumber,
    personalPhone,
  }) => {
    const { data, error } = await supabase.rpc('create_employee', {
      p_legal_entity_id: legalEntityId,
      p_legal_name: legalName,
      p_joining_date: joiningDate,
      p_employment_type: 'Permanent',
      p_personal_email: personalEmail || null,
      p_department_id: departmentId || null,
      p_designation_id: designationId || null,
      p_grade_id: gradeId || null,
      p_manager_id: managerId || null,
      p_date_of_birth: dateOfBirth || null,
      p_gender: gender || null,
      p_pan_number: panNumber || null,
      p_personal_phone: personalPhone || null,
    });
    if (error) return { error: error.message, employee: null };
    await get().fetchEmployees();
    return { error: null, employee: data };
  },

  // Calls the same transfer_employee() RPC verified end-to-end against the live project
  // (effective-dating: closes out the current assignment, inserts a new one). tenant-ownership
  // checks on every id happen server-side (see supabase/migrations/20260724020000_*.sql) — the
  // client doesn't need to re-validate them here.
  transferEmployee: async ({ employeeId, effectiveFrom, reasonCode, departmentId, designationId, gradeId, employmentType, managerId }) => {
    const { error } = await supabase.rpc('transfer_employee', {
      p_employee_id: employeeId,
      p_effective_from: effectiveFrom,
      p_reason_code: reasonCode,
      p_department_id: departmentId || null,
      p_designation_id: designationId || null,
      p_grade_id: gradeId || null,
      p_employment_type: employmentType || null,
      p_manager_id: managerId || null,
    });
    if (error) return { error: error.message };
    await get().fetchEmployees();
    return { error: null };
  },

  // A genuine use of Supabase Realtime, not just an installed-but-unused dependency: any
  // insert/update to this tenant's employees (from this tab, another tab, or eventually
  // another user) refreshes the list live. RLS applies to realtime subscriptions too — a
  // change in a different tenant never reaches this channel at all.
  subscribeToChanges: () => {
    if (get().channel) return; // already subscribed
    const channel = supabase
      .channel('employees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        get().fetchEmployees();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employment_assignments' }, () => {
        get().fetchEmployees();
      })
      .subscribe();
    set({ channel });
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));
