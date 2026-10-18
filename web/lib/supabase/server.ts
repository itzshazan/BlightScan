import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Server client for route handlers and server components; acts as the signed-in user (RLS applies). */
export function supabaseServer() {
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only. Middleware refreshes the session instead.
        }
      },
    },
  });
}
