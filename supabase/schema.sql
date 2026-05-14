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

-- Allow updates (for stage changes + notes)
create policy "Allow updates" on applications
  for update using (true);

-- Allow deletes (admin cleanup)
create policy "Allow deletes" on applications
  for delete using (true);

-- Allow deletes on storage objects (resume cleanup)
create policy "Allow deletes on resumes" on storage.objects
  for delete using (bucket_id = 'resumes');

-- Index for quick lookups
create index idx_applications_job_slug on applications(job_slug);
create index idx_applications_stage on applications(stage);
create index idx_applications_email on applications(email);

-- Jobs table
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  location text not null default 'Chicago, IL',
  type text not null default 'Full-time',
  department text not null default 'Engineering',
  summary text not null,
  description text not null,
  screening_questions jsonb default '[]',
  status text not null default 'OPEN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

alter table jobs enable row level security;

create policy "Allow public reads on jobs" on jobs
  for select using (true);

create policy "Allow inserts on jobs" on jobs
  for insert with check (true);

create policy "Allow updates on jobs" on jobs
  for update using (true);

create policy "Allow deletes on jobs" on jobs
  for delete using (true);

create index idx_jobs_slug on jobs(slug);
create index idx_jobs_status on jobs(status);

-- Resume storage bucket
insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', true)
  on conflict (id) do nothing;

-- Allow public uploads to resumes bucket (applications are anonymous)
create policy "Allow public uploads to resumes" on storage.objects
  for insert with check (bucket_id = 'resumes');

-- Allow public reads from resumes bucket
create policy "Allow public reads from resumes" on storage.objects
  for select using (bucket_id = 'resumes');
