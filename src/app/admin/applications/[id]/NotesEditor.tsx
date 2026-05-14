"use client";

import { useState, useRef, useEffect } from "react";

export default function NotesEditor({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  useEffect(() => {
    // Don't save on initial mount
    if (notes === initialNotes) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setSaved(false);

      try {
        const res = await fetch(`/api/admin/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });

        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } catch {
        // silently fail — user can retry
      }

      setSaving(false);
    }, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [notes, applicationId, initialNotes]);

  return (
    <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-xs text-[var(--text-muted)] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Notes
        </h2>
        <span className="text-xs text-[var(--text-muted)]">
          {saving ? "Saving…" : saved ? "✓ Saved" : ""}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this candidate..."
        rows={4}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none leading-relaxed"
      />
    </section>
  );
}
