/**
 * Candidate email templates — sent from admin panel.
 *
 * Uses Resend for delivery. Requires RESEND_API_KEY env var.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendCandidateEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  type: "rejection" | "advancement";
  customMessage?: string;
}

const TEMPLATES = {
  rejection: {
    subject: (jobTitle: string) => `Your Application to Nexus3 — ${jobTitle}`,
    body: (candidateName: string, jobTitle: string, customMessage?: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="margin-bottom:32px;">
    <span style="font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#a41e22;font-weight:bold;">NEXUS3</span>
  </div>
  <p style="color:#f0f0f5;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    Hi ${escapeHtml(candidateName.split(" ")[0])},
  </p>
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    Thank you for your interest in the <strong style="color:#f0f0f5;">${escapeHtml(jobTitle)}</strong> position at Nexus3 and for taking the time to apply.
  </p>
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    After careful review, we've decided to move forward with other candidates whose experience more closely matches what we're looking for at this time.
  </p>
  ${customMessage ? `<p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">${escapeHtml(customMessage)}</p>` : ""}
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    We appreciate your interest in Nexus3 and wish you the best in your search.
  </p>
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0;">
    Best,<br>
    <span style="color:#f0f0f5;">The Nexus3 Team</span>
  </p>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="font-family:monospace;font-size:11px;color:#6a6a7a;margin:0;">Nexus3 · Chicago, IL</p>
  </div>
</div>
</body>
</html>`,
  },
  advancement: {
    subject: (jobTitle: string) => `Next Steps — ${jobTitle} at Nexus3`,
    body: (candidateName: string, jobTitle: string, customMessage?: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="margin-bottom:32px;">
    <span style="font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#a41e22;font-weight:bold;">NEXUS3</span>
  </div>
  <p style="color:#f0f0f5;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    Hi ${escapeHtml(candidateName.split(" ")[0])},
  </p>
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
    Thanks for applying to the <strong style="color:#f0f0f5;">${escapeHtml(jobTitle)}</strong> position at Nexus3. We've reviewed your application and would like to move forward to the next step.
  </p>
  ${customMessage ? `<p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">${escapeHtml(customMessage)}</p>` : `<p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0 0 16px 0;">We'll be in touch shortly with details on next steps.</p>`}
  <p style="color:#9898a8;font-size:15px;line-height:1.6;margin:0;">
    Best,<br>
    <span style="color:#f0f0f5;">The Nexus3 Team</span>
  </p>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="font-family:monospace;font-size:11px;color:#6a6a7a;margin:0;">Nexus3 · Chicago, IL</p>
  </div>
</div>
</body>
</html>`,
  },
};

export async function sendCandidateEmail(params: SendCandidateEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { error: "RESEND_API_KEY not configured" };
  }

  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "onboarding@resend.dev";
  const template = TEMPLATES[params.type];

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Nexus3 <${fromEmail}>`,
      to: [params.to],
      subject: template.subject(params.jobTitle),
      html: template.body(params.candidateName, params.jobTitle, params.customMessage),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", res.status, err);
    return { error: `Failed to send: ${res.status}` };
  }

  const data = await res.json();
  return { success: true, emailId: data.id };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
