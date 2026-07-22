// =============================================================================
// Webhook Service (n8n Integration)
// =============================================================================
// Sends lead data and audit summary to a configurable n8n webhook.
// Graceful no-op if N8N_WEBHOOK_URL is not configured.
// =============================================================================

interface WebhookPayload {
  auditId: string;
  domain: string;
  overallScore: number;
  topIssues: Array<{ title: string; severity: string; category: string }>;
  lead: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    consent: boolean;
  };
  reportUrl: string;
  timestamp: string;
}

/**
 * Send lead data to n8n webhook.
 * Non-blocking, fire-and-forget with error logging.
 */
export async function sendLeadWebhook(payload: WebhookPayload): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(
      "[webhook] N8N_WEBHOOK_URL not configured. Lead saved to database only.",
      { auditId: payload.auditId, email: payload.lead.email }
    );
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[webhook] n8n webhook returned ${response.status}: ${response.statusText}`
      );
      return false;
    }

    console.log("[webhook] Lead sent to n8n successfully.", {
      auditId: payload.auditId,
    });
    return true;
  } catch (err) {
    console.error("[webhook] Failed to send lead to n8n:", err);
    return false;
  }
}
