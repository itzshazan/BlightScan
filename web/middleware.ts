import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "@/lib/supabase/env";

const DEMO_ROLE_COOKIE = "bs_demo_role";
const PROTECTED = ["/dashboard", "/scan", "/history", "/fields", "/spread-map", "/profile", "/admin"];
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];
const ADMIN_ONLY = ["/admin/users", "/admin/messages"];

const match = (pathname: string, list: string[]) => list.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Same rules for both modes: returns a redirect URL, or null to continue. */
function decide(req: NextRequest, signedIn: boolean, role: string | null): URL | null {
  const { pathname, search } = req.nextUrl;
  if (match(pathname, PROTECTED) && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return url;
  }
  if (match(pathname, GUEST_ONLY) && signedIn) return new URL("/dashboard", req.url);
  if (pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "expert") return new URL("/dashboard", req.url);
    // Experts only get the review queue.
    if (role === "expert" && (pathname === "/admin" || match(pathname, ADMIN_ONLY))) return new URL("/admin/scans", req.url);
  }
  return null;
}

export async function middleware(req: NextRequest) {
  if (!supabaseEnabled) {
    const role = req.cookies.get(DEMO_ROLE_COOKIE)?.value ?? null;
    const to = decide(req, !!role, role);
    return to ? NextResponse.redirect(to) : NextResponse.next();
  }

  // Supabase: refresh the session cookie on every request, then apply the same rules.
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  const { pathname } = req.nextUrl;
  if (user && (match(pathname, PROTECTED) || match(pathname, GUEST_ONLY))) {
    const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
    if (profile?.status === "deactivated") {
      await supabase.auth.signOut();
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "This account has been deactivated.");
      return withCookies(NextResponse.redirect(url), res);
    }
    role = profile?.role ?? null;
  }

  const to = decide(req, !!user, role);
  return to ? withCookies(NextResponse.redirect(to), res) : res;
}

// Keep refreshed auth cookies when we redirect.
function withCookies(redirect: NextResponse, from: NextResponse) {
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
