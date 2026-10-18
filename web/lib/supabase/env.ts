// The app runs in demo mode (browser-only data) until both public Supabase keys are set.
// NEXT_PUBLIC_* values are inlined at build time, so restart `npm run dev` after editing .env.local.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const LEAF_BUCKET = "leaf-images";
export const AVATAR_BUCKET = "avatars";
