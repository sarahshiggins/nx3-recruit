import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "NX3-Recruit";

type GitHubSearchUser = {
  login: string;
  html_url: string;
  avatar_url: string;
  score: number;
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
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  fork: boolean;
};

type EnrichedUser = {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string | null;
  last_push_at: string | null;
  twitter_username: string | null;
  hireable: boolean | null;
  blog: string | null;
  top_repos: {
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    topics: string[];
  }[];
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

function buildQuery(opts: {
  q: string;
  location: string;
  language: string;
  topic: string;
}): string {
  const parts: string[] = [];
  if (opts.q.trim()) {
    parts.push(opts.q.trim());
  }
  if (opts.location.trim()) {
    parts.push(`location:"${opts.location.trim()}"`);
  }
  if (opts.language.trim() && opts.language !== "Any") {
    parts.push(`language:${opts.language.trim()}`);
  }
  if (opts.topic.trim() && opts.topic !== "Any") {
    // GitHub user search doesn't support topic: directly — workaround: bare keywords.
    // Convert hyphens to spaces so "artificial-intelligence" becomes "artificial intelligence"
    // and wrap in quotes to search as a phrase.
    const topicWords = opts.topic.trim().replace(/-/g, " ");
    // For short terms like "llm", "rag", "nlp" — search as bare keyword
    // For multi-word terms — use quotes for phrase matching in bios
    if (topicWords.includes(" ")) {
      parts.push(`"${topicWords}"`);
    } else {
      parts.push(topicWords);
    }
  }
  if (parts.length === 0) {
    // Avoid an empty query (GitHub returns 422). Default to a sane fallback.
    parts.push("type:user");
  }
  return parts.join(" ");
}

async function ghFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
    // Cache GitHub responses briefly to stretch the rate limit.
    next: { revalidate: 600 },
  });
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const language = searchParams.get("language") || "";
  const topic = searchParams.get("topic") || "";
  const activeSince = searchParams.get("active_since") || "";
  const pageStr = searchParams.get("page") || "1";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const query = buildQuery({ q, location, language, topic });

  // Helper: enrich a single GitHub user with profile, repos, and push events
  async function enrichUser(item: GitHubSearchUser): Promise<EnrichedUser> {
    const fallback: EnrichedUser = {
      username: item.login,
      name: null,
      bio: null,
      location: null,
      company: null,
      email: null,
      avatar_url: item.avatar_url,
      html_url: item.html_url,
      public_repos: 0,
      followers: 0,
      following: 0,
      created_at: "",
      updated_at: null,
      last_push_at: null,
      twitter_username: null,
      hireable: null,
      blog: null,
      top_repos: [],
    };

    try {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        ghFetch(`${GITHUB_API}/users/${encodeURIComponent(item.login)}`),
        ghFetch(
          `${GITHUB_API}/users/${encodeURIComponent(item.login)}/repos?sort=stars&direction=desc&per_page=3&type=owner`
        ),
        ghFetch(
          `${GITHUB_API}/users/${encodeURIComponent(item.login)}/events/public?per_page=10`
        ),
      ]);

      if (!userRes.ok) return fallback;
      const user = (await userRes.json()) as GitHubUser;

      let repos: GitHubRepo[] = [];
      if (reposRes.ok) {
        repos = (await reposRes.json()) as GitHubRepo[];
      }

      let lastPush: string | null = null;
      if (eventsRes.ok) {
        const events = (await eventsRes.json()) as { type: string; created_at: string }[];
        const pushEvent = events.find((e) => e.type === "PushEvent");
        if (pushEvent) lastPush = pushEvent.created_at;
      }

      return {
        username: user.login,
        name: user.name,
        bio: user.bio,
        location: user.location,
        company: user.company,
        email: user.email,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        updated_at: user.updated_at ?? null,
        last_push_at: lastPush,
        twitter_username: user.twitter_username,
        hireable: user.hireable,
        blog: user.blog,
        top_repos: repos
          .filter((r) => !r.fork)
          .slice(0, 3)
          .map((r) => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stargazers_count: r.stargazers_count,
            html_url: r.html_url,
            topics: r.topics ?? [],
          })),
      };
    } catch {
      return fallback;
    }
  }

  // Helper: check if user passes the activity filter
  function passesActivityFilter(u: EnrichedUser, cutoff: string): boolean {
    if (u.last_push_at) return u.last_push_at >= cutoff;
    if (u.updated_at) return u.updated_at >= cutoff;
    return false;
  }

  const hasActivityFilter = activeSince && !isNaN(parseInt(activeSince, 10)) && parseInt(activeSince, 10) > 0;
  const cutoff = hasActivityFilter
    ? new Date(Date.now() - parseInt(activeSince, 10) * 24 * 60 * 60 * 1000).toISOString()
    : "";

  const PAGE_SIZE = 10;
  let results: EnrichedUser[] = [];
  let totalCount = 0;
  let lastSearchRes: Response | null = null;
  let ghPage = hasActivityFilter ? 1 : page; // When filtering, we iterate GitHub pages ourselves
  const maxGhPages = hasActivityFilter ? 10 : 1; // Scan up to 10 GitHub pages to fill results
  let hasMore = true;

  if (!hasActivityFilter) {
    // Simple case: no activity filter, just fetch one page
    const searchUrl =
      `${GITHUB_API}/search/users?q=${encodeURIComponent(query)}` +
      `&per_page=${PAGE_SIZE}&page=${page}`;

    let searchRes: Response;
    try {
      searchRes = await ghFetch(searchUrl);
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to reach GitHub: ${(err as Error).message}` },
        { status: 502 }
      );
    }

    if (searchRes.status === 403 || searchRes.status === 429) {
      const reset = searchRes.headers.get("x-ratelimit-reset");
      return NextResponse.json(
        {
          error: "GitHub API rate limit exceeded.",
          rateLimit: true,
          resetAt: reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : null,
          hint: process.env.GITHUB_TOKEN
            ? "Authenticated rate limit (5000/hr) exhausted."
            : "Unauthenticated rate limit (60/hr) exhausted. Set GITHUB_TOKEN env var.",
        },
        { status: 429 }
      );
    }

    if (!searchRes.ok) {
      const text = await searchRes.text();
      return NextResponse.json(
        { error: `GitHub search failed (${searchRes.status})`, detail: text },
        { status: searchRes.status }
      );
    }

    const searchJson = (await searchRes.json()) as {
      total_count: number;
      items: GitHubSearchUser[];
    };
    totalCount = searchJson.total_count;
    lastSearchRes = searchRes;

    results = await Promise.all(searchJson.items.map(enrichUser));
  } else {
    // Activity filter: scan multiple GitHub pages to collect enough active users
    for (let gp = ghPage; gp < ghPage + maxGhPages && hasMore && results.length < PAGE_SIZE; gp++) {
      const searchUrl =
        `${GITHUB_API}/search/users?q=${encodeURIComponent(query)}` +
        `&per_page=30&page=${gp}`;

      let searchRes: Response;
      try {
        searchRes = await ghFetch(searchUrl);
      } catch {
        break;
      }

      if (searchRes.status === 403 || searchRes.status === 429) {
        const reset = searchRes.headers.get("x-ratelimit-reset");
        if (results.length === 0) {
          return NextResponse.json(
            {
              error: "GitHub API rate limit exceeded.",
              rateLimit: true,
              resetAt: reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : null,
              hint: process.env.GITHUB_TOKEN
                ? "Authenticated rate limit (5000/hr) exhausted."
                : "Unauthenticated rate limit (60/hr) exhausted. Set GITHUB_TOKEN env var.",
            },
            { status: 429 }
          );
        }
        break; // Return what we have so far
      }

      if (!searchRes.ok) break;

      const searchJson = (await searchRes.json()) as {
        total_count: number;
        items: GitHubSearchUser[];
      };
      if (!lastSearchRes) lastSearchRes = searchRes;
      totalCount = searchJson.total_count;

      if (searchJson.items.length === 0) {
        hasMore = false;
        break;
      }

      // Enrich all users from this GitHub page
      const enriched = await Promise.all(searchJson.items.map(enrichUser));

      // Filter by activity and add to results
      for (const u of enriched) {
        if (results.length >= PAGE_SIZE) break;
        if (passesActivityFilter(u, cutoff)) {
          results.push(u);
        }
      }

      // If GitHub returned fewer than 30, no more pages
      if (searchJson.items.length < 30) hasMore = false;
    }
  }

  const remaining = lastSearchRes?.headers.get("x-ratelimit-remaining") ?? null;
  const reset = lastSearchRes?.headers.get("x-ratelimit-reset") ?? null;

  return NextResponse.json(
    {
      query,
      page,
      total_count: totalCount,
      shown_count: results.length,
      activity_filtered: !!hasActivityFilter,
      has_more: hasMore,
      results,
      rate_limit: {
        remaining: remaining ? parseInt(remaining, 10) : null,
        reset_at: reset
          ? new Date(parseInt(reset, 10) * 1000).toISOString()
          : null,
        authenticated: !!process.env.GITHUB_TOKEN,
      },
    },
    {
      headers: {
        "Cache-Control":
          "private, s-maxage=600, stale-while-revalidate=300",
      },
    }
  );
}
