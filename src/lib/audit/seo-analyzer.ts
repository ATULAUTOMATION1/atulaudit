// =============================================================================
// SEO Analyzer — Combines HTML analysis with external file checks
// =============================================================================

import type { SeoAnalysis } from "@/lib/audit/types";
import type { HtmlParseResult } from "./html-analyzer";

/**
 * Check if robots.txt is accessible at the domain root.
 */
async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL("/robots.txt", baseUrl);
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "AtulAudit/1.0 (Website Audit Tool)",
      },
    });
    return response.ok && response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Check if sitemap.xml is accessible at the domain root.
 */
async function checkSitemapXml(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL("/sitemap.xml", baseUrl);
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "AtulAudit/1.0 (Website Audit Tool)",
      },
    });
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") || "";
    return (
      contentType.includes("xml") ||
      contentType.includes("text/plain") ||
      response.status === 200
    );
  } catch {
    return false;
  }
}

/**
 * Build complete SEO analysis from HTML parse result + external checks.
 */
export async function analyzeSeo(
  htmlResult: HtmlParseResult,
  baseUrl: string
): Promise<SeoAnalysis> {
  // Run external checks in parallel
  const [robotsTxtReachable, sitemapXmlReachable] = await Promise.all([
    checkRobotsTxt(baseUrl),
    checkSitemapXml(baseUrl),
  ]);

  return {
    ...htmlResult.seo,
    robots_txt_reachable: robotsTxtReachable,
    sitemap_xml_reachable: sitemapXmlReachable,
  };
}
