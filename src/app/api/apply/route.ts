import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifyNewApplication } from "@/lib/notifications";
import { jobs } from "@/lib/jobs";

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
    const body = await req.json();
    const {
      jobSlug,
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      screeningAnswers,
    } = body;

    // Validate required fields
    if (!jobSlug || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("email", email)
      .eq("job_slug", jobSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You've already applied for this position" },
        { status: 409 }
      );
    }

    // Insert application
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_slug: jobSlug,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        resume_url: resumeUrl || null,
        screening_answers: screeningAnswers || {},
        stage: "NEW",
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }

    // Send email notification (non-blocking — don't fail the application if email fails)
    const job = jobs.find((j) => j.slug === jobSlug);
    notifyNewApplication({
      candidateName: `${firstName} ${lastName}`,
      email,
      phone: phone || undefined,
      jobTitle: job?.title || jobSlug,
      jobSlug,
      applicationId: data.id,
      resumeUrl: resumeUrl || undefined,
      screeningAnswers: screeningAnswers || undefined,
    }).catch((err) => console.error("Notification error:", err));

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Application submission error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
