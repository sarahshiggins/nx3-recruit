-- Scan history table for tracking automated GitHub scans
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type TEXT NOT NULL DEFAULT 'github_automated',
  queries_run INTEGER NOT NULL DEFAULT 0,
  total_searched INTEGER NOT NULL DEFAULT 0,
  total_added INTEGER NOT NULL DEFAULT 0,
  total_skipped_existing INTEGER NOT NULL DEFAULT 0,
  total_skipped_inactive INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);

-- Add scan metadata columns to sourced_candidates if not already present
-- (profile_data JSONB already stores scan_source, scan_query, scan_date)
