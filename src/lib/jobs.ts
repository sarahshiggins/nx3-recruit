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
    slug: "bd-intern",
    title: "Business Development Intern",
    location: "Chicago, IL",
    type: "Internship",
    department: "Business Development",
    summary:
      "Identify vertical markets ripe for AI disruption, ideate solutions, and participate in customer discovery. Direct mentorship from the founding CEO.",
    description: `## About the Role

Nexus3 is seeking a proactive Business Development Intern to join for the summer, with the potential to extend into the fall. Your mission: identify vertical markets that can benefit from or be disrupted by generative AI.

## Key Responsibilities

- Conduct in-depth market research to uncover opportunities in strategic and vertical markets for generative AI innovations
- Understand emergent use cases of AI and develop ways to apply them in novel ways
- Collaborate with engineering teams to align AI solution capabilities with identified market opportunities
- Engage with industry stakeholders to promote our AI solutions and gather market intelligence
- Develop business cases for market entry, including market size analysis, competition, and strategic planning

## Requirements

- Bachelor or Master degree in Business, Technology, or related field
- Experience in business development, market research, or strategy in tech or AI sectors
- Strong analytical capabilities for interpreting data and identifying market trends
- Exceptional communication skills
- Self-driven, innovative thinker passionate about technology`,
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
