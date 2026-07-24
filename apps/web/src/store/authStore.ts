import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Replaces the old Sprint-1 stand-in (a raw tenant ID kept in localStorage, sent as an
// x-tenant-id header — see the removed apps/api/src/common/tenant-id.decorator.ts). Real
// auth now: Supabase Auth owns the session, and tenant_id lives in `profiles`, resolved
// server-side by every RLS policy via get_current_tenant_id() — the client never needs to
// know or send its own tenant ID at all, which is a strictly stronger security property
// than the header-based approach it replaces (a client can't even attempt to lie about
// which tenant it's acting as, because it never states one).
interface AuthState {
  session: Session | null;
  tenantId: string | null;
  legalEntityId: string | null;
  loading: boolean;
  initialise: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  provisionTenant: (companyName: string, legalEntityName: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  tenantId: null,
  legalEntityId: null,
  loading: true,

  initialise: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, loading: false });
    if (data.session) await get().refreshProfile();

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) get().refreshProfile();
      else set({ tenantId: null, legalEntityId: null });
    });
  },

  refreshProfile: async () => {
    const { data: profile } = await supabase.from('profiles').select('tenant_id').single();
    if (!profile?.tenant_id) {
      set({ tenantId: null, legalEntityId: null });
      return;
    }
    // Sprint 1 only ever creates one legal entity at setup time — same simplification as
    // before, now sourced live instead of stashed in localStorage.
    const { data: legalEntity } = await supabase
      .from('legal_entities')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .limit(1)
      .single();
    set({ tenantId: profile.tenant_id, legalEntityId: legalEntity?.id ?? null });
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) await get().refreshProfile();
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, tenantId: null, legalEntityId: null });
  },

  provisionTenant: async (companyName, legalEntityName) => {
    const { error } = await supabase.rpc('provision_tenant', {
      company_name: companyName,
      legal_entity_name: legalEntityName,
    });
    if (error) return { error: error.message };
    await get().refreshProfile();
    return { error: null };
  },
}));
