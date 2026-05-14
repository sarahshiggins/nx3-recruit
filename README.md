# NX3 Recruit

AI-native recruiting platform built by [Nexus3](https://nexus3.ai).

Job board syndication, AI-powered candidate screening, pipeline management, and outbound sourcing — all in one tool.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres) — coming soon
- **ORM:** Drizzle — coming soon
- **AI:** OpenAI / Anthropic APIs for screening + scoring
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

### Phase 1 — Foundation ✅
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Careers landing page
- [x] Database schema design
- [ ] Connect database (Supabase)
- [ ] Job CRUD + dynamic careers page

### Phase 2 — Candidate Pipeline
- [ ] Application intake form
- [ ] Pipeline kanban board (drag-and-drop stages)
- [ ] Candidate detail view (resume, screening, scorecard)
- [ ] Email integration (outreach, rejections, scheduling)

### Phase 3 — AI Screening
- [ ] Auto-screen new applications (resume + screening answers)
- [ ] Generate candidate scorecards
- [ ] Challenge management (send, track, auto-grade submissions)

### Phase 4 — Job Board Syndication
- [ ] Indeed XML feed generation
- [ ] ZipRecruiter API integration
- [ ] Google Jobs structured data
- [ ] LinkedIn posting (manual + API)

### Phase 5 — Outbound Sourcing
- [ ] GitHub profile search + matching
- [ ] Resume database search (Indeed Resume API)
- [ ] University talent pipelines (Handshake)
- [ ] Passive candidate matching (continuous scan + alert)

### Phase 6 — Analytics
- [ ] Pipeline metrics (time-to-hire, conversion rates)
- [ ] Source effectiveness tracking
- [ ] Hiring velocity dashboard

## License

Private — Nexus3
