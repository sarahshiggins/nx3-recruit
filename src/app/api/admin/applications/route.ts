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

  const { searchParams } = new URL(req.url);
  const job = searchParams.get("job");
  const stage = searchParams.get("stage");

  let query = supabase
    .from("applications")
    .select("*")
    .order("applied_at", { ascending: false });

  if (job) {
    query = query.eq("job_slug", job);
  }

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
