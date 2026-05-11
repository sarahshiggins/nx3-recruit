import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Total applications
  const { count: total, error: totalErr } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true });

  if (totalErr) {
    return NextResponse.json({ error: totalErr.message }, { status: 500 });
  }

  // Per-job counts
  const { data: allApps, error: appsErr } = await supabase
    .from("applications")
    .select("job_slug, stage");

  if (appsErr) {
    return NextResponse.json({ error: appsErr.message }, { status: 500 });
  }

  const byJob: Record<string, number> = {};
  const byStage: Record<string, number> = {};

  for (const app of allApps ?? []) {
    byJob[app.job_slug] = (byJob[app.job_slug] ?? 0) + 1;
    byStage[app.stage] = (byStage[app.stage] ?? 0) + 1;
  }

  return NextResponse.json({ total, byJob, byStage });
}
