"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GitHubResult,
  SourcedCandidate,
  LANGUAGES,
  TOPICS,
  ACTIVITY_FILTERS,
} from "./types";

export default function GitHubSearch({ onAdded }: { onAdded: () => void }) {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("Chicago");
  const [language, setLanguage] = useState("Any");
  const [topic, setTopic] = useState("Any");
  const [activeSince, setActiveSince] = useState("");
  const [page, setPage] = useState(1);

  const [allResults, setAllResults] = useState<GitHubResult[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<{ reset: string | null } | null>(
    null
  );
  const [hasMore, setHasMore] = useState(false);

  const [addedUsernames, setAddedUsernames] = useState<Set<string>>(new Set());
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  const [hasSearched, setHasSearched] = useState(false);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setAllResults([]);
      }
      setError(null);
      setRateLimited(null);
      setHasSearched(true);

      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (location.trim()) params.set("location", location.trim());
      if (language && language !== "Any") params.set("language", language);
      if (topic && topic !== "Any") params.set("topic", topic);
      if (activeSince) params.set("active_since", activeSince);
      params.set("page", String(targetPage));

      try {
        const res = await fetch(`/api/admin/github-search?${params.toString()}`);
        const json = await res.json();
        if (res.status === 429 || json?.rateLimit) {
          setRateLimited({ reset: json?.resetAt ?? null });
          setHasMore(false);
        } else if (!res.ok) {
          setError(json?.error || `Search failed (${res.status})`);
          setHasMore(false);
        } else {
          const newResults: GitHubResult[] = json.results ?? [];
          setTotalAvailable(json.total_count ?? 0);
          if (append) {
            setAllResults((prev) => {
              // Deduplicate by username
              const seen = new Set(prev.map((r) => r.username));
              const unique = newResults.filter((r) => !seen.has(r.username));
              return [...prev, ...unique];
            });
          } else {
            setAllResults(newResults);
          }
          setHasMore(json.has_more !== false && newResults.length > 0);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, location, language, topic, activeSince]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = new Set<string>();
        for (let p = 1; p <= 5; p++) {
          const res = await fetch(`/api/admin/sourced-candidates?page=${p}`);
          if (!res.ok) break;
          const json = await res.json();
          const candidates: SourcedCandidate[] = json.candidates ?? [];
          for (const c of candidates) all.add(c.github_username.toLowerCase());
          if (candidates.length < 20) break;
        }
        if (!cancelled) setAddedUsernames(all);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPage(1, false);
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true);
  }

  async function addToPipeline(user: GitHubResult) {
    setAddingUsername(user.username);
    try {
      const res = await fetch("/api/admin/sourced-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_username: user.username,
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
          },
          top_repos: user.top_repos,
          matched_job_slugs: [],
        }),
      });

      if (res.ok || res.status === 409) {
        setAddedUsernames((prev) => {
          const next = new Set(prev);
          next.add(user.username.toLowerCase());
          return next;
        });
        onAdded();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json?.error || `Failed to add (${res.status})`);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAddingUsername(null);
    }
  }

  const resultCount = allResults.length;

  return (
    <section>
      <form
        onSubmit={handleSubmit}
        className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <LabeledInput
              label="Search GitHub"
              value={q}
              onChange={setQ}
              placeholder="Search GitHub..."
            />
          </div>
          <LabeledInput
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="e.g. Chicago"
          />
          <LabeledSelect
            label="Language"
            value={language}
            onChange={setLanguage}
            options={LANGUAGES}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <LabeledSelect
            label="Topic"
            value={topic}
            onChange={setTopic}
            options={TOPICS.map((t) => t.value)}
            displayOptions={TOPICS.map((t) => t.label)}
          />
          <LabeledSelect
            label="Active Since"
            value={activeSince}
            onChange={setActiveSince}
            options={ACTIVITY_FILTERS.map((f) => f.value)}
            displayOptions={ACTIVITY_FILTERS.map((f) => f.label)}
          />
          <div className="md:col-span-2 flex items-end justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
              {hasSearched && resultCount > 0
                ? totalAvailable > resultCount
                  ? `Showing ${resultCount} of ${totalAvailable.toLocaleString()}`
                  : `${resultCount} result${resultCount === 1 ? "" : "s"}`
                : ""}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {rateLimited && (
        <div className="mb-6 border border-amber-700/40 bg-amber-900/10 rounded-md px-4 py-3 text-sm text-amber-200">
          GitHub API rate limit exceeded.
          {rateLimited.reset && (
            <span className="ml-1 opacity-80">
              Resets at {new Date(rateLimited.reset).toLocaleTimeString()}.
            </span>
          )}{" "}
          <span className="opacity-80">
            Set <code className="font-[family-name:var(--font-mono)]">GITHUB_TOKEN</code> to raise the limit to 5000/hr.
          </span>
        </div>
      )}
      {error && (
        <div className="mb-6 border border-red-700/40 bg-red-900/10 rounded-md px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!hasSearched && !loading ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-14 text-center">
          <p className="text-lg text-[var(--text-muted)] mb-2">🔍</p>
          <p className="text-sm text-[var(--text-muted)]">Set your filters and hit Search to find developers on GitHub.</p>
        </div>
      ) : loading && allResults.length === 0 ? (
        <SkeletonGrid />
      ) : allResults.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allResults.map((user) => {
              const added = addedUsernames.has(user.username.toLowerCase());
              return (
                <ResultCard
                  key={user.username}
                  user={user}
                  added={added}
                  adding={addingUsername === user.username}
                  onAdd={() => addToPipeline(user)}
                />
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                disabled={loadingMore}
                onClick={loadMore}
                className="px-6 py-2.5 text-sm font-medium rounded-md border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? "Loading more..." : `Load More (${totalAvailable.toLocaleString()} total)`}
              </button>
            </div>
          )}

          {loadingMore && (
            <div className="mt-4">
              <SkeletonGrid />
            </div>
          )}
        </>
      ) : hasSearched && !loading ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">No GitHub users matched.</p>
        </div>
      ) : null}
    </section>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-[family-name:var(--font-mono)]">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  displayOptions,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  displayOptions?: string[];
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-[family-name:var(--font-mono)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--border-hover)]"
      >
        {options.map((o, i) => (
          <option key={o} value={o}>
            {displayOptions ? displayOptions[i] : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5"
        >
          <div className="flex gap-3 items-start">
            <div className="w-12 h-12 rounded-full bg-[var(--border)] animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-[var(--border)] rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-[var(--border)] rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-[var(--border)] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({
  user,
  added,
  adding,
  onAdd,
}: {
  user: GitHubResult;
  added: boolean;
  adding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5 hover:bg-[var(--card-hover)] transition-colors flex flex-col">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatar_url}
          alt={user.username}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full bg-[var(--bg)] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-[var(--text)] hover:text-white transition-colors truncate block"
          >
            {user.name || user.username}
          </a>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)] hover:text-[var(--text-secondary)] truncate block"
          >
            @{user.username}
          </a>
        </div>
      </div>

      {user.bio && (
        <p
          className="mt-3 text-sm text-[var(--text-secondary)] overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {user.bio}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
        {user.location && <span>📍 {user.location}</span>}
        {user.company && <span>🏢 {user.company}</span>}
        <span>📦 {user.public_repos} repos</span>
        <span>👥 {user.followers} followers</span>
        {user.last_push_at ? (
          <span title={`Last code push: ${new Date(user.last_push_at).toLocaleDateString()}`}>
            ⚡ pushed {formatTimeAgo(user.last_push_at)}
          </span>
        ) : user.updated_at ? (
          <span className="opacity-70" title={`Profile active: ${new Date(user.updated_at).toLocaleDateString()}`}>
            ⚡ active {formatTimeAgo(user.updated_at)}
          </span>
        ) : null}
      </div>

      {user.top_repos && user.top_repos.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {user.top_repos.map((repo) => (
            <a
              key={repo.name}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs border border-[var(--border)] rounded px-2 py-1.5 hover:border-[var(--border-hover)] hover:bg-[var(--bg)] transition-colors"
            >
              <span className="font-medium text-[var(--text)] truncate">
                {repo.name}
              </span>
              <span className="text-[var(--text-muted)] font-[family-name:var(--font-mono)] shrink-0 ml-2">
                {repo.language && <span className="mr-2">{repo.language}</span>}
                ★ {repo.stargazers_count}
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end">
        <button
          disabled={added || adding}
          onClick={onAdd}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            added
              ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
              : "bg-emerald-600/90 hover:bg-emerald-500 text-white disabled:opacity-50"
          }`}
        >
          {added ? "Added ✓" : adding ? "Adding..." : "Add to Pipeline"}
        </button>
      </div>
    </div>
  );
}
