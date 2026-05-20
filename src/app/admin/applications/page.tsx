import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getJobTitle } from "@/lib/format-job-title";
import { getAllJobs } from "@/lib/jobs-db";
import ApplicationsTable from "./ApplicationsTable";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_slug: string;
  stage: string;
  applied_at: string;
  screening_answers: Record<string, string> | null;
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

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "rgba(106,106,122,0.15)", color: "#9898a8" },
  ZOOM_SCREEN: { bg: "rgba(124,111,205,0.15)", color: "#9b8fd9" },
  INTERVIEW: { bg: "rgba(37,99,235,0.15)", color: "#60a5fa" },
  FINAL_INTERVIEW: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  OFFER: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
  HIRED: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
  REJECTED: { bg: "rgba(220,38,38,0.15)", color: "#f87171" },
};

async function getApplications(jobFilter?: string, stageFilter?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);
  let query = sb
    .from("applications")
    .select("id, first_name, last_name, email, job_slug, stage, applied_at, screening_answers")
    .order("applied_at", { ascending: false });

  if (jobFilter) query = query.eq("job_slug", jobFilter);
  if (stageFilter) query = query.eq("stage", stageFilter);

  const { data } = await query;
  return data as Application[] | null;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; stage?: string }>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "1") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const jobFilter = params.job;
  const stageFilter = params.stage;

  const applications = await getApplications(jobFilter, stageFilter);

  // Build job filter options from DB jobs + any slugs in applications not in DB
  const dbJobs = await getAllJobs();
  const jobOptions: { slug: string; title: string }[] = dbJobs.map((j) => ({ slug: j.slug, title: j.title }));
  const dbSlugs = new Set(dbJobs.map((j) => j.slug));
  const appSlugs = new Set((applications ?? []).map((a) => a.job_slug));
  for (const slug of appSlugs) {
    if (!dbSlugs.has(slug)) {
      jobOptions.push({ slug, title: getJobTitle(slug) });
    }
  }

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {applications?.length ?? 0} result{applications?.length !== 1 ? "s" : ""}
            {jobFilter || stageFilter ? " (filtered)" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Job filter */}
        <FilterGroup label="Job">
          <FilterLink
            href="/admin/applications"
            active={!jobFilter}
            params={stageFilter ? `?stage=${stageFilter}` : ""}
          >
            All jobs
          </FilterLink>
          {jobOptions.map((job) => (
            <FilterLink
              key={job.slug}
              href={`/admin/applications?job=${job.slug}${stageFilter ? `&stage=${stageFilter}` : ""}`}
              active={jobFilter === job.slug}
            >
              {job.title}
            </FilterLink>
          ))}
        </FilterGroup>

        {/* Stage filter */}
        <FilterGroup label="Stage">
          <FilterLink
            href="/admin/applications"
            active={!stageFilter}
            params={jobFilter ? `?job=${jobFilter}` : ""}
          >
            All stages
          </FilterLink>
          {STAGES.map((stage) => (
            <FilterLink
              key={stage}
              href={`/admin/applications?stage=${stage}${jobFilter ? `&job=${jobFilter}` : ""}`}
              active={stageFilter === stage}
            >
              {STAGE_LABELS[stage]}
            </FilterLink>
          ))}
        </FilterGroup>
      </div>

      {!applications ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-muted)] text-sm">Database not configured.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-muted)] text-sm">No applications match this filter.</p>
        </div>
      ) : (
        <ApplicationsTable applications={applications} />
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="text-xs text-[var(--text-muted)] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}:
      </span>
      {children}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
  params = "",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  params?: string;
}) {
  const url = params && !href.includes("?") ? `${href}${params}` : href;
  return (
    <Link
      href={url}
      className="text-xs px-3 py-1 rounded-full border transition-colors"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        background: active ? "rgba(164,30,34,0.08)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
