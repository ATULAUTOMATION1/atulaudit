// =============================================================================
// Direct Google Sheets Integration
// =============================================================================
// Appends lead & audit data directly to Google Sheets via Google Apps Script
// Web App URL or direct HTTP endpoint without requiring external middleware.
// =============================================================================

export interface GoogleSheetsLeadPayload {
  auditId: string;
  domain: string;
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  conversionScore: number;
  automationScore: number;
  lead: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  reportUrl: string;
  timestamp: string;
}

/**
 * Append lead details directly to Google Sheets.
 */
export async function appendToGoogleSheets(
  payload: GoogleSheetsLeadPayload
): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("[google-sheets] GOOGLE_SHEETS_WEBHOOK_URL not configured. Skipping Google Sheets append.");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Timestamp: payload.timestamp,
        Domain: payload.domain,
        OverallScore: payload.overallScore,
        SeoScore: payload.seoScore,
        PerformanceScore: payload.performanceScore,
        AccessibilityScore: payload.accessibilityScore,
        ConversionScore: payload.conversionScore,
        AutomationScore: payload.automationScore,
        Name: payload.lead.name,
        Email: payload.lead.email,
        Company: payload.lead.company || "",
        Phone: payload.lead.phone || "",
        ReportUrl: payload.reportUrl,
        AuditId: payload.auditId,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[google-sheets] Webhook returned status ${response.status}:`,
        await response.text().catch(() => "")
      );
      return false;
    }

    console.log(`[google-sheets] Successfully appended lead for ${payload.domain} to Google Sheets.`);
    return true;
  } catch (err) {
    console.error("[google-sheets] Failed to append lead to Google Sheets:", err);
    return false;
  }
}
