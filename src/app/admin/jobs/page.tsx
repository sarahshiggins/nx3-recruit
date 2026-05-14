"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Job = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  department: string;
  summary: string;
  description: string;
  screening_questions: { id: string; question: string; type: string; required: boolean }[];
  status: "OPEN" | "CLOSED" | "DRAFT";
  created_at: string;
  updated_at: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  OPEN: { bg: "rgba(22,163,74,0.15)", color: "#4ade80", label: "Open" },
  CLOSED: { bg: "rgba(106,106,122,0.15)", color: "#9898a8", label: "Closed" },
  DRAFT: { bg: "rgba(217,119,6,0.15)", color: "#f59e0b", label: "Draft" },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Postings</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {jobs.length} posting{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
        >
          + New Job
        </button>
      </div>

      {showCreate && (
        <CreateJobForm
          onCreated={() => { setShowCreate(false); fetchJobs(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-muted)] text-sm mb-2">No job postings yet.</p>
          <p className="text-[var(--text-muted)] text-xs">
            Jobs table may not be set up. Run the schema SQL in Supabase, or click &quot;+ New Job&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onUpdate={fetchJobs} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, onUpdate }: { job: Job; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const status = STATUS_STYLES[job.status] || STATUS_STYLES.DRAFT;

  async function toggleStatus() {
    setToggling(true);
    const newStatus = job.status === "OPEN" ? "CLOSED" : "OPEN";

    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdate();
    } catch { /* silently fail */ }

    setToggling(false);
  }

  if (editing) {
    return (
      <EditJobForm
        job={job}
        onSaved={() => { setEditing(false); onUpdate(); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-[var(--text)]">{job.title}</h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
            <span>{job.location}</span>
            <span>·</span>
            <span>{job.type}</span>
            <span>·</span>
            <span>{job.department}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{job.summary}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2" style={{ fontFamily: "var(--font-mono)" }}>
            {job.screening_questions?.length || 0} screening question{job.screening_questions?.length !== 1 ? "s" : ""}
            {" · "}
            /{job.slug}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
          >
            {job.status === "OPEN" ? "Close" : "Reopen"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Edit
          </button>
          <Link
            href={`/jobs/${job.slug}`}
            target="_blank"
            className="text-xs font-medium px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Preview ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

function CreateJobForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    location: "Chicago, IL",
    type: "Full-time",
    department: "Engineering",
    summary: "",
    description: "",
    status: "OPEN",
  });
  const [questions, setQuestions] = useState<{ id: string; question: string; type: string; required: boolean }[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          screening_questions: questions,
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create job");
      }
    } catch {
      setError("Network error");
    }

    setSaving(false);
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      { id: `q${Date.now()}`, question: "", type: "TEXTAREA", required: false },
    ]);
  }

  function updateQuestion(index: number, updates: Partial<typeof questions[0]>) {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="border border-[var(--accent)]/30 rounded-lg bg-[var(--card)] p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">New Job Posting</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Job Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. GenAI R&D Engineer" required />
          <FormField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} placeholder="e.g. Engineering" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "OPEN" | "DRAFT" | "CLOSED" })}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            >
              <option value="OPEN">Open</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        <FormField label="Summary *" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} placeholder="One-line description shown on the careers page" required />
        <div>
          <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={"## About the Role\n\nDescribe the role...\n\n## What You Will Do\n\n- Responsibility 1\n- Responsibility 2\n\n## Requirements\n\n- Requirement 1"}
            rows={10}
            required
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none font-[family-name:var(--font-mono)]"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">Use ## for headings, - for bullet points</p>
        </div>

        {/* Screening Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Screening Questions
            </label>
            <button
              type="button"
              onClick={addQuestion}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              + Add question
            </button>
          </div>
          {questions.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">No screening questions. Click &quot;+ Add question&quot; to add one.</p>
          )}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-[var(--border)] rounded p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, { question: e.target.value })}
                    placeholder="Question text"
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(i, { type: e.target.value })}
                    className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none"
                  >
                    <option value="TEXTAREA">Long text</option>
                    <option value="TEXT">Short text</option>
                    <option value="YES_NO">Yes / No</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-[var(--text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                      className="accent-[var(--accent)]"
                    />
                    Req
                  </label>
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Job"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EditJobForm({ job, onSaved, onCancel }: { job: Job; onSaved: () => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: job.title,
    location: job.location,
    type: job.type,
    department: job.department,
    summary: job.summary,
    description: job.description,
    status: job.status,
  });
  const [questions, setQuestions] = useState(job.screening_questions || []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          screening_questions: questions,
        }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update job");
      }
    } catch {
      setError("Network error");
    }

    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
      if (res.ok) onSaved();
    } catch { /* */ }
    setDeleting(false);
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      { id: `q${Date.now()}`, question: "", type: "TEXTAREA", required: false },
    ]);
  }

  function updateQuestion(index: number, updates: Partial<typeof questions[0]>) {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="border border-[var(--accent)]/30 rounded-lg bg-[var(--card)] p-6 mb-3">
      <h2 className="text-lg font-semibold mb-4">Edit: {job.title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Job Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <FormField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "OPEN" | "DRAFT" | "CLOSED" })} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors">
              <option value="OPEN">Open</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        <FormField label="Summary *" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} required />
        <div>
          <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={10}
            required
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none font-[family-name:var(--font-mono)]"
          />
        </div>

        {/* Screening Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider">Screening Questions</label>
            <button type="button" onClick={addQuestion} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">+ Add question</button>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-[var(--border)] rounded p-3">
                <div className="flex gap-2">
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} placeholder="Question text" className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors" />
                  <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })} className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none">
                    <option value="TEXTAREA">Long text</option>
                    <option value="TEXT">Short text</option>
                    <option value="YES_NO">Yes / No</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-[var(--text-muted)] cursor-pointer">
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} className="accent-[var(--accent)]" />
                    Req
                  </label>
                  <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors px-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={onCancel} className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            Cancel
          </button>
          <div className="ml-auto">
            {!confirmDeleteJob ? (
              <button type="button" onClick={() => setConfirmDeleteJob(true)} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors">
                Delete posting
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50">
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
                <button type="button" onClick={() => setConfirmDeleteJob(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
      />
    </div>
  );
}
