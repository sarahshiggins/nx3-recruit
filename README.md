# NX3 Recruit

AI-native recruiting platform built by [Nexus3](https://nexus3.ai). Replaces third-party ATS tools with a single app covering job postings, candidate pipeline management, job board syndication, and outbound GitHub sourcing.

**Live:** [careers.nexus3.ai](https://careers.nexus3.ai) · **Admin:** [careers.nexus3.ai/admin](https://careers.nexus3.ai/admin)

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres + Storage)
- **Email:** Resend (transactional emails from `recruiting@nexus3cap.com`)
- **Deployment:** Vercel (with Vercel Cron for scheduled jobs)

## Features

### Careers Page
- Public-facing job listings at `/jobs` — reads open positions from Supabase with hardcoded fallback
- Individual job pages with full descriptions, requirements, and screening questions
- Application form with resume upload (PDF/DOC/DOCX, 10MB max via Supabase Storage)
- Google Jobs JSON-LD structured data on every job page for organic search visibility
- Nexus3 branding, favicon, and Open Graph metadata

### Admin Dashboard (`/admin`)
- Password-protected admin panel
- Overview dashboard with application stats (total, by job, by stage)
- Full job management — create, edit, close, and delete postings with a screening question builder

### Applications & Pipeline (`/admin/applications`, `/admin/pipeline`)
- Applications list with filtering by job and stage
- Individual candidate detail view with resume link, screening answers, and notes
- Drag-and-drop pipeline kanban board with stages: New → Zoom Screen → Interview → Final Interview → Offer → Hired → Rejected
- Candidate email actions — send rejection or advancement emails directly from the app
- Bulk reject with two modes: "Reject + send email" or "Reject (no email)"
- Email notifications to configurable addresses on new applications (via `NOTIFY_EMAILS` env var)

### Job Board Syndication (`/admin/syndication`)
Auto-generated XML/JSON feeds for one-click submission to job boards:
- **Indeed** — XML feed at `/api/feed/indeed`
- **ZipRecruiter** — XML feed at `/api/feed/ziprecruiter`
- **Google Jobs** — live via JSON-LD (no feed needed)
- **Jooble** — XML feed at `/api/feed/jooble`
- **Jora** — XML feed at `/api/feed/jora`
- **CareerJet** — XML feed at `/api/feed/careerjet`
- **PostJobFree** — XML feed at `/api/feed/postjobfree`
- **LinkedIn** — manual posting (no API feed)
- JSON API at `/api/jobs` for custom integrations

### Outbound Sourcing (`/admin/sourcing`)
- **Manual GitHub search** — find developers by location, language, topic (LLM, ML, agents, RAG, NLP, etc.), and activity recency. Enriches each profile with top repos, last push date, followers, bio, and email.
- **Automated weekly scan** — Vercel Cron job (`/api/cron/github-scan`) runs every Monday at 9 AM CT:
  - Profile-based search: queries GitHub User Search for AI/ML devs in Chicago and across Illinois
  - Repo-based discovery: searches repos by topic (`llm`, `machine-learning`, `rag`, `deep-learning`) and checks if the owner is in Illinois — catches devs who have ML projects but don't mention AI in their bio
  - Auto-enriches profiles (repos, activity, email, company) and de-duplicates against existing pipeline
  - Sends a digest email via Resend when new candidates are found
  - Scan history logged to `scan_history` table
- **Sourced candidate pipeline** — status tracking (New → Contacted → Responded → Not Interested → Converted), notes field, "Mark as Contacted" button, and delete

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (for storage + cron) |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `ADMIN_PASSWORD` | Yes | Admin panel password |
| `GITHUB_TOKEN` | Recommended | GitHub PAT for sourcing (5,000 req/hr vs 60/hr without) |
| `CRON_SECRET` | Optional | Auth secret for cron endpoints (auto-set on Vercel Pro) |
| `NOTIFY_EMAILS` | Optional | Comma-separated emails for new application notifications (default: `sarah.higgins@nexus3cap.com`) |
| `NEXT_PUBLIC_APP_URL` | Optional | App URL for email links (default: `https://careers.nexus3.ai`) |

## Database Tables

| Table | Description |
|---|---|
| `jobs` | Job listings (title, slug, description, screening questions, status) |
| `applications` | Candidate applications (name, email, resume, screening answers, stage) |
| `sourced_candidates` | Outbound-sourced GitHub profiles with pipeline status |
| `scan_history` | Automated GitHub scan run logs |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set environment variables in `.env.local` — see the table above.

## Deployment

Deployed on Vercel with auto-deploy from `main`. Vercel Cron handles the weekly GitHub sourcing scan.

Custom domain: `careers.nexus3.ai` (CNAME → `cname.vercel-dns.com`)

## License

Private — Nexus3
