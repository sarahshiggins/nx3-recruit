import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getJobBySlug } from "@/lib/jobs-db";
import StageSelector from "./StageSelector";
import NotesEditor from "./NotesEditor";
import DeleteButton from "./DeleteButton";
import EmailActions from "./EmailActions";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  job_slug: string;
  stage: string;
  applied_at: string;
  screening_answers: Record<string, string> | null;
  notes: string | null;
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

async function getApplication(id: string): Promise<Application | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Application;
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "1") {
    redirect("/admin/login");
  }

  const { id } = await params;
  const app = await getApplication(id);

  if (!app) {
    notFound();
  }

  const job = await getJobBySlug(app.job_slug);
  const stageStyle = STAGE_COLORS[app.stage] ?? STAGE_COLORS["NEW"];

  // Build screening Q&A pairs
  // Match answers to questions by ID, and fall back to positional matching
  // (handles Recooty-migrated data where keys are q1, q2, q3)
  const screeningQA: { question: string; answer: string }[] = [];
  if (app.screening_answers) {
    const answers = app.screening_answers;
    const questions = job?.screeningQuestions || [];

    // First try matching by ID
    const matchedIds = new Set<string>();
    for (const sq of questions) {
      const answer = answers[sq.id];
      if (answer !== undefined && answer !== null && answer !== "") {
        screeningQA.push({ question: sq.question, answer: String(answer) });
        matchedIds.add(sq.id);
      }
    }

    // For any remaining answers not matched by ID, try positional matching
    const unmatchedAnswers = Object.entries(answers)
      .filter(([k, v]) => !matchedIds.has(k) && v)
      .sort(([a], [b]) => a.localeCompare(b));

    // Match unmatched answers to unmatched questions by position
    const unmatchedQuestions = questions.filter((q) => !matchedIds.has(q.id));
    for (let i = 0; i < unmatchedAnswers.length; i++) {
      const [key, value] = unmatchedAnswers[i];
      const question = unmatchedQuestions[i];
      screeningQA.push({
        question: question?.question || key,
        answer: String(value),
      });
    }
  }

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      {/* Back link */}
      <a
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-8"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ← Back to applications
      </a>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {app.first_name} {app.last_name}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Applied for{" "}
            <span className="text-[var(--text-secondary)]">
              {job?.title ?? app.job_slug}
            </span>{" "}
            ·{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {new Date(app.applied_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
        <span
          className="text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ background: stageStyle.bg, color: stageStyle.color }}
        >
          {STAGE_LABELS[app.stage] ?? app.stage}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact info */}
          <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
            <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Contact
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Email">
                <a
                  href={`mailto:${app.email}`}
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  {app.email}
                </a>
              </InfoRow>
              {app.phone && (
                <InfoRow label="Phone">
                  <a href={`tel:${app.phone}`} className="text-[var(--text-secondary)]">
                    {app.phone}
                  </a>
                </InfoRow>
              )}
              {app.resume_url && (
                <InfoRow label="Resume">
                  <a
                    href={app.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    View resume ↗
                  </a>
                </InfoRow>
              )}
            </dl>
          </section>

          {/* Screening answers */}
          {screeningQA.length > 0 && (
            <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
              <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
                Screening Answers
              </h2>
              <div className="space-y-5">
                {screeningQA.map((qa, i) => (
                  <div key={i} className="border-b border-[var(--border)] last:border-0 pb-4 last:pb-0">
                    <p className="text-xs text-[var(--text-muted)] mb-1.5">{qa.question}</p>
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {qa.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Stage management */}
        <div className="space-y-4">
          <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
            <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Pipeline Stage
            </h2>
            <StageSelector
              applicationId={app.id}
              currentStage={app.stage}
              stages={STAGES}
              stageLabels={STAGE_LABELS}
              stageColors={STAGE_COLORS}
            />
          </section>

          <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
            <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Job
            </h2>
            <p className="text-sm font-medium text-[var(--text)]">{job?.title ?? app.job_slug}</p>
            {job && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{job.department} · {job.type}</p>
            )}
            <a
              href={`/admin/applications?job=${app.job_slug}`}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors mt-3 inline-block"
            >
              View all {job?.title ?? app.job_slug} applicants →
            </a>
          </section>

          <EmailActions
            applicationId={app.id}
            candidateName={`${app.first_name} ${app.last_name}`}
            candidateEmail={app.email}
            stage={app.stage}
          />

          <NotesEditor
            applicationId={app.id}
            initialNotes={app.notes || ""}
          />

          <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-5">
            <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              Danger Zone
            </h2>
            <DeleteButton
              applicationId={app.id}
              candidateName={`${app.first_name} ${app.last_name}`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs text-[var(--text-muted)] w-16 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-[var(--text-secondary)] flex-1">{children}</dd>
    </div>
  );
}
