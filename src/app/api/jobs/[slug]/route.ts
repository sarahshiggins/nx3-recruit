import { NextRequest, NextResponse } from "next/server";
import { getJobBySlug } from "@/lib/jobs-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
