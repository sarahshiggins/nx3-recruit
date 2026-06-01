import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Automated GitHub sourcing cron job.
 *
 * Runs on a schedule (Vercel Cron) to search for developers matching
 * our open roles and auto-add new finds to the sourced_candidates pipeline.
 *
 * Protected by CRON_SECRET — Vercel sets this automatically for cron jobs.
 */

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "NX3-Recruit-Scanner";

// ── User-profile search configs ──────────────────────────────────────────────
// GitHub User Search matches against profile fields (bio, name, location, etc.).
// We run both Chicago and Illinois variants to cover the whole state.
const USER_SEARCH_CONFIGS = [
  // Chicago — primary
  {
    label: "Chicago AI/ML Python devs",
    query: 'location:"Chicago" language:Python machine learning',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Chicago LLM/agents devs",
    query: 'location:"Chicago" language:Python llm agents',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Chicago TypeScript AI devs",
    query: 'location:"Chicago" language:TypeScript artificial intelligence',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Chicago deep learning devs",
    query: 'location:"Chicago" language:Python deep learning',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Chicago Rust ML devs",
    query: 'location:"Chicago" language:Rust machine learning',
    jobSlug: "genai-rd-engineer",
  },
  // Illinois — wider net
  {
    label: "Illinois AI/ML Python devs",
    query: 'location:"Illinois" language:Python machine learning',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Illinois LLM/agents devs",
    query: 'location:"Illinois" language:Python llm agents',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Illinois TypeScript AI devs",
    query: 'location:"Illinois" language:TypeScript artificial intelligence',
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Illinois deep learning devs",
    query: 'location:"Illinois" language:Python deep learning',
    jobSlug: "genai-rd-engineer",
  },
];

// ── Repo-based search configs ────────────────────────────────────────────────
// GitHub Repo Search finds repos by topic/description/README content.
// We then look up the repo owner's profile to check location + activity.
// This catches devs who don't mention AI in their bio but have ML projects.
const REPO_SEARCH_CONFIGS = [
  {
    label: "LLM/agent repos (Python)",
    query: "topic:llm topic:agents language:Python stars:>5",
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Machine learning repos (Python)",
    query: "topic:machine-learning language:Python stars:>10",
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "RAG / retrieval repos",
    query: "topic:rag language:Python stars:>3",
    jobSlug: "genai-rd-engineer",
  },
  {
    label: "Deep learning repos (PyTorch/TF)",
    query: "topic:deep-learning language:Python stars:>10",
    jobSlug: "genai-rd-engineer",
  },
];

// Locations we accept when checking repo owners
const ACCEPTED_LOCATIONS = [
  "chicago",
  "illinois",
  "il",
  "evanston",
  "naperville",
  "champaign",
  "urbana",
  "oak park",
  "schaumburg",
  "springfield, il",
  "peoria, il",
  "dekalb",
  "normal, il",
  "bloomington, il",
];

// Only scan devs who pushed code in the last N days
const ACTIVITY_CUTOFF_DAYS = 180;
// Max users to process per search query (pages * per_page)
const MAX_PAGES_PER_QUERY = 3;
const PER_PAGE = 30;

type GitHubSearchUser = {
  login: string;
  html_url: string;
  avatar_url: string;
};

type GitHubUser = {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  email: string | null;
  blog: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  twitter_username: string | null;
  hireable: boolean | null;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  fork: boolean;
};

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function ghFetch(url: string): Promise<Response> {
  return fetch(url, { headers: authHeaders(), cache: "no-store" });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  // Verify this is a legit cron invocation
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow: Vercel cron (Authorization: Bearer <CRON_SECRET>) or manual with ?secret=
  const urlSecret = new URL(req.url).searchParams.get("secret");
  if (cronSecret) {
    const bearerOk = authHeader === `Bearer ${cronSecret}`;
    const paramOk = urlSecret === cronSecret;
    if (!bearerOk && !paramOk) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const activityCutoff = new Date(
    Date.now() - ACTIVITY_CUTOFF_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Load all existing sourced usernames to skip duplicates
  const existingUsernames = new Set<string>();
  let page = 1;
  while (true) {
    const { data } = await supabase
      .from("sourced_candidates")
      .select("github_username")
      .range((page - 1) * 100, page * 100 - 1);
    if (!data || data.length === 0) break;
    for (const row of data) {
      existingUsernames.add(row.github_username.toLowerCase());
    }
    if (data.length < 100) break;
    page++;
  }

  type QueryResult = {
    query: string;
    type: "user" | "repo";
    searched: number;
    added: number;
    skipped_existing: number;
    skipped_inactive: number;
    skipped_wrong_location: number;
    errors: string[];
  };

  const results: QueryResult[] = [];

  let totalAdded = 0;
  type NewCandidate = {
    username: string;
    name: string | null;
    location: string | null;
    bio: string | null;
    html_url: string;
    top_langs: string[];
    jobSlug: string;
    discovery: string; // "profile" or "repo"
  };
  const newCandidates: NewCandidate[] = [];

  // Track usernames added in this run to avoid cross-query duplicates
  const addedThisRun = new Set<string>();

  // Helper: check if a location string matches Chicago / Illinois
  function isAcceptedLocation(loc: string | null): boolean {
    if (!loc) return false;
    const lower = loc.toLowerCase();
    return ACCEPTED_LOCATIONS.some((a) => lower.includes(a));
  }

  // Helper: enrich a user and insert if they pass filters
  async function enrichAndInsert(
    login: string,
    avatarUrl: string,
    htmlUrl: string,
    config: { label: string; jobSlug: string },
    queryResult: QueryResult,
    opts: { checkLocation?: boolean; discovery: string }
  ): Promise<void> {
    const usernameLower = login.toLowerCase();

    // Skip if already in pipeline or added in this run
    if (
      existingUsernames.has(usernameLower) ||
      addedThisRun.has(usernameLower)
    ) {
      queryResult.skipped_existing++;
      return;
    }

    try {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        ghFetch(`${GITHUB_API}/users/${encodeURIComponent(login)}`),
        ghFetch(
          `${GITHUB_API}/users/${encodeURIComponent(login)}/repos?sort=stars&direction=desc&per_page=3&type=owner`
        ),
        ghFetch(
          `${GITHUB_API}/users/${encodeURIComponent(login)}/events/public?per_page=10`
        ),
      ]);

      if (!userRes.ok) return;
      const user = (await userRes.json()) as GitHubUser;

      // Location check for repo-based discovery
      if (opts.checkLocation && !isAcceptedLocation(user.location)) {
        queryResult.skipped_wrong_location++;
        return;
      }

      // Activity check
      let lastPush: string | null = null;
      if (eventsRes.ok) {
        const events = (await eventsRes.json()) as {
          type: string;
          created_at: string;
        }[];
        const pushEvent = events.find((e) => e.type === "PushEvent");
        if (pushEvent) lastPush = pushEvent.created_at;
      }

      const lastActivity = lastPush || user.updated_at;
      if (!lastActivity || lastActivity < activityCutoff) {
        queryResult.skipped_inactive++;
        return;
      }

      let repos: GitHubRepo[] = [];
      if (reposRes.ok) {
        repos = (await reposRes.json()) as GitHubRepo[];
      }

      const topRepos = repos
        .filter((r) => !r.fork)
        .slice(0, 3)
        .map((r) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stargazers_count: r.stargazers_count,
          html_url: r.html_url,
          topics: r.topics ?? [],
        }));

      const topLangs = [
        ...new Set(topRepos.map((r) => r.language).filter(Boolean)),
      ] as string[];

      // Insert into sourced_candidates
      const { error: insertError } = await supabase
        .from("sourced_candidates")
        .insert({
          github_username: user.login,
          github_url: user.html_url,
          name: user.name,
          email: user.email,
          bio: user.bio,
          location: user.location,
          company: user.company,
          avatar_url: user.avatar_url,
          profile_data: {
            public_repos: user.public_repos,
            followers: user.followers,
            following: user.following,
            twitter_username: user.twitter_username,
            blog: user.blog,
            hireable: user.hireable,
            created_at: user.created_at,
            last_push_at: lastPush,
            scan_source: "automated",
            scan_discovery: opts.discovery,
            scan_query: config.label,
            scan_date: new Date().toISOString(),
          },
          top_repos: topRepos,
          matched_job_slugs: [config.jobSlug],
          source: "GITHUB_SCAN",
          status: "NEW",
        });

      if (insertError) {
        if ((insertError as { code?: string }).code === "23505") {
          queryResult.skipped_existing++;
          existingUsernames.add(usernameLower);
        } else {
          queryResult.errors.push(
            `Insert ${user.login}: ${insertError.message}`
          );
        }
      } else {
        queryResult.added++;
        totalAdded++;
        addedThisRun.add(usernameLower);
        existingUsernames.add(usernameLower);
        newCandidates.push({
          username: user.login,
          name: user.name,
          location: user.location,
          bio: user.bio,
          html_url: user.html_url,
          top_langs: topLangs,
          jobSlug: config.jobSlug,
          discovery: opts.discovery,
        });
      }
    } catch (enrichErr) {
      queryResult.errors.push(
        `Enrich ${login}: ${(enrichErr as Error).message}`
      );
    }
  }

  // ── Phase 1: User-profile searches (Chicago + Illinois) ──────────────
  for (const config of USER_SEARCH_CONFIGS) {
    const queryResult: QueryResult = {
      query: config.label,
      type: "user",
      searched: 0,
      added: 0,
      skipped_existing: 0,
      skipped_inactive: 0,
      skipped_wrong_location: 0,
      errors: [],
    };

    try {
      for (let p = 1; p <= MAX_PAGES_PER_QUERY; p++) {
        const searchUrl = `${GITHUB_API}/search/users?q=${encodeURIComponent(
          config.query
        )}&per_page=${PER_PAGE}&page=${p}`;

        const searchRes = await ghFetch(searchUrl);

        if (searchRes.status === 403 || searchRes.status === 429) {
          queryResult.errors.push("Rate limited — stopping this query");
          break;
        }

        if (!searchRes.ok) {
          queryResult.errors.push(
            `GitHub search returned ${searchRes.status}`
          );
          break;
        }

        const searchJson = (await searchRes.json()) as {
          total_count: number;
          items: GitHubSearchUser[];
        };

        if (searchJson.items.length === 0) break;

        for (const item of searchJson.items) {
          queryResult.searched++;
          await enrichAndInsert(
            item.login,
            item.avatar_url,
            item.html_url,
            config,
            queryResult,
            { discovery: "profile" }
          );
        }

        if (searchJson.items.length < PER_PAGE) break;
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      queryResult.errors.push(`Query failed: ${(err as Error).message}`);
    }

    results.push(queryResult);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // ── Phase 2: Repo-based searches (find devs by their projects) ───────
  // Search repos by topic/content, then check if the owner is in IL.
  // This catches devs who don't mention AI in their bio but have ML repos.
  for (const config of REPO_SEARCH_CONFIGS) {
    const queryResult: QueryResult = {
      query: `[repo] ${config.label}`,
      type: "repo",
      searched: 0,
      added: 0,
      skipped_existing: 0,
      skipped_inactive: 0,
      skipped_wrong_location: 0,
      errors: [],
    };

    try {
      for (let p = 1; p <= MAX_PAGES_PER_QUERY; p++) {
        const searchUrl = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(
          config.query
        )}&sort=updated&order=desc&per_page=${PER_PAGE}&page=${p}`;

        const searchRes = await ghFetch(searchUrl);

        if (searchRes.status === 403 || searchRes.status === 429) {
          queryResult.errors.push("Rate limited — stopping this query");
          break;
        }

        if (!searchRes.ok) {
          queryResult.errors.push(
            `GitHub repo search returned ${searchRes.status}`
          );
          break;
        }

        type RepoSearchItem = {
          owner: { login: string; avatar_url: string; html_url: string; type: string };
          fork: boolean;
        };

        const searchJson = (await searchRes.json()) as {
          total_count: number;
          items: RepoSearchItem[];
        };

        if (searchJson.items.length === 0) break;

        // Deduplicate owners within this page
        const seenOwners = new Set<string>();
        for (const repo of searchJson.items) {
          // Skip orgs and forks
          if (repo.owner.type !== "User" || repo.fork) continue;
          const ownerLower = repo.owner.login.toLowerCase();
          if (seenOwners.has(ownerLower)) continue;
          seenOwners.add(ownerLower);

          queryResult.searched++;
          await enrichAndInsert(
            repo.owner.login,
            repo.owner.avatar_url,
            repo.owner.html_url,
            config,
            queryResult,
            { checkLocation: true, discovery: "repo" }
          );
        }

        if (searchJson.items.length < PER_PAGE) break;
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      queryResult.errors.push(`Query failed: ${(err as Error).message}`);
    }

    results.push(queryResult);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Send digest email if there are new candidates and Resend is configured
  if (totalAdded > 0 && process.env.RESEND_API_KEY) {
    try {
      await sendDigestEmail(newCandidates, totalAdded);
    } catch (emailErr) {
      // Don't fail the whole job for email issues
      console.error("Digest email failed:", emailErr);
    }
  }

  // Log scan to scan_history if table exists
  try {
    await supabase.from("scan_history").insert({
      scan_type: "github_automated",
      queries_run: USER_SEARCH_CONFIGS.length + REPO_SEARCH_CONFIGS.length,
      total_searched: results.reduce((s, r) => s + r.searched, 0),
      total_added: totalAdded,
      total_skipped_existing: results.reduce(
        (s, r) => s + r.skipped_existing,
        0
      ),
      total_skipped_inactive: results.reduce(
        (s, r) => s + r.skipped_inactive,
        0
      ),
      details: results,
    });
  } catch {
    // scan_history table might not exist yet — that's fine
  }

  return NextResponse.json({
    success: true,
    scan_time: new Date().toISOString(),
    total_added: totalAdded,
    results,
    digest_sent: totalAdded > 0 && !!process.env.RESEND_API_KEY,
  });
}

async function sendDigestEmail(
  candidates: {
    username: string;
    name: string | null;
    location: string | null;
    bio: string | null;
    html_url: string;
    top_langs: string[];
    jobSlug: string;
    discovery: string;
  }[],
  totalAdded: number
) {
  const notifyEmails = (
    process.env.NOTIFY_EMAILS || "sarah.higgins@nexus3cap.com"
  ).split(",");

  const candidateRows = candidates
    .slice(0, 25) // Cap at 25 in the email
    .map(
      (c) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">
          <a href="${c.html_url}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
            ${c.name || c.username}
          </a>
          <br/>
          <span style="color: #6b7280; font-size: 13px;">@${c.username}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #374151; font-size: 13px;">
          ${c.location || "—"}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #374151; font-size: 13px;">
          ${c.top_langs.join(", ") || "—"}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #6b7280; font-size: 13px; max-width: 300px;">
          ${c.bio ? c.bio.slice(0, 120) + (c.bio.length > 120 ? "…" : "") : "—"}
          ${c.discovery === "repo" ? '<br/><span style="font-size: 11px; color: #9ca3af;">📦 Found via repo</span>' : ""}        </td>
      </tr>`
    )
    .join("");

  const adminUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://careers.nexus3.ai";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #111; margin-bottom: 4px;">🔍 GitHub Sourcing Scan — ${totalAdded} New Developer${totalAdded === 1 ? "" : "s"}</h2>
      <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">
        Automated weekly scan found ${totalAdded} new candidate${totalAdded === 1 ? "" : "s"} matching your open roles.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em;">Developer</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em;">Location</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em;">Languages</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em;">Bio</th>
          </tr>
        </thead>
        <tbody>
          ${candidateRows}
        </tbody>
      </table>

      ${totalAdded > 25 ? `<p style="color: #6b7280; font-size: 13px;">+ ${totalAdded - 25} more — view all in the admin panel.</p>` : ""}

      <p style="margin-top: 24px;">
        <a href="${adminUrl}/admin/sourcing" style="display: inline-block; padding: 10px 20px; background: #a41e22; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Review in NX3 Recruit →
        </a>
      </p>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        This is an automated scan from NX3 Recruit. Candidates have been added to your sourcing pipeline with status "New".
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "NX3 Recruit <recruiting@nexus3cap.com>",
      to: notifyEmails,
      subject: `🔍 GitHub Scan: ${totalAdded} new developer${totalAdded === 1 ? "" : "s"} found`,
      html,
    }),
  });
}
