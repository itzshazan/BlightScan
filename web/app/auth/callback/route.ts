import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/utils";

// Supabase OAuth / email-confirmation / password-reset callback (spec 4.6).
// Exchanges ?code= for a session cookie, then sends the user to ?next= (internal paths only).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeRedirect(searchParams.get("next"));
  const loginError = (msg: string) => NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);

  if (searchParams.get("error")) return loginError(searchParams.get("error_description") ?? "Sign-in was cancelled or failed. Please try again.");
  if (!supabaseEnabled) return NextResponse.redirect(`${origin}${next}`);

  const code = searchParams.get("code");
  if (!code) return loginError("That link is invalid or has expired.");
  const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
  if (error) return loginError("That link is invalid or has expired. Please try again.");
  return NextResponse.redirect(`${origin}${next}`);
}
