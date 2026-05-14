/**
 * Job listings — reads from Supabase database with fallback to hardcoded jobs.
 *
 * Once the jobs table is populated in Supabase, the hardcoded list in jobs.ts
 * is only used as a seed/fallback.
 */

import { createClient } from "@supabase/supabase-js";
import { jobs as hardcodedJobs, type JobListing } from "./jobs";

export type { JobListing };

export interface DbJob {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  department: string;
  summary: string;
  description: string;
  screening_questions: {
    id: string;
    question: string;
    type: "TEXT" | "TEXTAREA" | "YES_NO";
    required: boolean;
  }[];
  status: "OPEN" | "CLOSED" | "DRAFT";
  created_at: string;
  updated_at: string;
}

function dbJobToJobListing(dbJob: DbJob): JobListing {
  return {
    id: dbJob.id,
    slug: dbJob.slug,
    title: dbJob.title,
    location: dbJob.location,
    type: dbJob.type,
    department: dbJob.department,
    summary: dbJob.summary,
    description: dbJob.description,
    screeningQuestions: dbJob.screening_questions || [],
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Get all open jobs — tries database first, falls back to hardcoded.
 */
export async function getOpenJobs(): Promise<JobListing[]> {
  const sb = getSupabase();
  if (!sb) return hardcodedJobs;

  try {
    const { data, error } = await sb
      .from("jobs")
      .select("*")
      .eq("status", "OPEN")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      // Table doesn't exist yet or is empty — use hardcoded
      return hardcodedJobs;
    }

    return (data as DbJob[]).map(dbJobToJobListing);
  } catch {
    return hardcodedJobs;
  }
}

/**
 * Get all jobs (any status) — for admin panel.
 */
export async function getAllJobs(): Promise<DbJob[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as DbJob[];
  } catch {
    return [];
  }
}

/**
 * Get a single job by slug — tries database first, falls back to hardcoded.
 */
export async function getJobBySlug(slug: string): Promise<JobListing | undefined> {
  const sb = getSupabase();
  if (!sb) return hardcodedJobs.find((j) => j.slug === slug);

  try {
    const { data, error } = await sb
      .from("jobs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Fall back to hardcoded
      return hardcodedJobs.find((j) => j.slug === slug);
    }

    return dbJobToJobListing(data as DbJob);
  } catch {
    return hardcodedJobs.find((j) => j.slug === slug);
  }
}
