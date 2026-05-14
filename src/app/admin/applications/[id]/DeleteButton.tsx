"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  applicationId,
  candidateName,
}: {
  applicationId: string;
  candidateName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/applications");
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="border border-red-800/30 bg-red-900/10 rounded-lg p-4">
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Delete <strong className="text-[var(--text)]">{candidateName}</strong>? This can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
    >
      Delete application
    </button>
  );
}
