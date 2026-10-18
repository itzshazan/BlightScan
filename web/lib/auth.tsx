"use client";
// Auth for both modes.
//   Supabase: email/password + Google via Supabase Auth; role read from profiles.
//   Demo:     a role cookie that middleware.ts reads; any email/password works.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseBrowser } from "./supabase/client";
import { supabaseEnabled } from "./supabase/env";
import { clearCache, refresh, updateProfile, updateUser } from "./store";
import type { UserRole } from "./types";

export const ROLE_COOKIE = "bs_demo_role";

interface AuthValue {
  user: { id: string | null; role: UserRole } | null;
  ready: boolean;
  mode: "demo" | "supabase";
  signIn: (input: { email: string; password: string; remember?: boolean; fullName?: string }) => Promise<void>;
  /** Returns true when the user must confirm their email before logging in. */
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<boolean>;
  signInWithGoogle: (next: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string, currentPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const origin = () => window.location.origin;

function readDemoRole(): UserRole | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${ROLE_COOKIE}=([^;]+)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return v === "farmer" || v === "expert" || v === "admin" ? v : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthValue["user"]>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled) {
      const role = readDemoRole();
      setUser(role ? { id: null, role } : null);
      setReady(true);
      return;
    }
    const sb = supabaseBrowser();
    const load = async (uid: string | null) => {
      if (!uid) {
        setUser(null);
        clearCache();
      } else {
        const { data } = await sb.from("profiles").select("role").eq("id", uid).single();
        setUser({ id: uid, role: (data?.role as UserRole) ?? "farmer" });
      }
      setReady(true);
    };
    sb.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void load(session?.user.id ?? null);
        if (event === "SIGNED_IN") void refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback<AuthValue["signIn"]>(async ({ email, password, remember = true, fullName }) => {
    if (supabaseEnabled) {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password" : error.message);
      return;
    }
    // Demo: the email decides the role so every view can be tried.
    await new Promise((r) => setTimeout(r, 600));
    const role: UserRole = /admin/i.test(email) ? "admin" : /expert/i.test(email) ? "expert" : "farmer";
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; samesite=lax${remember ? "; max-age=2592000" : ""}`;
    setUser({ id: null, role });
    const patch = { role, email, ...(fullName ? { full_name: fullName } : {}) };
    await updateProfile(patch);
    await updateUser("demo-farmer", patch);
  }, []);

  const signUp = useCallback<AuthValue["signUp"]>(async ({ fullName, email, password }) => {
    if (!supabaseEnabled) {
      await new Promise((r) => setTimeout(r, 700));
      return true;
    }
    const { data, error } = await supabaseBrowser().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${origin()}/auth/callback` },
    });
    if (error) throw new Error(error.message);
    return !data.session;
  }, []);

  const signInWithGoogle = useCallback<AuthValue["signInWithGoogle"]>(
    async (next) => {
      if (!supabaseEnabled) return signIn({ email: "farmer@demo.blightscan", password: "demo" });
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw new Error(error.message);
    },
    [signIn]
  );

  const sendPasswordReset = useCallback<AuthValue["sendPasswordReset"]>(async (email) => {
    if (!supabaseEnabled) return void (await new Promise((r) => setTimeout(r, 700)));
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?next=/reset-password` });
    // Don't reveal whether the account exists; only surface rate-limit style errors.
    if (error && error.status === 429) throw new Error("Too many requests. Try again in a few minutes.");
  }, []);

  const updatePassword = useCallback<AuthValue["updatePassword"]>(async (password, currentPassword) => {
    if (!supabaseEnabled) return void (await new Promise((r) => setTimeout(r, 600)));
    const sb = supabaseBrowser();
    if (currentPassword) {
      const { data } = await sb.auth.getUser();
      const { error } = await sb.auth.signInWithPassword({ email: data.user?.email ?? "", password: currentPassword });
      if (error) throw new Error("Your current password is incorrect");
    }
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    if (supabaseEnabled) {
      await supabaseBrowser().auth.signOut();
    } else {
      document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
    }
    setUser(null);
    clearCache();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, ready, mode: supabaseEnabled ? "supabase" : "demo", signIn, signUp, signInWithGoogle, sendPasswordReset, updatePassword, logout }),
    [user, ready, signIn, signUp, signInWithGoogle, sendPasswordReset, updatePassword, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
