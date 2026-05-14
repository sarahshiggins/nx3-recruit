import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendCandidateEmail } from "@/lib/candidate-emails";
import { jobs } from "@/lib/jobs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await params;
  const body = await req.json();
  const { type, customMessage } = body;

  if (!type || !["rejection", "advancement"].includes(type)) {
    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  }

  // Get the application
  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const job = jobs.find((j) => j.slug === app.job_slug);

  const result = await sendCandidateEmail({
    to: app.email,
    candidateName: `${app.first_name} ${app.last_name}`,
    jobTitle: job?.title || app.job_slug,
    type,
    customMessage,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // If rejection, auto-move to REJECTED stage
  if (type === "rejection" && app.stage !== "REJECTED") {
    await supabase
      .from("applications")
      .update({ stage: "REJECTED" })
      .eq("id", id);
  }

  return NextResponse.json({ success: true, emailId: result.emailId });
}
