// =============================================================================
// Google PageSpeed Insights API Integration
// =============================================================================

import type { PageSpeedData, PageSpeedResults, ActionableAudit } from "@/lib/audit/types";

const PSI_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Lighthouse audits we want to capture as actionable items
const ACTIONABLE_AUDIT_IDS = [
  "render-blocking-resources",
  "unused-javascript",
  "uses-optimized-images",
  "modern-image-formats",
  "uses-text-compression",
  "uses-long-cache-ttl",
  "mainthread-work-breakdown",
  "bootup-time",
  "dom-size",
  "unminified-javascript",
  "unminified-css",
  "unused-css-rules",
  "efficient-animated-content",
  "offscreen-images",
  "total-byte-weight",
  "server-response-time",
];

/**
 * Run PageSpeed Insights for a URL with a given strategy.
 */
async function runPageSpeed(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string
): Promise<PageSpeedData | null> {
  try {
    const params = new URLSearchParams({
      url,
      strategy,
      key: apiKey,
      category: "performance",
    });

    // Add all categories
    ["accessibility", "seo", "best-practices"].forEach((cat) => {
      params.append("category", cat);
    });

    const response = await fetch(`${PSI_API_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(60_000), // PSI can be slow
    });

    if (!response.ok) {
      console.error(
        `[pagespeed] API returned ${response.status} for ${strategy}:`,
        await response.text().catch(() => "")
      );
      return null;
    }

    const data = await response.json();
    const lr = data.lighthouseResult;

    if (!lr) {
      console.error("[pagespeed] No lighthouseResult in response");
      return null;
    }

    // Extract category scores (0-1 → 0-100)
    const categories = lr.categories || {};
    const audits = lr.audits || {};

    // Extract actionable audits
    const actionableAudits: ActionableAudit[] = [];
    for (const auditId of ACTIONABLE_AUDIT_IDS) {
      const audit = audits[auditId];
      if (audit && audit.score !== null && audit.score < 1) {
        actionableAudits.push({
          id: auditId,
          title: audit.title || auditId,
          description: audit.description || "",
          display_value: audit.displayValue || null,
          score: audit.score !== undefined ? Math.round(audit.score * 100) : null,
        });
      }
    }

    return {
      performance_score: categories.performance?.score != null
        ? Math.round(categories.performance.score * 100)
        : null,
      seo_score: categories.seo?.score != null
        ? Math.round(categories.seo.score * 100)
        : null,
      accessibility_score: categories.accessibility?.score != null
        ? Math.round(categories.accessibility.score * 100)
        : null,
      best_practices_score: categories["best-practices"]?.score != null
        ? Math.round(categories["best-practices"].score * 100)
        : null,
      lcp_ms: audits["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      fcp_ms: audits["first-contentful-paint"]?.numericValue ?? null,
      inp_ms: audits["interaction-to-next-paint"]?.numericValue ?? null,
      ttfb_ms: audits["server-response-time"]?.numericValue ?? null,
      tbt_ms: audits["total-blocking-time"]?.numericValue ?? null,
      speed_index_ms: audits["speed-index"]?.numericValue ?? null,
      actionable_audits: actionableAudits,
    };
  } catch (err) {
    console.error(`[pagespeed] Error running ${strategy} audit:`, err);
    return null;
  }
}

/**
 * Run PageSpeed Insights for both mobile and desktop.
 */
export async function analyzePageSpeed(url: string): Promise<PageSpeedResults> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    console.log("[pagespeed] GOOGLE_PAGESPEED_API_KEY not configured.");
    return {
      mobile: null,
      desktop: null,
      api_configured: false,
    };
  }

  // Run mobile and desktop in parallel
  const [mobile, desktop] = await Promise.all([
    runPageSpeed(url, "mobile", apiKey),
    runPageSpeed(url, "desktop", apiKey),
  ]);

  return {
    mobile,
    desktop,
    api_configured: true,
  };
}
