import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-xs font-bold tracking-widest text-[var(--accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              NX3 RECRUIT
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-[var(--text)] font-medium hover:text-[var(--text)] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/applications"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Applications
              </Link>
              <Link
                href="/admin/pipeline"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Pipeline
              </Link>
              <Link
                href="/admin/jobs"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Jobs
              </Link>
              <Link
                href="/admin/syndication"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Syndication
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors"
            >
              Careers page →
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="pt-14">{children}</div>
    </div>
  );
}

function LogoutButton() {
  // Client component inlined approach — use a form for server action or a simple link
  // We'll use a simple client component rendered here
  return <LogoutLink />;
}

// Minimal client component for logout
import LogoutLink from "./LogoutLink";
