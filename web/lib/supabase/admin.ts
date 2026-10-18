import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

// Service-role client: bypasses RLS. Import ONLY from route handlers (app/api/**), never from
// client components. The key has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin.ts must not be imported in the browser");
}

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!admin) admin = createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
