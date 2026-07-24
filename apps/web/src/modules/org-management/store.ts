import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Department, Designation, Grade } from '../../lib/database.types';

interface OrgManagementState {
  departments: Department[];
  designations: Designation[];
  grades: Grade[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  createDepartment: (name: string, tenantId: string, legalEntityId: string) => Promise<{ error: string | null }>;
  createDesignation: (title: string, tenantId: string) => Promise<{ error: string | null }>;
  createGrade: (code: string, name: string, tenantId: string) => Promise<{ error: string | null }>;
}

// RLS's tenant_isolation policy scopes reads to the caller's own tenant automatically — no
// x-tenant-id filter needed. Inserts still need tenant_id supplied explicitly (no DB default),
// which is why every create* function takes it as a parameter rather than reading it here:
// callers already have it from useAuthStore, matching the pattern in modules/core-hr/store.ts.
export const useOrgManagementStore = create<OrgManagementState>((set, get) => ({
  departments: [],
  designations: [],
  grades: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const [dep, des, gr] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('designations').select('*').order('title'),
      supabase.from('grades').select('*').order('name'),
    ]);
    const error = dep.error?.message ?? des.error?.message ?? gr.error?.message ?? null;
    set({
      departments: dep.data ?? [],
      designations: des.data ?? [],
      grades: gr.data ?? [],
      loading: false,
      error,
    });
  },

  createDepartment: async (name, tenantId, legalEntityId) => {
    const { error } = await supabase
      .from('departments')
      .insert({ name, tenant_id: tenantId, legal_entity_id: legalEntityId });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  createDesignation: async (title, tenantId) => {
    const { error } = await supabase.from('designations').insert({ title, tenant_id: tenantId });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },

  createGrade: async (code, name, tenantId) => {
    const { error } = await supabase.from('grades').insert({ code, name, tenant_id: tenantId });
    if (error) return { error: error.message };
    await get().fetchAll();
    return { error: null };
  },
}));
