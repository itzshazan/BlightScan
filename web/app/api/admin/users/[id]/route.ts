import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fail, json, requireUser } from "@/lib/server/session";

const ROLES = ["farmer", "expert", "admin"];
const STATUSES = ["active", "deactivated"];

// PATCH /api/admin/users/[id] { role?, status? } — admin only.
// Deactivation also bans the auth user so they can't sign in again.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await requireUser(["admin"]);
  if (s instanceof NextResponse) return s;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, string> = {};
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return fail(400, "Invalid role");
    patch.role = body.role;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return fail(400, "Invalid status");
    patch.status = body.status;
  }
  if (!Object.keys(patch).length) return fail(400, "Nothing to update");
  if (params.id === s.user.id) return fail(400, "You can't change your own role or status");

  const admin = supabaseAdmin();
  const { error } = await admin.from("profiles").update(patch).eq("id", params.id);
  if (error) return fail(500, error.message);

  if (patch.status) {
    const { error: banErr } = await admin.auth.admin.updateUserById(params.id, { ban_duration: patch.status === "deactivated" ? "876000h" : "none" });
    if (banErr) return fail(500, banErr.message);
  }
  return json({ ok: true });
}
