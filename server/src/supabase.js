import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables. Copy .env.example to .env.');
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

// Bypasses RLS. Every query made with it MUST be scoped to the authenticated user.
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts);

// Fresh anon client per call so sessions never leak between requests.
export const anonClient = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
