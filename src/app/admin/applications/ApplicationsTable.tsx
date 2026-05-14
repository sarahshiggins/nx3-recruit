"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_slug: string;
  stage: string;
  applied_at: string;
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  ZOOM_SCREEN: "Zoom Screen",
  INTERVIEW: "Interview",
  FINAL_INTERVIEW: "Final Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "rgba(106,106,122,0.15)", color: "#9898a8" },
  ZOOM_SCREEN: { bg: "rgba(124,111,205,0.15)", color: "#9b8fd9" },
  INTERVIEW: { bg: "rgba(37,99,235,0.15)", color: "#60a5fa" },
  FINAL_INTERVIEW: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  OFFER: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
  HIRED: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
  REJECTED: { bg: "rgba(220,38,38,0.15)", color: "#f87171" },
};

const JOB_TITLES: Record<string, string> = {
  "genai-rd-engineer": "GenAI R&D Engineer",
  "bd-intern": "Business Development Intern",
};

export default function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkAction, setBulkAction] = useState<"delete" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();

  const allSelected = applications.length > 0 && selected.size === applications.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(applications.map((a) => a.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  async function handleBulkDelete() {
    setDeleting(true);

    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/applications/${id}`, { method: "DELETE" })
      )
    );

    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
    if (failed.length > 0) {
      console.error(`${failed.length} deletes failed`);
    }

    setSelected(new Set());
    setBulkAction(null);
    setDeleting(false);
    router.refresh();
  }

  async function handleBulkReject() {
    setRejecting(true);

    const ids = Array.from(selected);

    // Send rejection email + move to REJECTED for each
    await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/applications/${id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "rejection" }),
        })
      )
    );

    setSelected(new Set());
    setBulkAction(null);
    setRejecting(false);
    router.refresh();
  }

  return (
    <div>
      {/* Bulk actions bar */}
      {someSelected && (
        <div className="flex items-center gap-4 mb-3 px-1">
          <span className="text-xs text-[var(--text-secondary)]">
            {selected.size} selected
          </span>

          {!bulkAction ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAction("reject")}
                className="text-xs font-medium px-3 py-1.5 rounded border border-red-800/30 text-red-400 hover:bg-red-900/15 transition-colors"
              >
                Reject + send email
              </button>
              <button
                onClick={() => setBulkAction("delete")}
                className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-800/30 transition-colors"
              >
                Delete
              </button>
            </div>
          ) : bulkAction === "delete" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">
                Delete {selected.size} application{selected.size !== 1 ? "s" : ""}?
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                onClick={() => setBulkAction(null)}
                disabled={deleting}
                className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">
                Reject {selected.size} candidate{selected.size !== 1 ? "s" : ""} + send rejection email{selected.size !== 1 ? "s" : ""}?
              </span>
              <button
                onClick={handleBulkReject}
                disabled={rejecting}
                className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
              >
                {rejecting ? "Sending…" : "Confirm"}
              </button>
              <button
                onClick={() => setBulkAction(null)}
                disabled={rejecting}
                className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={() => { setSelected(new Set()); setBulkAction(null); }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1.5fr_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
            />
          </div>
          {["Name", "Email", "Job", "Stage", "Applied"].map((h) => (
            <span
              key={h}
              className="text-xs text-[var(--text-muted)] uppercase tracking-wider"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {applications.map((app) => {
            const jobTitle = JOB_TITLES[app.job_slug] ?? app.job_slug;
            const stageStyle = STAGE_COLORS[app.stage] ?? STAGE_COLORS["NEW"];
            const isSelected = selected.has(app.id);

            return (
              <div
                key={app.id}
                className={`flex flex-col md:grid md:grid-cols-[40px_1fr_1fr_1.5fr_auto_auto] gap-1 md:gap-4 md:items-center px-5 py-4 hover:bg-[var(--card-hover)] transition-colors group ${
                  isSelected ? "bg-[var(--accent)]/5" : ""
                }`}
              >
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(app.id)}
                    className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
                <Link
                  href={`/admin/applications/${app.id}`}
                  className="text-sm font-medium text-[var(--text)] group-hover:text-white transition-colors"
                >
                  {app.first_name} {app.last_name}
                </Link>
                <span className="text-sm text-[var(--text-secondary)] truncate">{app.email}</span>
                <span className="text-sm text-[var(--text-secondary)] truncate">{jobTitle}</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                  style={{ background: stageStyle.bg, color: stageStyle.color }}
                >
                  {STAGE_LABELS[app.stage] ?? app.stage}
                </span>
                <span
                  className="text-xs text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {new Date(app.applied_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
