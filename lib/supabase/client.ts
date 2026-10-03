import { createClient } from '@supabase/supabase-js';

// Resolve Supabase credentials from .env / Vercel env vars (injected via `define` in vite.config.ts)
export const getSupabaseConfig = () => {
  const url: string = import.meta.env.SUPABASE_URL || '';
  const key: string = import.meta.env.SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    console.warn(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.'
    );
  }

  return { url, key, isConfigured: Boolean(url && key) };
};

const config = getSupabaseConfig();

export const supabase = createClient(
  config.url || 'http://localhost',
  config.key || 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export const isSupabaseLive = () => config.isConfigured;
export const getActiveSupabaseUrl = () => config.url;
