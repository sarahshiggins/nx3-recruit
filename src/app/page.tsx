const jobs = [
  {
    id: "genai-prototype-engineer",
    title: "GenAI Prototype Engineer",
    location: "Chicago, IL",
    type: "Full-time",
    description:
      "Join NX3 Labs as a core member of a small, focused engineering team working at the leading edge of AI. Track what's new, run experiments, build the prototypes that prove whether an idea has legs.",
  },
  {
    id: "genai-rd-engineer",
    title: "GenAI R&D Engineer",
    location: "Chicago, IL",
    type: "Full-time",
    description:
      "Research and experiment with new AI models, tools, and frameworks. Build proof-of-concept implementations, design agent systems, and help shape the technical direction of the company.",
  },
  {
    id: "bd-intern",
    title: "Business Development Intern",
    location: "Chicago, IL",
    type: "Internship",
    description:
      "Identify vertical markets ripe for AI disruption, ideate solutions, and participate in customer discovery. Direct mentorship from the founding CEO.",
  },
];

function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-[var(--font-mono)] text-sm font-bold tracking-widest text-[var(--accent)]">
            NX3
          </span>
          <span className="text-[var(--text-muted)] text-sm">/ careers</span>
        </div>
        <a
          href="https://nexus3.ai"
          className="text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors"
        >
          nexus3.ai →
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="font-[var(--font-mono)] text-xs tracking-[0.25em] uppercase text-[var(--accent)] mb-6">
          We&apos;re hiring
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          Build the future
          <br />
          <span className="text-[var(--text-secondary)]">of AI with us</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl leading-relaxed">
          Nexus3 builds and operates AI-driven businesses across industries
          where intelligent systems can replace entire workflows. We&apos;re a small
          team that moves fast and ships real products.
        </p>
      </div>
    </section>
  );
}

function JobCard({ job }: { job: (typeof jobs)[0] }) {
  return (
    <div className="group border border-[var(--border)] rounded-lg p-6 bg-[var(--card)] hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)] transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold group-hover:text-[var(--accent)] transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-[var(--font-mono)] text-xs text-[var(--text-muted)]">
              {job.location}
            </span>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="font-[var(--font-mono)] text-xs text-[var(--text-muted)]">
              {job.type}
            </span>
          </div>
        </div>
        <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-all text-sm">
          →
        </span>
      </div>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
        {job.description}
      </p>
    </div>
  );
}

function OpenPositions() {
  return (
    <section className="py-20 px-6" id="positions">
      <div className="max-w-6xl mx-auto">
        <p className="font-[var(--font-mono)] text-xs tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3">
          Open Positions
        </p>
        <h2 className="text-3xl font-bold mb-10">
          {jobs.length} roles available
        </h2>
        <div className="grid gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="py-20 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <p className="font-[var(--font-mono)] text-xs tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3">
            About Nexus3
          </p>
          <h2 className="text-3xl font-bold mb-6">
            Technology company with an
            <br />
            investment arm and R&D lab
          </h2>
        </div>
        <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
          <p>
            Nexus3 builds, invests in, and acquires generative AI vertical SaaS
            companies. Founded by Tim Stojka, a serial entrepreneur with 25+
            years building cutting-edge software companies.
          </p>
          <p>
            Our operating companies — NX3 Labs and Nexus3 Capital — work together
            to turn early research into commercial products at scale. We focus on
            large vertical markets where AI can materially improve
            decision-making and operational efficiency.
          </p>
          <p>
            We&apos;re based in Chicago. We work in-person. We ship fast.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <span className="font-[var(--font-mono)] text-xs text-[var(--text-muted)]">
          © 2026 Nexus3 Capital
        </span>
        <span className="font-[var(--font-mono)] text-xs text-[var(--text-muted)]">
          Chicago, IL
        </span>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <Hero />
      <OpenPositions />
      <About />
      <Footer />
    </main>
  );
}
