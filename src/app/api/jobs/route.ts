import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOpenJobs, type JobListing } from "@/lib/jobs-db";

const SITE_URL = "https://careers.nexus3.ai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type PublicJob = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  department: string;
  summary: string;
  description: string;
  postedAt: string | null;
  applyUrl: string;
};

/**
 * Fetch created_at metadata for the open jobs straight from Supabase, since
 * getOpenJobs() returns the public-facing shape without timestamps. Returns
 * an empty map if Supabase isn't configured or the call fails — callers can
 * fall back to a null postedAt.
 */
async function fetchCreatedAtMap(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("jobs")
      .select("id, created_at")
      .eq("status", "OPEN");
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data as { id: string; created_at: string }[]) {
      if (row?.id && row?.created_at) map[row.id] = row.created_at;
    }
    return map;
  } catch {
    return {};
  }
}

function toPublicJob(
  job: JobListing,
  createdAt: string | null
): PublicJob {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    location: job.location,
    type: job.type,
    department: job.department,
    summary: job.summary,
    description: job.description,
    postedAt: createdAt,
    applyUrl: `${SITE_URL}/jobs/${job.slug}`,
  };
}

export async function GET() {
  const [jobs, createdAtMap] = await Promise.all([
    getOpenJobs(),
    fetchCreatedAtMap(),
  ]);

  const payload = {
    jobs: jobs.map((job) => toPublicJob(job, createdAtMap[job.id] ?? null)),
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
