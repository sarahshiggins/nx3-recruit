import { jobs } from "./jobs";

/**
 * Convert a job slug to a human-readable title.
 * First checks the known jobs list, then applies smart formatting.
 */
export function getJobTitle(slug: string): string {
  const job = jobs.find((j) => j.slug === slug);
  if (job) return job.title;
  return formatSlug(slug);
}

/**
 * Convert any kebab-case slug to a readable title,
 * handling known abbreviations like GenAI, R&D, AI, etc.
 */
export function formatSlug(slug: string): string {
  // Known multi-segment abbreviations (checked first as compound patterns)
  const compounds: [RegExp, string][] = [
    [/(^|-)genai(-|$)/gi, "$1GenAI$2"],
    [/(^|-)r-d(-|$)/gi, "$1R&D$2"],
  ];

  let result = slug;
  for (const [pattern, replacement] of compounds) {
    result = result.replace(pattern, replacement);
  }

  // Single-word abbreviations
  const abbreviations: Record<string, string> = {
    ai: "AI",
    rd: "R&D",
    bd: "BD",
    vp: "VP",
    cto: "CTO",
    ceo: "CEO",
    hr: "HR",
    ui: "UI",
    ux: "UX",
    qa: "QA",
    ml: "ML",
    llm: "LLM",
    saas: "SaaS",
    api: "API",
  };

  return result
    .split("-")
    .map((w) => {
      // Already transformed (has uppercase) — keep it
      if (w !== w.toLowerCase()) return w;
      // Check abbreviations
      if (abbreviations[w.toLowerCase()]) return abbreviations[w.toLowerCase()];
      // Title-case
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
