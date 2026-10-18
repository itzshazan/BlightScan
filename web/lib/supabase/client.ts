"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

/** Browser client for client components. Session lives in cookies shared with the server. */
export function supabaseBrowser(): SupabaseClient {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
