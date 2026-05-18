"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SourcedCandidate,
  Status,
  STATUS_LABELS,
  STATUS_COLORS,
  FILTER_TABS,
} from "./types";

export default function SourcedPipeline({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [totalAll, setTotalAll] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
      const res = await fetch(`/api/admin/sourced-candidates?${params}`);
      if (res.ok) {
        const json = await res.json();
        setCandidates(json.candidates ?? []);
      }
      // Unfiltered total for the header count.
      const allRes = await fetch(`/api/admin/sourced-candidates?page=1`);
      if (allRes.ok) {
        const allJson = await allRes.json();
        setTotalAll(allJson.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function updateCandidate(
    id: string,
    patch: { status?: Status; notes?: string; contacted_at?: string | null }
  ) {
    const res = await fetch(`/api/admin/sourced-candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || `Update failed (${res.status})`);
    }
  }

  async function deleteCandidate(id: string) {
    if (!confirm("Remove this sourced candidate?")) return;
    const res = await fetch(`/api/admin/sourced-candidates/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } else {
      alert("Delete failed");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          Sourced Candidates{" "}
          <span className="text-[var(--text-muted)] font-normal text-base font-[family-name:var(--font-mono)]">
            ({totalAll})
          </span>
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-[var(--accent)] text-[var(--text)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No sourced candidates yet. Use GitHub search above to add some.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] divide-y divide-[var(--border)]">
          {candidates.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              expanded={expandedId === c.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === c.id ? null : c.id))
              }
              onUpdate={updateCandidate}
              onDelete={deleteCandidate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateRow({
  candidate,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  candidate: SourcedCandidate;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (
    id: string,
    patch: { status?: Status; notes?: string; contacted_at?: string | null }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState(candidate.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotesDraft(candidate.notes ?? "");
  }, [candidate.notes]);

  const status = candidate.status as Status;
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.NEW;

  async function saveNotes() {
    if (notesDraft === (candidate.notes ?? "")) return;
    setSavingNotes(true);
    await onUpdate(candidate.id, { notes: notesDraft });
    setSavingNotes(false);
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--card-hover)] transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidate.avatar_url ?? ""}
          alt={candidate.github_username}
          width={36}
          height={36}
          className="w-9 h-9 rounded-full bg-[var(--bg)] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text)] truncate">
              {candidate.name || candidate.github_username}
            </span>
            <a
              href={candidate.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)] hover:text-[var(--accent)]"
            >
              @{candidate.github_username} ↗
            </a>
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {candidate.location || "—"}
            {candidate.matched_job_slugs?.length > 0 && (
              <span className="ml-2 opacity-80">
                · {candidate.matched_job_slugs.join(", ")}
              </span>
            )}
          </p>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ background: color.bg, color: color.color }}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
        <span
          className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)] hidden md:block shrink-0"
        >
          {new Date(candidate.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-[var(--text-muted)] text-xs shrink-0">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 bg-[var(--bg)]/40 border-t border-[var(--border)]">
          {candidate.bio && (
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {candidate.bio}
            </p>
          )}

          {candidate.top_repos && candidate.top_repos.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-[family-name:var(--font-mono)]">
                Top Repos
              </p>
              <div className="space-y-1.5">
                {candidate.top_repos.map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs border border-[var(--border)] rounded px-2 py-1.5 hover:border-[var(--border-hover)] hover:bg-[var(--bg)] transition-colors"
                  >
                    <span className="font-medium text-[var(--text)] truncate">
                      {repo.name}
                      {repo.description && (
                        <span className="ml-2 text-[var(--text-muted)] font-normal">
                          — {repo.description}
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--text-muted)] font-[family-name:var(--font-mono)] shrink-0 ml-2">
                      {repo.language && (
                        <span className="mr-2">{repo.language}</span>
                      )}
                      ★ {repo.stargazers_count}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
            {candidate.email && <span>✉ {candidate.email}</span>}
            {candidate.company && <span>🏢 {candidate.company}</span>}
            {candidate.contacted_at && (
              <span>
                Contacted:{" "}
                {new Date(candidate.contacted_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-[family-name:var(--font-mono)]">
              Notes
            </label>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              rows={3}
              placeholder="Outreach notes, screen feedback, links..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
            />
            {savingNotes && (
              <p className="text-xs text-[var(--text-muted)] mt-1">Saving...</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  onUpdate(candidate.id, { status: e.target.value as Status })
                }
                className="bg-[var(--bg)] border border-[var(--border)] rounded-md px-2 py-1 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--border-hover)]"
              >
                {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {status !== "CONTACTED" && (
                <button
                  onClick={() =>
                    onUpdate(candidate.id, {
                      status: "CONTACTED",
                      contacted_at: new Date().toISOString(),
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600/90 hover:bg-blue-500 text-white transition-colors"
                >
                  Mark as Contacted
                </button>
              )}
              <button
                onClick={() => onDelete(candidate.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-700/40 text-red-300 hover:bg-red-900/20 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
