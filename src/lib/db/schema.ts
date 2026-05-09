/**
 * NX3 Recruit — Database Schema
 *
 * TypeScript types defining the core data model.
 * Will connect to Supabase/Postgres via Drizzle ORM in a future chunk.
 */

// Pipeline stages a candidate moves through
export type PipelineStage =
  | "NEW"
  | "SCREENING"
  | "CHALLENGE" // take-home challenge sent
  | "CHALLENGE_REVIEW" // Dwight is grading the submission
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

// Where the candidate came from
export type CandidateSource =
  | "CAREERS_PAGE" // applied directly
  | "INDEED"
  | "LINKEDIN"
  | "ZIPRECRUITER"
  | "HANDSHAKE"
  | "REFERRAL"
  | "OUTBOUND" // we found them
  | "OTHER";

export type JobStatus = "OPEN" | "PAUSED" | "CLOSED";
export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

// --- Core Tables ---

export interface Job {
  id: string; // ulid
  title: string;
  slug: string; // url-safe identifier
  description: string; // markdown
  location: string;
  type: JobType;
  status: JobStatus;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;

  // Job board syndication
  indeedFeedInclude: boolean;
  linkedinPosted: boolean;
  ziprecruiterPosted: boolean;

  // Screening
  screeningQuestions?: ScreeningQuestion[];

  postedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: "TEXT" | "YES_NO" | "SELECT";
  required: boolean;
  options?: string[]; // for SELECT type
}

export interface Candidate {
  id: string; // ulid
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  location?: string;
  source: CandidateSource;
  sourceDetail?: string; // e.g., "referred by Sarah Higgins"
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string; // ulid
  candidateId: string;
  jobId: string;
  stage: PipelineStage;

  // AI screening
  aiScore?: number; // 0-100
  aiSummary?: string; // Dwight's one-paragraph take
  aiScorecard?: Scorecard;

  // Screening responses
  screeningResponses?: { questionId: string; answer: string }[];

  // Challenge tracking
  challengeSentAt?: Date;
  challengeRepoUrl?: string;
  challengeSubmittedAt?: Date;
  challengeScore?: number;
  challengeScorecard?: string; // markdown

  // Interview tracking
  interviews?: Interview[];

  // Rejection
  rejectedAt?: Date;
  rejectionReason?: string;
  rejectionEmailSent: boolean;

  appliedAt: Date;
  updatedAt: Date;
}

export interface Scorecard {
  systemDesign: number; // 0-40
  codeQuality: number; // 0-30
  creativity: number; // 0-20
  outputQuality: number; // 0-10
  totalScore: number; // 0-100
  summary: string;
  redFlags?: string[];
  greenFlags?: string[];
}

export interface Interview {
  id: string;
  applicationId: string;
  interviewerId: string;
  interviewerName: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: "PHONE_SCREEN" | "TECHNICAL" | "CULTURE" | "FINAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  recommendation?: "STRONG_YES" | "YES" | "MAYBE" | "NO" | "STRONG_NO";
  zoomLink?: string;
}

// --- Outbound Sourcing ---

export interface SourcedCandidate {
  id: string;
  candidateId?: string; // linked if they enter the pipeline
  source: "GITHUB" | "LINKEDIN" | "INDEED_RESUME" | "HANDSHAKE" | "MANUAL";
  profileUrl: string;
  matchScore: number; // 0-100, how well they match open roles
  matchedJobIds: string[];
  status: "NEW" | "CONTACTED" | "RESPONDED" | "NOT_INTERESTED" | "CONVERTED";
  rawProfile?: Record<string, unknown>;
  discoveredAt: Date;
  contactedAt?: Date;
}

// --- Job Board Syndication ---

export interface JobBoardPosting {
  id: string;
  jobId: string;
  board: "INDEED" | "LINKEDIN" | "ZIPRECRUITER" | "GOOGLE_JOBS" | "HANDSHAKE";
  externalId?: string; // ID on the external platform
  status: "ACTIVE" | "PAUSED" | "EXPIRED" | "REMOVED";
  postedAt: Date;
  expiresAt?: Date;
  clicks?: number;
  applications?: number;
}
