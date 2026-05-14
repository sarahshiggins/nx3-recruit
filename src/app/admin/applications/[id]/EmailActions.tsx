"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailActions({
  applicationId,
  candidateName,
  candidateEmail,
  stage,
}: {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  stage: string;
}) {
  const [action, setAction] = useState<"rejection" | "advancement" | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSend() {
    if (!action) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: action,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSent(action === "rejection" ? "Rejection email sent" : "Advancement email sent");
        setAction(null);
        setCustomMessage("");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send email");
      }
    } catch {
      setError("Network error");
    }

    setSending(false);
  }

  if (stage === "REJECTED" && !action) {
    return (
      <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
        <h2
          className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Email Candidate
        </h2>
        {sent && (
          <p className="text-xs text-green-400 mb-3">✓ {sent}</p>
        )}
        <p className="text-xs text-[var(--text-muted)]">Candidate has been rejected.</p>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
      <h2
        className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Email Candidate
      </h2>

      {sent && !action && (
        <p className="text-xs text-green-400 mb-3">✓ {sent}</p>
      )}

      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      {!action ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)] mb-2">
            Send to {candidateEmail}
          </p>
          <button
            onClick={() => setAction("advancement")}
            className="w-full text-left text-sm px-3 py-2 rounded border border-[var(--border)] hover:border-green-800/50 hover:bg-green-900/10 text-[var(--text-secondary)] hover:text-green-400 transition-colors"
          >
            ✉ Advance — send next steps email
          </button>
          <button
            onClick={() => setAction("rejection")}
            className="w-full text-left text-sm px-3 py-2 rounded border border-[var(--border)] hover:border-red-800/50 hover:bg-red-900/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
          >
            ✉ Reject — send decline email
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{
              color: action === "rejection" ? "#f87171" : "#4ade80"
            }}>
              {action === "rejection" ? "Rejection" : "Advancement"} email
            </p>
            <button
              onClick={() => { setAction(null); setCustomMessage(""); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            To: {candidateName} ({candidateEmail})
          </p>

          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message (optional)..."
            rows={3}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
          />

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full text-sm font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
            style={{
              background: action === "rejection" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)",
              color: action === "rejection" ? "#f87171" : "#4ade80",
            }}
          >
            {sending ? "Sending…" : `Send ${action === "rejection" ? "rejection" : "advancement"} email`}
          </button>
        </div>
      )}
    </section>
  );
}
