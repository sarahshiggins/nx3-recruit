import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOpenJobs } from "@/lib/jobs-db";

type Board = {
  key: string;
  name: string;
  color: string;
  initials: string;
  status: "Feed Ready" | "Active" | "Manual";
  statusColor: { bg: string; color: string };
  feedUrl?: string;
  description: string;
};

const STATUS_GREEN = {
  bg: "rgba(22,163,74,0.15)",
  color: "#4ade80",
};

const STATUS_YELLOW = {
  bg: "rgba(217,119,6,0.15)",
  color: "#f59e0b",
};

const FEED_BASE = "https://nx3-recruit.vercel.app";

const BOARDS: Board[] = [
  {
    key: "indeed",
    name: "Indeed",
    color: "#2557a7",
    initials: "in",
    status: "Feed Ready",
    statusColor: STATUS_GREEN,
    feedUrl: `${FEED_BASE}/api/feed/indeed`,
    description:
      "Indeed pulls our XML feed on a regular schedule. Submit the feed URL once via Indeed's free job posting program and new openings will appear automatically.",
  },
  {
    key: "ziprecruiter",
    name: "ZipRecruiter",
    color: "#19b821",
    initials: "Z",
    status: "Feed Ready",
    statusColor: STATUS_GREEN,
    feedUrl: `${FEED_BASE}/api/feed/ziprecruiter`,
    description:
      "ZipRecruiter ingests our XML feed and syndicates listings across its partner network. Submit the feed URL through your ZipRecruiter employer account.",
  },
  {
    key: "google",
    name: "Google Jobs",
    color: "#4285f4",
    initials: "G",
    status: "Active",
    statusColor: STATUS_GREEN,
    description:
      "Already live via JSON-LD structured data on each job page. Google crawls our careers site directly — no feed submission required.",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    color: "#0a66c2",
    initials: "in",
    status: "Manual",
    statusColor: STATUS_YELLOW,
    description: "Post manually with link to careers page.",
  },
];

function StatusBadge({ status, colors }: { status: string; colors: { bg: string; color: string } }) {
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.color }}
    >
      {status}
    </span>
  );
}

function BoardIcon({ color, initials }: { color: string; initials: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-sm"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function BoardCard({ board }: { board: Board }) {
  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <BoardIcon color={board.color} initials={board.initials} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-[var(--text)]">{board.name}</h3>
            <StatusBadge status={board.status} colors={board.statusColor} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {board.description}
          </p>
        </div>
      </div>

      {board.feedUrl && (
        <div>
          <p
            className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Feed URL
          </p>
          <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2">
            <code
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)] truncate flex-1"
              title={board.feedUrl}
            >
              {board.feedUrl}
            </code>
            <CopyButton value={board.feedUrl} />
            <a
              href={board.feedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-1"
              title="Open feed"
            >
              ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Server-component-friendly copy control. Renders a small client island.
import CopyButton from "./CopyButton";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SyndicationPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "1") {
    redirect("/admin/login");
  }

  const openJobs = await getOpenJobs();

  // jobs-db JobListing doesn't expose created_at, so we fall back to "—".
  // If the row came from Supabase it would carry extra fields, but the
  // public shape here is the careers-page shape.
  type AnyJob = (typeof openJobs)[number] & { created_at?: string; updated_at?: string };

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Job Board Syndication</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Distribute your job postings across major job boards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {BOARDS.map((board) => (
          <BoardCard key={board.key} board={board} />
        ))}
      </div>

      <div className="border border-[var(--border)] rounded-lg bg-[var(--card)]">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Feed Preview</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {openJobs.length} open posting{openJobs.length !== 1 ? "s" : ""} currently syndicated
            </p>
          </div>
        </div>
        {openJobs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[var(--text-muted)]">No open jobs to syndicate.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {openJobs.map((job) => {
              const j = job as AnyJob;
              return (
                <div
                  key={job.slug}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {job.title}
                    </p>
                    <p
                      className="text-xs text-[var(--text-muted)] mt-0.5 truncate"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      /{job.slug}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-xs text-[var(--text-secondary)] shrink-0">
                    <span>{job.location}</span>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span>{job.type}</span>
                  </div>
                  <span
                    className="text-xs text-[var(--text-muted)] shrink-0 hidden md:block"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatDate(j.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
