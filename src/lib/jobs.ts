/**
 * Job data — hardcoded for now, will move to database later.
 */

export interface JobListing {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  department: string;
  summary: string;
  description: string; // markdown-ish
  screeningQuestions: {
    id: string;
    question: string;
    type: "TEXT" | "TEXTAREA" | "YES_NO";
    required: boolean;
  }[];
}

export const jobs: JobListing[] = [
  {
    id: "2",
    slug: "genai-rd-engineer",
    title: "GenAI R&D Engineer",
    location: "Chicago, IL",
    type: "Full-time",
    department: "Engineering",
    summary:
      "Track what's new in AI, run experiments, and build fast prototypes that prove whether an idea has legs. Everything you build in Labs flows directly into Nexus3's operating businesses.",
    description: `## About Nexus3

Nexus3 builds and operates AI-driven businesses across industries where intelligent systems can replace entire workflows. Our operating companies, NX3 Labs (our R&D division), and Nexus3 Capital (our investment arm) work together to turn early research into commercial products at scale.

## About NX3 Labs

NX3 Labs is Nexus3's innovation and engineering division- the team responsible for the core technology that powers every Nexus3 company. We work at the frontier of agentic AI, developing proprietary systems, vertical knowledge graphs, and agent architectures that go into real products serving real customers.

## Role Overview

You'll join NX3 Labs - Nexus3's R&D division - as a core member of a small, focused engineering team working at the leading edge of AI. Your job is to track what's new, run experiments, and figure out how emerging tools and techniques apply to what Nexus3 is building across its portfolio of operating companies. When you find something worth pursuing, you build it - fast, functional, and with real stakes. You won't be heads-down on one product. You'll be exploring new developments in AI, testing their limits, and building the prototypes that prove whether an idea has legs. Everything you build in Labs flows directly into Nexus3's operating businesses.

## What You'll Do

- Research and experiment with new AI models, tools, frameworks, and techniques as they emerge
- Run structured experiments to determine how new developments can be applied to Nexus3's operating companies
- Build proof-of-concept implementations and working prototypes that demonstrate what's possible with emerging AI capabilities - speed and clarity matter more than polish
- Design and build AI-powered workflows, agent systems, and automation tools across multiple industries and use cases
- Share findings with the engineering and business teams - translate what you learn into actionable recommendations
- Take hypotheses from the business development and engineering teams and build functional AI applications to validate them quickly
- Help shape the technical direction of the company by identifying what's worth adopting and what isn't

## Requirements

- Strong intuition for how emerging technologies can solve real business problems - you see a new tool and immediately start thinking about where it applies.
- Strong problem solving instincts - you enjoy building things, you tinker on your own time, and you're genuinely curious about how things work.
- Solid Python skills; comfortable working in unfamiliar codebases.
- Self-directed - you can take an ambiguous problem and make meaningful progress without constant guidance.
- Clear communicator; able to explain technical work to non-technical stakeholders.
- An active GitHub with real projects we can review.

## Preferred

- Experience building with LLMs, agents, or genAI tools (big plus)
- You actively follow AI research, new releases, and industry developments - not just casually, but as a habit
- Some background in enterprise software or B2B products
- You can move fast with unfamiliar tools and figure things out as you go
- You've experimented with new tools or frameworks on your own and can speak to what you learned

## We Offer

- Direct access to founders and leadership - you'll work with them daily
- Exposure to multiple industries and products, not just one
- The opportunity to build early-stage AI products with real commercial potential
- Competitive compensation and equity`,
    screeningQuestions: [
      {
        id: "q1",
        question:
          "We believe the best engineers are always building, even outside work or school. Describe a recent personal project you've worked on for fun (whether related to AI or not). Discuss why you started it and the challenges you've faced or are currently facing.",
        type: "TEXTAREA",
        required: false,
      },
      {
        id: "q2",
        question: "Do you have permanent US work authorization?",
        type: "YES_NO",
        required: true,
      },
      {
        id: "q3",
        question: "LinkedIn Profile URL",
        type: "TEXT",
        required: false,
      },
      {
        id: "q4",
        question: "GitHub / Portfolio URL",
        type: "TEXT",
        required: false,
      },
    ],
  },
  {
    id: "3",
    slug: "business-development-intern",
    title: "Business Development Intern \u2014 Fall 2026",
    location: "Chicago, IL",
    type: "Internship",
    department: "Business Development",
    summary:
      "Join Nexus3 to help build a new AI-powered company in the energy space. Work directly with the founding CEO on market research, business cases, and go-to-market strategy from scratch.",
    description: `## About Nexus3

Nexus3 builds and operates AI-driven businesses across industries where intelligent systems can replace entire workflows. Our operating companies, NX3 Labs (our R&D division), and Nexus3 Capital (our investment arm) work together to turn early research into commercial products at scale. Nexus3 is founded and led by Tim Stojka, a serial entrepreneur with 25+ years of experience building cutting-edge software companies across multiple industries.

## About This Internship

Nexus3 is building a new portfolio company in the energy space — using AI to transform how energy industry data is analyzed, monitored, and acted on. This is an early-stage venture where the market opportunity is massive, the technology is bleeding-edge, and nothing is set in stone yet.

We're looking for a Business Development Intern who wants to be in the room while this company takes shape. You'll work directly with the founding CEO to research the energy market, identify the highest-value problems AI can solve, build business cases, and help define the go-to-market strategy from scratch.

This isn't a generic "explore all verticals" internship. You'll go deep on one sector — energy — and help us figure out exactly where and how to build a business that matters.

## What You'll Do

- Conduct deep market research on the energy industry — regulatory landscape, utility operations, market structure, and where AI can create the most value
- Identify specific pain points and workflows in the energy sector that are ripe for AI-driven disruption
- Develop business cases for market entry, including market sizing, competitive analysis, customer segmentation, and strategic positioning
- Engage with industry stakeholders to gather market intelligence and validate hypotheses about product-market fit
- Collaborate with the engineering team to align AI capabilities with real market needs
- Participate in customer discovery — talk to potential users, understand their workflows, and bring those insights back to the team
- Help shape the go-to-market strategy for a new AI-powered energy company from the ground up

## Requirements

- Bachelor's or Master's degree in Business, Technology, Engineering, or related field
- Experience in business development, market research, or strategy — ideally in tech, AI, or energy
- Strong analytical capabilities for interpreting data and identifying market trends
- Exceptional communication skills — you can articulate complex concepts clearly and build relationships with stakeholders across industries
- Self-driven and comfortable with ambiguity — you can make progress when there's no playbook
- Genuine curiosity about and experience with AI and its real-world applications

## Preferred

- Knowledge of or experience in the energy industry (utilities, power markets, regulatory, energy tech)
- Engineering or Science/Mathematics degree
- Hands-on experience with AI tools or software prototyping
- Strong technical intuition — you understand how software products are built even if you're not writing code
- Interest in early-stage ventures and company building

## We Offer

- Direct mentorship from the founding CEO — you'll work with leadership daily
- A front-row seat to building a new AI company in the energy space from scratch
- Real ownership over meaningful work — your research and analysis will directly shape company strategy
- Competitive compensation that values your contribution and growth`,
    screeningQuestions: [
      {
        id: "q1",
        question:
          "Tell us about a situation in your professional, personal, or academic life where there was no clear path forward and no one telling you what to do. How did you decide what you should own and what steps to take?",
        type: "TEXTAREA",
        required: false,
      },
      {
        id: "q2",
        question: "Do you have permanent US work authorization?",
        type: "YES_NO",
        required: true,
      },
      {
        id: "q3",
        question: "LinkedIn Profile URL",
        type: "TEXT",
        required: false,
      },
    ],
  },
];

export function getJobBySlug(slug: string): JobListing | undefined {
  return jobs.find((j) => j.slug === slug);
}
