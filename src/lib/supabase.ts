import { createClient } from '@supabase/supabase-js';

// Accessing environment variables in Vite: import.meta.env.VITE_...
// Note: process.env is usually not available in the browser unless Vite defines it.
// @ts-ignore
const supabaseUrl = (import.meta.env?.VITE_NEXT_PUBLIC_SUPABASE_URL as string) || (process.env.NEXT_PUBLIC_SUPABASE_URL as string);
// @ts-ignore
const supabaseAnonKey = (import.meta.env?.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.');
}

// Browser Client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Note: In Vite Client side, we NEVER use the service role key.
// We will create the service client in the server-side code (server.ts).
