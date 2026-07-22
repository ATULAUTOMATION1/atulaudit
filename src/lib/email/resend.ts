// =============================================================================
// Direct Resend Email Service
// =============================================================================

export interface EmailPayload {
  to: string;
  name: string;
  domain: string;
  overallScore: number;
  reportUrl: string;
  topIssues?: Array<{ title: string; severity: string; category: string }>;
}

/**
 * Send confirmation email to lead and internal notification to team via Resend API.
 */
export async function sendAuditEmails(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "reports@atulautomation.com";
  const notificationEmail = process.env.TEAM_NOTIFICATION_EMAIL || "hello@atulautomation.com";

  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not configured. Skipping email notifications.");
    return false;
  }

  try {
    // 1. Send confirmation email to the lead
    const leadEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h2 style="color: #0d7377;">Your Website Audit Report for ${payload.domain}</h2>
        <p>Hi ${payload.name},</p>
        <p>Thank you for auditing your website with <strong>AtulAudit</strong> by AtulAutomation.</p>

        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Website Health Summary</h3>
          <p style="font-size: 24px; font-weight: bold; color: #0d7377; margin: 5px 0;">
            Overall Score: ${payload.overallScore}/100
          </p>
          <p style="font-size: 14px; color: #666; margin: 0;">Domain: ${payload.domain}</p>
        </div>

        <p style="margin-top: 25px;">
          <a href="${payload.reportUrl}" style="background-color: #0d7377; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Your Full Audit Report &rarr;
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888;">
          AtulAutomation — AI & Workflow Automation Solutions<br />
          <a href="https://atulautomation.com" style="color: #0d7377;">atulautomation.com</a>
        </p>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: payload.to,
        subject: `Your Website Audit Report for ${payload.domain} (Score: ${payload.overallScore}/100)`,
        html: leadEmailHtml,
      }),
    });

    // 2. Send internal lead alert to team
    const teamEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h2 style="color: #0d7377;">🔥 New Lead Captured on AtulAudit</h2>
        <p>A new audit lead just unlocked their report:</p>
        <ul>
          <li><strong>Domain:</strong> ${payload.domain}</li>
          <li><strong>Overall Score:</strong> ${payload.overallScore}/100</li>
          <li><strong>Name:</strong> ${payload.name}</li>
          <li><strong>Email:</strong> ${payload.to}</li>
          <li><strong>Report URL:</strong> <a href="${payload.reportUrl}">${payload.reportUrl}</a></li>
        </ul>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: notificationEmail,
        subject: `[Lead Alert] ${payload.name} audited ${payload.domain} (${payload.overallScore}/100)`,
        html: teamEmailHtml,
      }),
    });

    console.log(`[email] Successfully sent audit emails to ${payload.to} and team.`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send email via Resend:", err);
    return false;
  }
}
