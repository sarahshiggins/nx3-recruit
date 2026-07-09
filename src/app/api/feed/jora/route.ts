import { NextResponse } from "next/server";
import { getOpenJobs, type JobListing } from "@/lib/jobs-db";

const SITE_URL = "https://careers.nexus3.ai";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapCdata(html: string): string {
  const safe = html.replace(/]]>/g, "]]]]><![CDATA[>");
  return `<![CDATA[${safe}]]>`;
}

function mapJobType(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized.includes("full")) return "Full-time";
  if (normalized.includes("part")) return "Part-time";
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("contract")) return "Contract";
  return "Full-time";
}

function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.join(" ")}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      closeList();
      out.push(`<h2>${line.slice(3).trim()}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      closeList();
      out.push(`<h1>${line.slice(2).trim()}</h1>`);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${line.slice(2).trim()}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }
  flushParagraph();
  closeList();
  return out.join("\n");
}

function rfc2822(date: Date): string {
  return date.toUTCString();
}

function buildItemXml(job: JobListing, postedAt: Date): string {
  const url = `${SITE_URL}/jobs/${job.slug}`;
  const descriptionHtml = markdownToHtml(job.description || job.summary || "");
  return `    <item>
      <title>${escapeXml(job.title)}</title>
      <link>${escapeXml(url)}</link>
      <description>${wrapCdata(descriptionHtml)}</description>
      <pubDate>${escapeXml(rfc2822(postedAt))}</pubDate>
      <guid>${escapeXml(job.slug)}</guid>
      <category>${escapeXml(mapJobType(job.type))}</category>
      <source>Nexus3</source>
    </item>`;
}

export async function GET() {
  const jobs = await getOpenJobs();
  const generatedAt = new Date();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Nexus3 Jobs</title>
    <link>${SITE_URL}</link>
    <description>Open positions at Nexus3</description>
    <lastBuildDate>${escapeXml(rfc2822(generatedAt))}</lastBuildDate>
${jobs.map((job) => buildItemXml(job, generatedAt)).join("\n")}
  </channel>
</rss>
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
