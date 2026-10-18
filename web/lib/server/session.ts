import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseEnabled } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
export const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

type Session = { supabase: ReturnType<typeof supabaseServer>; user: User; role: UserRole };

/**
 * Resolves the signed-in user and their role, or returns the error response to send.
 * Usage: const s = await requireUser(); if (s instanceof NextResponse) return s;
 */
export async function requireUser(roles?: UserRole[]): Promise<Session | NextResponse> {
  if (!supabaseEnabled) return fail(503, "Supabase is not configured");
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
  if (!profile || profile.status === "deactivated") return fail(403, "Account is deactivated");
  if (roles && !roles.includes(profile.role)) return fail(403, "Forbidden");
  return { supabase, user, role: profile.role as UserRole };
}
