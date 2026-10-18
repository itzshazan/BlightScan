import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LEAF_BUCKET } from "@/lib/supabase/env";
import { fail, json, requireUser } from "@/lib/server/session";

// DELETE /api/scans/[id] — owner only: removes the photo, then the row.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;

  const { data: scan } = await s.supabase.from("scans").select("id, user_id, image_path").eq("id", params.id).single();
  if (!scan || scan.user_id !== s.user.id) return fail(404, "Not found");

  const admin = supabaseAdmin();
  await admin.storage.from(LEAF_BUCKET).remove([scan.image_path]);
  const { error } = await admin.from("scans").delete().eq("id", scan.id);
  if (error) return fail(500, error.message);
  return json({ ok: true });
}
