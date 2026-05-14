import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { jobs } from "@/lib/jobs";

function getStageBadge(stage: string) {
  const map: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "#6a6a7a" },
    ZOOM_SCREEN: { label: "Zoom Screen", color: "#7c6fcd" },
    INTERVIEW: { label: "Interview", color: "#2563eb" },
    FINAL_INTERVIEW: { label: "Final Interview", color: "#6366f1" },
    OFFER: { label: "Offer", color: "#7c3aed" },
    HIRED: { label: "Hired", color: "#16a34a" },
    REJECTED: { label: "Rejected", color: "#dc2626" },
  };
  return map[stage] ?? { label: stage, color: "#6a6a7a" };
}

function getJobTitle(slug: string) {
  const job = jobs.find((j) => j.slug === slug);
  return job?.title ?? slug;
}

async function getAdminData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);

  const [{ data: allApps }, { data: recent }] = await Promise.all([
    sb.from("applications").select("job_slug, stage"),
    sb
      .from("applications")
      .select("id, first_name, last_name, job_slug, stage, applied_at")
      .order("applied_at", { ascending: false })
      .limit(10),
  ]);

  const total = allApps?.length ?? 0;
  const byJob: Record<string, number> = {};
  const byStage: Record<string, number> = {};

  for (const app of allApps ?? []) {
    byJob[app.job_slug] = (byJob[app.job_slug] ?? 0) + 1;
    byStage[app.stage] = (byStage[app.stage] ?? 0) + 1;
  }

  return { total, byJob, byStage, recent };
}

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "1") {
    redirect("/admin/login");
  }

  const data = await getAdminData();

  const jobLabels: Record<string, string> = {
    "genai-prototype-engineer": "GenAI Prototype Engineer",
    "genai-rd-engineer": "GenAI R&D Engineer",
    "bd-intern": "BD Intern",
  };

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Recruiting overview — Nexus3
        </p>
      </div>

      {!data ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Applications" value={data.total.toString()} />
            <StatCard label="New" value={(data.byStage["NEW"] ?? 0).toString()} />
            <StatCard label="In Interview" value={(data.byStage["INTERVIEW"] ?? 0).toString()} />
            <Link
              href="/admin/pipeline"
              className="border border-[var(--accent)]/30 rounded-lg bg-[var(--accent)]/5 p-5 hover:bg-[var(--accent)]/10 transition-colors group"
            >
              <p
                className="text-xs text-[var(--accent)] uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Pipeline
              </p>
              <p className="text-lg font-bold text-[var(--text)] group-hover:text-white transition-colors">
                View Pipeline →
              </p>
            </Link>
          </div>

          {/* Per-job breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {jobs.map((job) => (
              <div
                key={job.slug}
                className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5"
              >
                <p
                  className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {job.department}
                </p>
                <p className="font-semibold text-sm text-[var(--text)] mb-3">{job.title}</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">
                    {data.byJob[job.slug] ?? 0}
                  </span>
                  <Link
                    href={`/admin/applications?job=${job.slug}`}
                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    View pipeline →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Stage breakdown */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] mb-8">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-sm">Applications by Stage</h2>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-3">
              {Object.entries(data.byStage).map(([stage, count]) => {
                const badge = getStageBadge(stage);
                return (
                  <Link
                    key={stage}
                    href={`/admin/applications?stage=${stage}`}
                    className="flex items-center gap-2 border border-[var(--border)] rounded-full px-3 py-1.5 hover:border-[var(--border-hover)] transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: badge.color }}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">{badge.label}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: badge.color }}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
              {Object.keys(data.byStage).length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No applications yet.</p>
              )}
            </div>
          </div>

          {/* Recent applications */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold text-sm">Recent Applications</h2>
              <Link
                href="/admin/applications"
                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                View all →
              </Link>
            </div>
            {data.recent && data.recent.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {data.recent.map((app) => {
                  const badge = getStageBadge(app.stage);
                  return (
                    <Link
                      key={app.id}
                      href={`/admin/applications/${app.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--card-hover)] transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] group-hover:text-white transition-colors truncate">
                            {app.first_name} {app.last_name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {getJobTitle(app.job_slug)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <StageBadge stage={app.stage} />
                        <span
                          className="text-xs text-[var(--text-muted)] hidden md:block"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {new Date(app.applied_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[var(--text-muted)]">No applications yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
      <p
        className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    NEW: { label: "New", bg: "rgba(106,106,122,0.15)", color: "#9898a8" },
    ZOOM_SCREEN: { label: "Zoom Screen", bg: "rgba(124,111,205,0.15)", color: "#9b8fd9" },
    INTERVIEW: { label: "Interview", bg: "rgba(37,99,235,0.15)", color: "#60a5fa" },
    FINAL_INTERVIEW: { label: "Final Interview", bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
    OFFER: { label: "Offer", bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
    HIRED: { label: "Hired", bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
    REJECTED: { label: "Rejected", bg: "rgba(220,38,38,0.15)", color: "#f87171" },
  };

  const s = map[stage] ?? { label: stage, bg: "rgba(106,106,122,0.15)", color: "#9898a8" };
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
