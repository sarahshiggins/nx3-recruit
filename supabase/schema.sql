-- NX3 Recruit — Database Schema
-- Run this in the Supabase SQL editor to set up the tables.

-- Applications table
create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  job_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  resume_url text,
  screening_answers jsonb default '{}',
  stage text not null default 'NEW',
  ai_score integer,
  ai_summary text,
  notes text,
  applied_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Prevent duplicate applications
  unique(email, job_slug)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- Enable Row Level Security (but allow all for now via anon key)
alter table applications enable row level security;

-- Allow inserts from anon key (public applications)
create policy "Allow public inserts" on applications
  for insert with check (true);

-- Allow reads from anon key (for dashboard — will lock down later with auth)
create policy "Allow reads" on applications
  for select using (true);

-- Allow updates (for stage changes)
create policy "Allow updates" on applications
  for update using (true);

-- Index for quick lookups
create index idx_applications_job_slug on applications(job_slug);
create index idx_applications_stage on applications(stage);
create index idx_applications_email on applications(email);
