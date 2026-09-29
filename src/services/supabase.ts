import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const hasSupabaseConfig = Boolean(
  url &&
  publishableKey &&
  !url.includes("your-project") &&
  !publishableKey.includes("your-supabase"),
);

export const supabase = hasSupabaseConfig
  ? createClient(url!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
