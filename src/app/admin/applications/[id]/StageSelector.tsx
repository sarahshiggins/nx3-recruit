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
}: {
  applicationId: string;
  currentStage: string;
  stages: string[];
  stageLabels: Record<string, string>;
  stageColors: StageColorMap;
}) {
  const [stage, setStage] = useState(currentStage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleChange(newStage: string) {
    if (newStage === stage) return;
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
        disabled={saving}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
      >
        {stages.map((s) => (
          <option key={s} value={s}>
            {stageLabels[s] ?? s}
          </option>
        ))}
      </select>
    </div>
  );
}
