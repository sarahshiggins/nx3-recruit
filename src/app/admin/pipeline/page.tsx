"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_slug: string;
  stage: string;
  applied_at: string;
};

const STAGES = [
  "NEW",
  "ZOOM_SCREEN",
  "INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  ZOOM_SCREEN: "Zoom Screen",
  INTERVIEW: "Interview",
  FINAL_INTERVIEW: "Final Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "#6a6a7a",
  ZOOM_SCREEN: "#9b8fd9",
  INTERVIEW: "#60a5fa",
  FINAL_INTERVIEW: "#818cf8",
  OFFER: "#a78bfa",
  HIRED: "#4ade80",
  REJECTED: "#f87171",
};

// Colors assigned to jobs dynamically
const DOT_COLORS = ["#a78bfa", "#f59e0b", "#60a5fa", "#4ade80", "#f87171", "#9b8fd9"];

type Job = {
  id: string;
  slug: string;
  title: string;
};

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        fetch("/api/admin/applications"),
        fetch("/api/admin/jobs"),
      ]);
      if (appsRes.ok) setApplications(await appsRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build dynamic job labels and colors from DB jobs + any slugs in applications
  const jobLookup = useMemo(() => {
    const lookup: Record<string, { label: string; color: string }> = {};
    // From jobs table
    jobs.forEach((j, i) => {
      const shortLabel = j.title
        .replace(/^GenAI\s*/i, "")
        .replace(/^Business Development\s*/i, "BD ")
        .trim();
      lookup[j.slug] = { label: shortLabel, color: DOT_COLORS[i % DOT_COLORS.length] };
    });
    // Any slugs in applications not in jobs table
    applications.forEach((a) => {
      if (!lookup[a.job_slug]) {
        const idx = Object.keys(lookup).length;
        lookup[a.job_slug] = { label: a.job_slug, color: DOT_COLORS[idx % DOT_COLORS.length] };
      }
    });
    return lookup;
  }, [jobs, applications]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications");
      if (res.ok) setApplications(await res.json());
    } catch { /* */ }
  }, []);

  const moveApplication = async (appId: string, newStage: string) => {
    setUpdating(appId);

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, stage: newStage } : a))
    );

    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchApplications();
      }
    } catch {
      fetchApplications();
    } finally {
      setUpdating(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDragItem(appId);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay for the drag image
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragItem(null);
    setDragOverStage(null);
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (dragItem) {
      const app = applications.find((a) => a.id === dragItem);
      if (app && app.stage !== stage) {
        moveApplication(dragItem, stage);
      }
    }
    setDragItem(null);
  };

  const filteredApps = applications.filter(
    (a) => jobFilter === "all" || a.job_slug === jobFilter
  );

  // Only show stages that have candidates or are in the main flow (exclude rejected from columns by default unless it has candidates)
  const visibleStages = STAGES.filter(
    (s) =>
      s !== "REJECTED" || filteredApps.some((a) => a.stage === s)
  );

  if (loading) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-[var(--text-muted)] text-sm">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-full mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Drag candidates between stages · {filteredApps.length} candidate
            {filteredApps.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Job filter */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-[var(--text-muted)] uppercase tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Filter:
          </span>
          {[
            { value: "all", label: "All Jobs" },
            ...Object.entries(jobLookup).map(([slug, info]) => ({
              value: slug,
              label: info.label,
            })),
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setJobFilter(opt.value)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor:
                  jobFilter === opt.value ? "var(--accent)" : "var(--border)",
                color:
                  jobFilter === opt.value
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                background:
                  jobFilter === opt.value
                    ? "rgba(164,30,34,0.08)"
                    : "transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {visibleStages.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.stage === stage);
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-[260px] flex flex-col"
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STAGE_COLORS[stage] }}
                />
                <span
                  className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className="text-xs font-bold ml-auto"
                  style={{ color: STAGE_COLORS[stage] }}
                >
                  {stageApps.length}
                </span>
              </div>

              {/* Column body */}
              <div
                className="flex-1 rounded-lg p-2 space-y-2 transition-colors duration-150"
                style={{
                  background: isOver
                    ? "rgba(164,30,34,0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: isOver
                    ? "1px dashed var(--accent)"
                    : "1px dashed transparent",
                }}
              >
                {stageApps.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-[var(--text-muted)]">
                      {dragItem ? "Drop here" : "Empty"}
                    </p>
                  </div>
                )}

                {stageApps.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      border border-[var(--border)] rounded-lg bg-[var(--card)] p-3 
                      cursor-grab active:cursor-grabbing
                      hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)]
                      transition-all duration-150
                      ${updating === app.id ? "opacity-50" : ""}
                      ${dragItem === app.id ? "ring-1 ring-[var(--accent)]" : ""}
                    `}
                  >
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="block"
                      onClick={(e) => {
                        // Don't navigate if we're dragging
                        if (dragItem) e.preventDefault();
                      }}
                    >
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {app.first_name} {app.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              jobLookup[app.job_slug]?.color || "#6a6a7a",
                          }}
                        />
                        <span className="text-xs text-[var(--text-muted)]">
                          {jobLookup[app.job_slug]?.label || app.job_slug}
                        </span>
                      </div>
                      <p
                        className="text-xs text-[var(--text-muted)] mt-1.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {new Date(app.applied_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
