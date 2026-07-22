// =============================================================================
// Direct WhatsApp Confirmation Service
// =============================================================================
// Sends instant WhatsApp confirmation messages directly to the lead via
// WhatsApp Cloud API, Interakt, Aisensy, WATI, or custom API endpoints.
// =============================================================================

export interface WhatsAppNotificationPayload {
  phone: string;
  name: string;
  domain: string;
  overallScore: number;
  reportUrl: string;
}

/**
 * Send a WhatsApp confirmation message to the lead.
 */
export async function sendWhatsAppConfirmation(
  payload: WhatsAppNotificationPayload
): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiUrl) {
    console.log("[whatsapp] WHATSAPP_API_URL not configured. Skipping WhatsApp confirmation message.");
    return false;
  }

  // Clean and format phone number (e.g. +91 99999 99999 -> 919999999999)
  const cleanPhone = payload.phone.replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10) {
    console.log(`[whatsapp] Invalid phone number provided: ${payload.phone}`);
    return false;
  }

  const messageText = `Hi ${payload.name}! 👋\n\nThank you for using *AtulAudit* by AtulAutomation.\n\nYour website audit report for *${payload.domain}* is ready!\n\n📊 *Overall Score:* ${payload.overallScore}/100\n🔗 *View Full Report:* ${payload.reportUrl}\n\nNeed help fixing issues or implementing automations? Reply to this message or visit atulautomation.com!`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        to: cleanPhone,
        phone: cleanPhone,
        message: messageText,
        text: messageText,
        custom_data: {
          name: payload.name,
          domain: payload.domain,
          score: payload.overallScore,
          report_url: payload.reportUrl,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[whatsapp] WhatsApp API returned status ${response.status}:`,
        await response.text().catch(() => "")
      );
      return false;
    }

    console.log(`[whatsapp] Successfully sent WhatsApp confirmation to ${cleanPhone}.`);
    return true;
  } catch (err) {
    console.error("[whatsapp] Failed to send WhatsApp message:", err);
    return false;
  }
}
