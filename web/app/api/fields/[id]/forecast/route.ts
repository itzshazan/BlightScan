import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MlError } from "@/lib/server/ml";
import { runSpreadForecast } from "@/lib/server/forecast";
import { fail, json, requireUser } from "@/lib/server/session";

// POST /api/fields/[id]/forecast — refresh one field's 7-day spread forecast (owner only).
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;

  const { data: field } = await s.supabase.from("fields").select("id").eq("id", params.id).eq("user_id", s.user.id).single();
  if (!field) return fail(404, "Not found");

  try {
    return json(await runSpreadForecast(supabaseAdmin(), field.id));
  } catch (e) {
    if (e instanceof MlError) return fail(e.status, e.message);
    return fail(500, "Could not refresh the forecast");
  }
}
