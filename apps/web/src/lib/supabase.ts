import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and immediately, not with a confusing runtime error three clicks later —
  // see apps/web/.env.example for what needs to be set.
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy apps/web/.env.example to ' +
      'apps/web/.env and fill in your Supabase project values (Project Settings → API).',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
