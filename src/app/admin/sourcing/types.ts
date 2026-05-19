export type GitHubResult = {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  twitter_username: string | null;
  hireable: boolean | null;
  blog: string | null;
  updated_at: string | null;
  top_repos: {
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    topics: string[];
  }[];
};

export type SearchResponse = {
  query: string;
  page: number;
  total_count: number;
  shown_count?: number;
  activity_filtered?: boolean;
  results: GitHubResult[];
  rate_limit: {
    remaining: number | null;
    reset_at: string | null;
    authenticated: boolean;
  };
};

export type Status =
  | "NEW"
  | "CONTACTED"
  | "RESPONDED"
  | "NOT_INTERESTED"
  | "CONVERTED";

export type SourcedCandidate = {
  id: string;
  github_username: string;
  github_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  avatar_url: string | null;
  profile_data: Record<string, unknown>;
  top_repos: GitHubResult["top_repos"];
  matched_job_slugs: string[];
  source: string;
  status: Status;
  notes: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<Status, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  RESPONDED: "Responded",
  NOT_INTERESTED: "Not Interested",
  CONVERTED: "Converted",
};

export const STATUS_COLORS: Record<Status, { bg: string; color: string }> = {
  NEW: { bg: "rgba(106,106,122,0.15)", color: "#9898a8" },
  CONTACTED: { bg: "rgba(37,99,235,0.15)", color: "#60a5fa" },
  RESPONDED: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
  NOT_INTERESTED: { bg: "rgba(220,38,38,0.15)", color: "#f87171" },
  CONVERTED: { bg: "rgba(22,163,74,0.15)", color: "#4ade80" },
};

export const LANGUAGES = [
  "Any",
  "Python",
  "TypeScript",
  "JavaScript",
  "Rust",
  "Go",
  "Java",
  "C++",
];

export const ACTIVITY_FILTERS = [
  { label: "Any time", value: "" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 6 months", value: "180" },
  { label: "Last year", value: "365" },
];

export const TOPICS = [
  { value: "Any", label: "Any" },
  { value: "llm", label: "LLM" },
  { value: "machine-learning", label: "Machine Learning" },
  { value: "artificial-intelligence", label: "Artificial Intelligence" },
  { value: "deep-learning", label: "Deep Learning" },
  { value: "agents", label: "Agents" },
  { value: "rag", label: "RAG" },
  { value: "knowledge-graph", label: "Knowledge Graph" },
  { value: "nlp", label: "NLP" },
  { value: "computer-vision", label: "Computer Vision" },
];

export const FILTER_TABS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "RESPONDED", label: "Responded" },
  { key: "CONVERTED", label: "Converted" },
];
