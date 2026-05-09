"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getJobBySlug } from "@/lib/jobs";

function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-[family-name:var(--font-mono)] text-sm font-bold tracking-widest text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            NX3
          </Link>
          <span className="text-[var(--text-muted)] text-sm">/ careers /</span>
          <span className="text-[var(--text-muted)] text-sm">apply</span>
        </div>
        <Link
          href="/"
          className="text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors"
        >
          ← All positions
        </Link>
      </div>
    </nav>
  );
}

export default function JobPage() {
  const params = useParams();
  const slug = params.slug as string;
  const job = getJobBySlug(slug);

  const [formData, setFormData] = useState<Record<string, string>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resume: "",
  });
  const [screeningAnswers, setScreeningAnswers] = useState<
    Record<string, string>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Position not found</h1>
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Back to all positions
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission — will connect to API later
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Application submitted:", {
      job: job.slug,
      candidate: formData,
      screeningAnswers,
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Application received</h1>
          <p className="text-[var(--text-secondary)] text-lg mb-8">
            Thanks for applying to {job.title} at Nexus3 Capital. We&apos;ll review
            your application and get back to you soon.
          </p>
          <Link
            href="/"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            ← Back to all positions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Job Description */}
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.25em] uppercase text-[var(--accent)]">
                {job.department}
              </span>
              <span className="text-[var(--text-muted)] text-xs">·</span>
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                {job.location}
              </span>
              <span className="text-[var(--text-muted)] text-xs">·</span>
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                {job.type}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-8">{job.title}</h1>

            <div className="prose prose-invert max-w-none">
              {job.description.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-xl font-semibold mt-10 mb-4 text-[var(--text)]"
                    >
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                if (block.startsWith("- ")) {
                  const items = block.split("\n").filter((l) => l.startsWith("- "));
                  return (
                    <ul key={i} className="space-y-2 mb-6">
                      {items.map((item, j) => (
                        <li
                          key={j}
                          className="text-[var(--text-secondary)] leading-relaxed flex gap-2"
                        >
                          <span className="text-[var(--accent)] mt-1.5 shrink-0">
                            ·
                          </span>
                          {item.replace("- ", "")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-[var(--text-secondary)] leading-relaxed mb-4"
                  >
                    {block}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:pt-8">
            <div className="sticky top-20">
              <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6">
                <h2 className="text-lg font-semibold mb-6">Apply for this role</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                        First name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                        Last name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                      Resume *
                    </label>
                    <div className="border border-dashed border-[var(--border)] rounded px-3 py-4 text-center hover:border-[var(--border-hover)] transition-colors cursor-pointer">
                      <p className="text-[var(--text-muted)] text-sm">
                        Drop your resume here or click to upload
                      </p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">
                        PDF, DOC, or DOCX
                      </p>
                    </div>
                  </div>

                  {/* Screening Questions */}
                  {job.screeningQuestions.length > 0 && (
                    <div className="pt-4 border-t border-[var(--border)]">
                      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">
                        Screening Questions
                      </p>
                      {job.screeningQuestions.map((q) => (
                        <div key={q.id} className="mb-4">
                          <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                            {q.question}
                            {q.required && (
                              <span className="text-[var(--accent)]"> *</span>
                            )}
                          </label>
                          {q.type === "TEXTAREA" ? (
                            <textarea
                              required={q.required}
                              rows={4}
                              value={screeningAnswers[q.id] || ""}
                              onChange={(e) =>
                                setScreeningAnswers({
                                  ...screeningAnswers,
                                  [q.id]: e.target.value,
                                })
                              }
                              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                            />
                          ) : q.type === "YES_NO" ? (
                            <div className="flex gap-4">
                              {["Yes", "No"].map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value={opt}
                                    required={q.required}
                                    onChange={(e) =>
                                      setScreeningAnswers({
                                        ...screeningAnswers,
                                        [q.id]: e.target.value,
                                      })
                                    }
                                    className="accent-[var(--accent)]"
                                  />
                                  <span className="text-sm text-[var(--text-secondary)]">
                                    {opt}
                                  </span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              required={q.required}
                              value={screeningAnswers[q.id] || ""}
                              onChange={(e) =>
                                setScreeningAnswers({
                                  ...screeningAnswers,
                                  [q.id]: e.target.value,
                                })
                              }
                              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
