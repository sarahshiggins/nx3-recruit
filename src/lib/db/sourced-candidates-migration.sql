-- Migration: create sourced_candidates table for GitHub talent sourcing
-- Run this in Supabase SQL editor (or via supabase CLI).
--
-- Status options:
--   NEW            - just added, not contacted yet
--   CONTACTED      - we reached out
--   RESPONDED      - they replied (positive or interested)
--   NOT_INTERESTED - declined / unresponsive
--   CONVERTED      - moved into the main applications pipeline

CREATE TABLE IF NOT EXISTS sourced_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_username TEXT NOT NULL,
  github_url TEXT NOT NULL,
  name TEXT,
  email TEXT,
  bio TEXT,
  location TEXT,
  company TEXT,
  avatar_url TEXT,
  profile_data JSONB DEFAULT '{}',
  top_repos JSONB DEFAULT '[]',
  match_score INTEGER DEFAULT 0,
  matched_job_slugs TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'GITHUB',
  status TEXT NOT NULL DEFAULT 'NEW',
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(github_username)
);

CREATE INDEX IF NOT EXISTS sourced_candidates_status_idx
  ON sourced_candidates (status);

CREATE INDEX IF NOT EXISTS sourced_candidates_created_at_idx
  ON sourced_candidates (created_at DESC);

-- Auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION sourced_candidates_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sourced_candidates_updated_at ON sourced_candidates;
CREATE TRIGGER sourced_candidates_updated_at
  BEFORE UPDATE ON sourced_candidates
  FOR EACH ROW
  EXECUTE FUNCTION sourced_candidates_set_updated_at();
