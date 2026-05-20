"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StageColorMap = Record<string, { bg: string; color: string }>;

export default function StageSelector({
  applicationId,
  currentStage,
  stages,
  stageLabels,
  stageColors,
  candidateEmail,
}: {
  applicationId: string;
  currentStage: string;
  stages: string[];
  stageLabels: Record<string, string>;
  stageColors: StageColorMap;
  candidateEmail?: string;
}) {
  const [stage, setStage] = useState(currentStage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectSending, setRejectSending] = useState(false);
  const router = useRouter();

  async function handleChange(newStage: string) {
    if (newStage === stage) return;

    // If selecting Rejected, show the confirm dialog instead
    if (newStage === "REJECTED") {
      setShowRejectConfirm(true);
      return;
    }

    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });

    if (res.ok) {
      setStage(newStage);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }

    setSaving(false);
  }

  async function handleReject(sendEmail: boolean) {
    setRejectSending(true);

    // Update stage to REJECTED
    const stageRes = await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "REJECTED" }),
    });

    if (stageRes.ok) {
      setStage("REJECTED");

      // Send rejection email if requested
      if (sendEmail) {
        await fetch(`/api/admin/applications/${applicationId}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "rejection" }),
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }

    setRejectSending(false);
    setShowRejectConfirm(false);
  }

  const currentStyle = stageColors[stage] ?? stageColors["NEW"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: currentStyle.bg, color: currentStyle.color }}
        >
          {stageLabels[stage] ?? stage}
        </span>
        {saving && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
        {saved && <span className="text-xs text-green-400">Saved ✓</span>}
      </div>

      <select
        value={stage}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving || rejectSending}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
      >
        {stages.map((s) => (
          <option key={s} value={s}>
            {stageLabels[s] ?? s}
          </option>
        ))}
      </select>

      {showRejectConfirm && (
        <div className="border border-red-800/30 rounded-lg bg-red-900/10 p-4 space-y-3">
          <p className="text-sm text-red-300 font-medium">Reject this candidate?</p>
          {candidateEmail && (
            <p className="text-xs text-[var(--text-muted)]">Email: {candidateEmail}</p>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleReject(true)}
              disabled={rejectSending}
              className="w-full text-left text-sm px-3 py-2.5 rounded border border-red-800/30 hover:bg-red-900/20 text-red-400 transition-colors disabled:opacity-50"
            >
              {rejectSending ? "Sending…" : "✉ Reject + Send Email"}
            </button>
            <button
              onClick={() => handleReject(false)}
              disabled={rejectSending}
              className="w-full text-left text-sm px-3 py-2.5 rounded border border-[var(--border)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] transition-colors disabled:opacity-50"
            >
              Reject (No Email)
            </button>
            <button
              onClick={() => setShowRejectConfirm(false)}
              className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
