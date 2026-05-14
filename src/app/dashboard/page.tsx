import Link from "next/link";

export default function Dashboard() {
  const stats = [
    { label: "Open Roles", value: "3" },
    { label: "Active Candidates", value: "13" },
    { label: "Interviews This Week", value: "4" },
    { label: "Avg. Time to Hire", value: "18d" },
  ];

  const recentActivity = [
    {
      action: "New application",
      detail: "Zaryaab Khan applied for GenAI Prototype Engineer",
      time: "2 hours ago",
    },
    {
      action: "Interview scheduled",
      detail: "Shreedeep Nair — R&D Engineer — Tue May 12, 10 AM",
      time: "3 hours ago",
    },
    {
      action: "Challenge submitted",
      detail: "Thomas Kim pushed to GitHub — scoring in progress",
      time: "1 day ago",
    },
    {
      action: "Candidate rejected",
      detail: "Lavanya Nallabelli — R&D Engineer — rejection sent",
      time: "3 hours ago",
    },
  ];

  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-[family-name:var(--font-mono)] text-sm font-bold tracking-widest text-[var(--accent)]">
              NX3 RECRUIT
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-[var(--text)] font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
              >
                Admin →
              </Link>
              <span className="text-sm text-[var(--text-muted)] cursor-not-allowed">
                Pipeline
              </span>
              <span className="text-sm text-[var(--text-muted)] cursor-not-allowed">
                Sourcing
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors"
          >
            View careers page →
          </Link>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Recruiting overview for Nexus3
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5"
            >
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentActivity.map((item, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    {item.detail}
                  </p>
                </div>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] shrink-0 ml-4">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-10 mb-20 border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Pipeline kanban, candidate profiles, AI screening scores, and job
            board syndication coming next.
          </p>
        </div>
      </div>
    </main>
  );
}
