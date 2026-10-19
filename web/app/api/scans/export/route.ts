import { NextResponse } from "next/server";
import { affectedArea } from "@/lib/format";
import { fail, requireUser } from "@/lib/server/session";

const LABEL: Record<string, string> = { healthy: "Healthy", early_blight: "Early Blight", late_blight: "Late Blight" };
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// GET /api/scans/export?result=&field=&from=&to=&q=&sort= — the signed-in user's scans as CSV,
// with the same filters as the history page.
export async function GET(req: Request) {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;
  const p = new URL(req.url).searchParams;

  let q = s.supabase
    .from("scans")
    // "*" rather than a column list so this keeps working on databases without migration 0006
    .select("*, fields(name)")
    .eq("user_id", s.user.id);
  const field = p.get("field");
  if (field === "none") q = q.is("field_id", null);
  else if (field) q = q.eq("field_id", field);
  if (p.get("from")) q = q.gte("created_at", `${p.get("from")}T00:00:00`);
  if (p.get("to")) q = q.lte("created_at", `${p.get("to")}T23:59:59.999`);
  if (p.get("q")) q = q.ilike("notes", `%${p.get("q")}%`);
  const sort = p.get("sort");
  q = sort === "confidence" ? q.order("confidence", { ascending: false }) : q.order("created_at", { ascending: sort === "oldest" });

  const { data, error } = await q;
  if (error) return fail(500, error.message);

  const result = p.get("result");
  const rows = (data ?? []).filter((r) => {
    const label = r.expert_label ?? r.predicted_label;
    if (result === "diseased") return label !== "healthy";
    return !result || label === result;
  });

  const head = ["id", "date", "result", "model_label", "confidence", "severity", "diseased_area_pct", "field", "review_status", "notes"];
  const lines = rows.map((r) => {
    const f = r.fields as unknown as { name: string } | null;
    return [r.id, r.created_at, LABEL[r.expert_label ?? r.predicted_label], LABEL[r.predicted_label], r.confidence, r.severity, affectedArea(r), f?.name ?? "", r.review_status, r.notes]
      .map(esc)
      .join(",");
  });

  return new NextResponse([head.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="blightscan-scans-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
