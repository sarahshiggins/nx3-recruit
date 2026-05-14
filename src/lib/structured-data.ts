/**
 * Google Jobs structured data (JSON-LD)
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */

import type { JobListing } from "./jobs";

export function jobPostingJsonLd(job: JobListing, baseUrl: string) {
  const employmentTypeMap: Record<string, string> = {
    "Full-time": "FULL_TIME",
    "Part-time": "PART_TIME",
    Contract: "CONTRACTOR",
    Internship: "INTERN",
  };

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "Nexus3",
      value: job.slug,
    },
    datePosted: new Date().toISOString().split("T")[0],
    employmentType: employmentTypeMap[job.type] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: "Nexus3",
      sameAs: "https://nexus3.ai",
      logo: `${baseUrl}/nexus3-logo.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Chicago",
        addressRegion: "IL",
        addressCountry: "US",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "US",
    },
    directApply: true,
    url: `${baseUrl}/jobs/${job.slug}`,
  };
}
