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
  if (normalized.includes("full")) return "full-time";
  if (normalized.includes("part")) return "part-time";
  if (normalized.includes("intern")) return "internship";
  if (normalized.includes("contract")) return "contract";
  return "full-time";
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

function buildJobXml(job: JobListing, postedAt: Date): string {
  const url = `${SITE_URL}/jobs/${job.slug}`;
  const descriptionHtml = markdownToHtml(job.description || job.summary || "");
  return `  <job>
    <title>${escapeXml(job.title)}</title>
    <link>${escapeXml(url)}</link>
    <company>Nexus3</company>
    <city>Chicago</city>
    <state>IL</state>
    <country>US</country>
    <description>${wrapCdata(descriptionHtml)}</description>
    <pubdate>${escapeXml(rfc2822(postedAt))}</pubdate>
    <jobtype>${escapeXml(mapJobType(job.type))}</jobtype>
  </job>`;
}

export async function GET() {
  const jobs = await getOpenJobs();
  const generatedAt = new Date();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
${jobs.map((job) => buildJobXml(job, generatedAt)).join("\n")}
</jobs>
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
