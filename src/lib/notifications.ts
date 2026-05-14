/**
 * Email notifications for new applications.
 *
 * Uses Resend for transactional email delivery.
 * Set RESEND_API_KEY in environment variables.
 *
 * NOTIFY_EMAILS: comma-separated list of emails to notify on new applications.
 * Defaults to sarah.higgins@nexus3cap.com if not set.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface NotifyNewApplicationParams {
  candidateName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  jobSlug: string;
  applicationId: string;
  resumeUrl?: string;
  screeningAnswers?: Record<string, string>;
}

export async function notifyNewApplication(params: NotifyNewApplicationParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const notifyEmails = (
    process.env.NOTIFY_EMAILS || "sarah.higgins@nexus3cap.com"
  )
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (notifyEmails.length === 0) return;

  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "recruiting@nexus3cap.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nx3-recruit.vercel.app";
  const adminUrl = `${appUrl}/admin/applications/${params.applicationId}`;

  const screeningHtml = params.screeningAnswers
    ? Object.entries(params.screeningAnswers)
        .filter(([, v]) => v)
        .map(
          ([q, a]) =>
            `<div style="margin-bottom: 12px;">
              <p style="color: #6a6a7a; font-size: 12px; margin: 0 0 4px 0;">${escapeHtml(q)}</p>
              <p style="color: #f0f0f5; font-size: 14px; margin: 0; white-space: pre-wrap;">${escapeHtml(String(a))}</p>
            </div>`
        )
        .join("")
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <!-- Header -->
    <div style="margin-bottom: 32px;">
      <span style="font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: #a41e22; font-weight: bold;">NX3 RECRUIT</span>
    </div>

    <!-- Title -->
    <h1 style="color: #f0f0f5; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
      New Application
    </h1>
    <p style="color: #9898a8; font-size: 14px; margin: 0 0 24px 0;">
      ${escapeHtml(params.candidateName)} applied for <strong style="color: #f0f0f5;">${escapeHtml(params.jobTitle)}</strong>
    </p>

    <!-- Candidate Info -->
    <div style="border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; background: #161618; padding: 20px; margin-bottom: 16px;">
      <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; color: #6a6a7a; text-transform: uppercase; margin: 0 0 12px 0;">Contact</p>
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #6a6a7a; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top; width: 60px;">Name</td>
          <td style="color: #f0f0f5; font-size: 14px; padding: 4px 0;">${escapeHtml(params.candidateName)}</td>
        </tr>
        <tr>
          <td style="color: #6a6a7a; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top;">Email</td>
          <td style="color: #f0f0f5; font-size: 14px; padding: 4px 0;">
            <a href="mailto:${escapeHtml(params.email)}" style="color: #a41e22; text-decoration: none;">${escapeHtml(params.email)}</a>
          </td>
        </tr>
        ${
          params.phone
            ? `<tr>
                <td style="color: #6a6a7a; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top;">Phone</td>
                <td style="color: #f0f0f5; font-size: 14px; padding: 4px 0;">${escapeHtml(params.phone)}</td>
              </tr>`
            : ""
        }
        ${
          params.resumeUrl
            ? `<tr>
                <td style="color: #6a6a7a; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top;">Resume</td>
                <td style="font-size: 14px; padding: 4px 0;">
                  <a href="${escapeHtml(params.resumeUrl)}" style="color: #a41e22; text-decoration: none;">View resume ↗</a>
                </td>
              </tr>`
            : ""
        }
      </table>
    </div>

    <!-- Screening Answers -->
    ${
      screeningHtml
        ? `<div style="border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; background: #161618; padding: 20px; margin-bottom: 24px;">
            <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; color: #6a6a7a; text-transform: uppercase; margin: 0 0 12px 0;">Screening Answers</p>
            ${screeningHtml}
          </div>`
        : ""
    }

    <!-- CTA -->
    <a href="${adminUrl}" style="display: inline-block; background: #a41e22; color: white; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
      Review Application →
    </a>

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
      <p style="font-family: monospace; font-size: 11px; color: #6a6a7a; margin: 0;">
        NX3 Recruit · Nexus3
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `NX3 Recruit <${fromEmail}>`,
        to: notifyEmails,
        subject: `New Application: ${params.candidateName} → ${params.jobTitle}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", res.status, err);
    }
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
