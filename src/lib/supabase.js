import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseEnv = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseKey.includes('your_key_here')
);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseKey)
  : null;
