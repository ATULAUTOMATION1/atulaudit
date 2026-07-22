// =============================================================================
// Audit Orchestrator — Main audit job runner
// =============================================================================

import { safeFetch } from "@/lib/security/safe-fetch";
import { analyzeHtml } from "./html-analyzer";
import { analyzeSeo } from "./seo-analyzer";
import { analyzePageSpeed } from "./pagespeed";
import { analyzeAutomation } from "./automation-analyzer";
import { analyzeGoogleMeta } from "./google-meta-analyzer";
import { calculateScores } from "@/lib/scoring/engine";
import { generateReport } from "./report-generator";
import { updateJobStatus } from "@/lib/services/audit-job";
import { createAuditReport, createAuditIssues } from "@/lib/services/audit-report";
import { extractDomain } from "@/lib/utils";
import type {
  HealthAnalysis,
  SeoAnalysis,
  PageSpeedResults,
  ConversionAnalysis,
  AutomationAnalysis,
  GoogleMetaAnalysis,
  ReportData,
} from "./types";

/**
 * Run a complete audit for a given URL and job ID.
 */
export async function runAudit(jobId: string, normalizedUrl: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Step 1: Mark job as running
    await updateJobStatus(jobId, "running");

    // Step 2: Fetch homepage HTML
    const fetchResult = await safeFetch(normalizedUrl);

    if (!fetchResult.ok) {
      await updateJobStatus(jobId, "failed", {
        error_message: fetchResult.error || `Failed to fetch website (HTTP ${fetchResult.status}).`,
      });
      return;
    }

    const domain = extractDomain(fetchResult.finalUrl);
    const baseUrl = new URL(fetchResult.finalUrl).origin;

    // Step 3: Parse HTML
    const htmlAnalysis = analyzeHtml(fetchResult.html, fetchResult.finalUrl);

    // Step 4: Health analysis
    const health: HealthAnalysis = {
      final_url: fetchResult.finalUrl,
      http_status: fetchResult.status,
      https_enabled: fetchResult.finalUrl.startsWith("https://"),
      redirect_count: fetchResult.redirectCount,
      response_time_ms: fetchResult.responseTimeMs,
      html_size_bytes: htmlAnalysis.htmlSizeBytes,
      language_attribute: htmlAnalysis.languageAttribute,
      viewport_meta: htmlAnalysis.viewportMeta,
      favicon_present: htmlAnalysis.faviconPresent,
    };

    // Step 5: SEO analysis
    let seo: SeoAnalysis;
    try {
      seo = await analyzeSeo(htmlAnalysis, baseUrl);
    } catch (err) {
      console.error("[audit] SEO analysis partially failed:", err);
      seo = {
        ...htmlAnalysis.seo,
        robots_txt_reachable: false,
        sitemap_xml_reachable: false,
      };
    }

    // Step 6: PageSpeed analysis
    let pagespeed: PageSpeedResults;
    try {
      pagespeed = await analyzePageSpeed(fetchResult.finalUrl);
    } catch (err) {
      console.error("[audit] PageSpeed analysis failed:", err);
      pagespeed = { mobile: null, desktop: null, api_configured: false };
    }

    // Step 7: Conversion analysis
    const conversion: ConversionAnalysis = htmlAnalysis.conversion;

    // Step 8: Automation analysis
    const automation: AutomationAnalysis = analyzeAutomation(conversion);

    // Step 9: Google & Meta Presence analysis
    let googleMeta: GoogleMetaAnalysis;
    try {
      googleMeta = await analyzeGoogleMeta(fetchResult.html, baseUrl);
    } catch (err) {
      console.error("[audit] Google & Meta analysis failed:", err);
      googleMeta = {
        googleVisibility: {
          ga4_detected: false,
          ga4_id_masked: null,
          gtm_detected: false,
          gtm_id_masked: null,
          google_ads_detected: false,
          google_ads_id_masked: null,
          search_console_verified: false,
          google_maps_embed: false,
          google_maps_link: false,
          gbp_link: false,
          has_ads_txt: null,
          detected_schemas: [],
          has_privacy_policy: false,
          has_terms_of_service: false,
          has_cookie_banner: false,
        },
        gbpAndLocal: {
          gbp_link_present: false,
          local_business_schema_complete: false,
          business_name: null,
          business_address: null,
          phone_present: false,
          click_to_call_present: false,
          email_present: false,
          opening_hours_present: false,
          contact_page_present: false,
          service_area_keywords_present: false,
          reviews_or_social_proof_present: false,
          same_as_links: [],
          nap_consistency: { consistent: false, details: [] },
        },
        metaMarketing: {
          pixel_detected: false,
          pixel_id_masked: null,
          domain_verified: false,
          facebook_page_link: false,
          instagram_profile_link: false,
          whatsapp_link: false,
          capi_status: "Not detected on public website",
        },
        socialSharing: {
          og_title: null,
          og_description: null,
          og_image: null,
          og_url: null,
          og_type: null,
          twitter_card: null,
          twitter_title: null,
          twitter_description: null,
          twitter_image: null,
        },
      };
    }

    // Step 10: Calculate scores
    const scores = calculateScores({
      seo,
      pagespeed,
      conversion,
      automation,
      googleMeta,
      health: {
        https_enabled: health.https_enabled,
        language_attribute: health.language_attribute,
        viewport_meta: health.viewport_meta,
        favicon_present: health.favicon_present,
      },
    });

    // Step 11: Generate report
    const reportData: ReportData = generateReport({
      meta: {
        audited_at: new Date().toISOString(),
        domain,
        final_url: fetchResult.finalUrl,
        html_size_bytes: htmlAnalysis.htmlSizeBytes,
        response_time_ms: fetchResult.responseTimeMs,
      },
      health,
      seo,
      pagespeed,
      conversion,
      automation,
      googleMeta,
      scores,
    });

    // Step 12: Save report to database
    const report = await createAuditReport(jobId, scores, reportData);

    // Step 13: Save individual issues to database
    await createAuditIssues(report.id, reportData.issues);

    // Step 14: Mark job as completed
    await updateJobStatus(jobId, "completed", {
      final_url: fetchResult.finalUrl,
      completed_at: new Date().toISOString(),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[audit] Completed audit for ${domain} in ${elapsed}s. Score: ${scores.overall}/100`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during the audit.";

    console.error(`[audit] Fatal error for job ${jobId}:`, err);

    try {
      await updateJobStatus(jobId, "failed", { error_message: message });
    } catch (statusErr) {
      console.error("[audit] Failed to update job status to failed:", statusErr);
    }
  }
}
