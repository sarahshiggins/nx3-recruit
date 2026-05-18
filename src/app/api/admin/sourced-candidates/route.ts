import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

const VALID_STATUSES = [
  "NEW",
  "CONTACTED",
  "RESPONDED",
  "NOT_INTERESTED",
  "CONVERTED",
] as const;

type Status = (typeof VALID_STATUSES)[number];

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const github_username =
    typeof body.github_username === "string" ? body.github_username.trim() : "";
  const github_url =
    typeof body.github_url === "string" ? body.github_url.trim() : "";

  if (!github_username || !github_url) {
    return NextResponse.json(
      { error: "github_username and github_url are required" },
      { status: 400 }
    );
  }

  const insertPayload = {
    github_username,
    github_url,
    name: typeof body.name === "string" ? body.name : null,
    email: typeof body.email === "string" ? body.email : null,
    bio: typeof body.bio === "string" ? body.bio : null,
    location: typeof body.location === "string" ? body.location : null,
    company: typeof body.company === "string" ? body.company : null,
    avatar_url: typeof body.avatar_url === "string" ? body.avatar_url : null,
    profile_data:
      body.profile_data && typeof body.profile_data === "object"
        ? body.profile_data
        : {},
    top_repos: Array.isArray(body.top_repos) ? body.top_repos : [],
    matched_job_slugs: Array.isArray(body.matched_job_slugs)
      ? body.matched_job_slugs.filter((s): s is string => typeof s === "string")
      : [],
    source: typeof body.source === "string" ? body.source : "GITHUB",
    status: "NEW" as Status,
  };

  const { data, error } = await supabase
    .from("sourced_candidates")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: `${github_username} is already in the sourced pipeline.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const pageStr = searchParams.get("page") || "1";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("sourced_candidates")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) {
    query = query.eq("status", statusParam);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    candidates: data ?? [],
    page,
    page_size: PAGE_SIZE,
    total: count ?? 0,
  });
}
