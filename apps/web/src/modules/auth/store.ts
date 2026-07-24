import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

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
  role: 'admin' | 'employee' | null;
  loading: boolean;
  initialise: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  provisionTenant: (companyName: string, legalEntityName: string) => Promise<{ error: string | null }>;
  tryAcceptInvitation: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

// Module-level, not store state — this only needs to guard call ordering, not trigger renders.
let refreshSeq = 0;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  tenantId: null,
  legalEntityId: null,
  role: null,
  loading: true,

  initialise: async () => {
    // loading must stay true until BOTH the session and (if a session exists) the tenant
    // lookup have resolved. Setting it false right after getSession() — before awaiting
    // refreshProfile() — created a real window where RequireTenant saw loading:false and
    // tenantId:null simultaneously and redirected an already-tenanted user to /setup, who then
    // got stuck there (nothing pulls them back once tenantId actually resolves moments later).
    // Reproduced via a real page reload against the live project.
    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session) await get().refreshProfile();
    set({ loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) get().refreshProfile();
      else set({ tenantId: null, legalEntityId: null, role: null });
    });
  },

  refreshProfile: async () => {
    // Kept from an earlier, real fix: guards against a genuinely separate issue (concurrent
    // signIn()/onAuthStateChange calls racing) — harmless to keep, doesn't fix what's below.
    const seq = ++refreshSeq;
    const userId = get().session?.user.id;
    if (!userId) return;
    // The actual bug this block fixes: this query used to have no .eq('id', ...) filter at
    // all, relying entirely on RLS to scope it to "my own row". That was true when the SELECT
    // policy was profiles_self_select (id = auth.uid()) — but it was replaced with
    // profiles_tenant_select (tenant_id = get_current_tenant_id()) so the Team page could list
    // every member. The moment a tenant has more than one profile — which Module 21's whole
    // point is to make possible — this query returns multiple rows, .maybeSingle() errors, and
    // since the error was never checked, `profile` silently came back as null and got treated
    // as "no tenant", bouncing an already-tenanted admin to /setup. Reproduced for real: broke
    // on the very first tenant that ever had two members. Explicit .eq('id', ...) fixes it at
    // the source rather than papering over it with a mapped-away error check.
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', userId)
      .maybeSingle();
    if (seq !== refreshSeq) return;
    if (error) {
      console.error('refreshProfile failed:', error.message);
      return;
    }
    if (!profile?.tenant_id) {
      set({ tenantId: null, legalEntityId: null, role: null });
      return;
    }
    // Sprint 1 only ever creates one legal entity at setup time — same simplification as
    // before, now sourced live instead of stashed in localStorage.
    const { data: legalEntity } = await supabase
      .from('legal_entities')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .limit(1)
      .maybeSingle();
    if (seq !== refreshSeq) return;
    set({ tenantId: profile.tenant_id, legalEntityId: legalEntity?.id ?? null, role: profile.role });
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
    set({ session: null, tenantId: null, legalEntityId: null, role: null });
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

  // Called once, on the Setup screen, before showing the "create a company" form — a pending
  // invitation means this account should join an existing tenant, not create a new one.
  // Returns whether a tenant was actually joined, so the caller knows whether to redirect
  // straight into the app or fall back to rendering the create-company form.
  tryAcceptInvitation: async () => {
    const { data, error } = await supabase.rpc('accept_pending_invitation');
    if (error || !data || data.length === 0) return false;
    await get().refreshProfile();
    return true;
  },
}));
