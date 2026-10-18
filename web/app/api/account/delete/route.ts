import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AVATAR_BUCKET, LEAF_BUCKET } from "@/lib/supabase/env";
import { fail, json, requireUser } from "@/lib/server/session";

async function removeFolder(bucket: string, folder: string) {
  const storage = supabaseAdmin().storage.from(bucket);
  for (;;) {
    const { data } = await storage.list(folder, { limit: 100 });
    if (!data?.length) return;
    await storage.remove(data.map((f) => `${folder}/${f.name}`));
    if (data.length < 100) return;
  }
}

// POST /api/account/delete — deletes the user's photos, then the auth user.
// Profile, fields, scans and forecasts go with it through ON DELETE CASCADE.
export async function POST() {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;

  await removeFolder(LEAF_BUCKET, s.user.id);
  await removeFolder(AVATAR_BUCKET, s.user.id);
  const { error } = await supabaseAdmin().auth.admin.deleteUser(s.user.id);
  if (error) return fail(500, error.message);
  await s.supabase.auth.signOut();
  return json({ ok: true });
}
