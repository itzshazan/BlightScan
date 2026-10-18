import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fail, json, requireUser } from "@/lib/server/session";

const LABELS = ["healthy", "early_blight", "late_blight"];

// PATCH /api/scans/[id]/review
//   farmer (owner):  { "action": "request" }                       → review_status = 'requested'
//   expert / admin:  { "expert_label": "...", "expert_note": "..." } → review_status = 'reviewed'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));

  const { data: scan } = await s.supabase.from("scans").select("id, user_id, review_status").eq("id", params.id).single();
  if (!scan) return fail(404, "Not found");
  const admin = supabaseAdmin();

  if (body.action === "request") {
    if (scan.user_id !== s.user.id) return fail(404, "Not found");
    if (scan.review_status === "reviewed") return fail(409, "This scan has already been reviewed");
    const { error } = await admin.from("scans").update({ review_status: "requested" }).eq("id", scan.id);
    return error ? fail(500, error.message) : json({ ok: true });
  }

  if (s.role !== "expert" && s.role !== "admin") return fail(403, "Forbidden");
  if (!LABELS.includes(body.expert_label)) return fail(400, "expert_label must be healthy, early_blight or late_blight");
  const { error } = await admin
    .from("scans")
    .update({
      expert_label: body.expert_label,
      expert_note: typeof body.expert_note === "string" ? body.expert_note.slice(0, 2000) || null : null,
      review_status: "reviewed",
      reviewed_by: s.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", scan.id);
  return error ? fail(500, error.message) : json({ ok: true });
}
