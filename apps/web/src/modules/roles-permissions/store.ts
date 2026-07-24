import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Profile, Invitation } from '../../lib/database.types';

interface TeamState {
  members: Profile[];
  pendingInvitations: Invitation[];
  loading: boolean;
  error: string | null;
  fetchTeam: () => Promise<void>;
  inviteUser: (email: string, role: 'admin' | 'employee') => Promise<{ error: string | null }>;
}

// RLS scopes both queries to the caller's own tenant automatically (profiles_tenant_select,
// invitations' tenant_isolation) — no manual tenant filter needed, same as every other store.
export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  pendingInvitations: [],
  loading: false,
  error: null,

  fetchTeam: async () => {
    set({ loading: true, error: null });
    const [membersRes, invitationsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('email'),
      supabase.from('invitations').select('*').is('accepted_at', null).order('created_at', { ascending: false }),
    ]);
    set({
      members: membersRes.data ?? [],
      pendingInvitations: invitationsRes.data ?? [],
      loading: false,
      error: membersRes.error?.message ?? invitationsRes.error?.message ?? null,
    });
  },

  // invite_user() itself re-checks the caller is an admin server-side — this isn't the only
  // enforcement, just lets a non-admin see a clear error instead of a silently-ignored click
  // (the page is also nav-gated to admins, so reaching this at all means something odd
  // happened client-side, not a real attempt to bypass anything).
  inviteUser: async (email, role) => {
    const { error } = await supabase.rpc('invite_user', { p_email: email, p_role: role });
    if (error) return { error: error.message };
    await get().fetchTeam();
    return { error: null };
  },
}));
