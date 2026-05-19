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

  const searchUrl =
    `${GITHUB_API}/search/users?q=${encodeURIComponent(query)}` +
    `&per_page=10&page=${page}`;

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
        resetAt: reset
          ? new Date(parseInt(reset, 10) * 1000).toISOString()
          : null,
        hint: process.env.GITHUB_TOKEN
          ? "Authenticated rate limit (5000/hr) exhausted."
          : "Unauthenticated rate limit (60/hr) exhausted. Set GITHUB_TOKEN env var to raise it to 5000/hr.",
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
    incomplete_results: boolean;
    items: GitHubSearchUser[];
  };

  // Enrich each user: full profile + top 3 repos by stars.
  // Run in parallel but don't fail the whole search if one enrichment fails.
  const enriched: EnrichedUser[] = await Promise.all(
    searchJson.items.map(async (item): Promise<EnrichedUser> => {
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
        twitter_username: null,
        hireable: null,
        blog: null,
        top_repos: [],
      };

      try {
        const [userRes, reposRes] = await Promise.all([
          ghFetch(`${GITHUB_API}/users/${encodeURIComponent(item.login)}`),
          ghFetch(
            `${GITHUB_API}/users/${encodeURIComponent(item.login)}/repos?sort=stars&direction=desc&per_page=3&type=owner`
          ),
        ]);

        if (!userRes.ok) return fallback;
        const user = (await userRes.json()) as GitHubUser;

        let repos: GitHubRepo[] = [];
        if (reposRes.ok) {
          repos = (await reposRes.json()) as GitHubRepo[];
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
    })
  );

  // Filter by activity if requested
  let filtered = enriched;
  if (activeSince) {
    const days = parseInt(activeSince, 10);
    if (!isNaN(days) && days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      filtered = enriched.filter(
        (u) => u.updated_at && u.updated_at >= cutoff
      );
    }
  }

  const remaining = searchRes.headers.get("x-ratelimit-remaining");
  const reset = searchRes.headers.get("x-ratelimit-reset");

  return NextResponse.json(
    {
      query,
      page,
      total_count: searchJson.total_count,
      shown_count: filtered.length,
      activity_filtered: !!activeSince,
      incomplete_results: searchJson.incomplete_results,
      results: filtered,
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
