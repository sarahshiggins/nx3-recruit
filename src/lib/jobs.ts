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
      "Research and experiment with new AI models, tools, and frameworks. Build proof-of-concept implementations and help shape technical direction.",
    description: `## About the Role

You will join NX3 Labs as a core member of a small, focused engineering team working at the frontier of agentic AI, developing proprietary systems, vertical knowledge graphs, and agent architectures that power real products.

## What You Will Do

- Research emerging AI models and genAI frameworks
- Build AI applications and intelligent systems
- Design multi-agent AI workflows
- Communicate R&D findings to stakeholders
- Integrate AI research into production using Python

## Requirements

- Strong intuition for how emerging technologies solve real business problems
- Solid Python skills; comfortable working in unfamiliar codebases
- Self-directed with ability to make progress on ambiguous problems
- Clear communicator; able to explain technical work to non-technical stakeholders
- Active GitHub with real projects we can review

## Preferred

- Experience building with LLMs, agents, or genAI tools
- Actively follow AI research and industry developments as a habit
- Background in enterprise software or B2B products`,
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
