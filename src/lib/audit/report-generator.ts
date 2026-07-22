// =============================================================================
// Report Generator — Assembles findings into a structured report
// =============================================================================

import type {
  ReportData,
  ReportMeta,
  HealthAnalysis,
  SeoAnalysis,
  PageSpeedResults,
  ConversionAnalysis,
  AutomationAnalysis,
  GoogleMetaAnalysis,
  AuditScores,
  AuditFinding,
  AuditIssueSerialized,
  ExecutiveSummary,
  IssueSeverity,
  IssueEffort,
} from "@/lib/audit/types";
import { getScoreLabel } from "@/lib/scoring/labels";
import { summarizeConversion } from "./conversion-analyzer";
import { generateAutomationRecommendations } from "./automation-analyzer";

/**
 * Generate the full report from all analysis data.
 */
export function generateReport(params: {
  meta: ReportMeta;
  health: HealthAnalysis;
  seo: SeoAnalysis;
  pagespeed: PageSpeedResults;
  conversion: ConversionAnalysis;
  automation: AutomationAnalysis;
  googleMeta: GoogleMetaAnalysis;
  scores: AuditScores;
}): ReportData {
  const { meta, health, seo, pagespeed, conversion, automation, googleMeta, scores } = params;

  const issues = generateIssues(health, seo, pagespeed, conversion, automation, googleMeta);
  const strengths = generateStrengths(health, seo, pagespeed, conversion, googleMeta);
  const priorities = issues
    .filter((i) => i.severity === "high")
    .slice(0, 5);
  const automationRecommendations = generateAutomationRecommendations(automation);
  const summary = generateExecutiveSummary(scores, meta.domain, issues);

  // Sort issues: high first, then medium, then low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  issues.forEach((issue, idx) => {
    issue.sort_order = idx;
  });

  return {
    meta,
    health,
    seo,
    pagespeed,
    conversion,
    automation,
    googleMeta,
    scores,
    summary,
    strengths,
    priorities: priorities.map((p) => ({
      title: p.title,
      description: p.finding,
      category: p.category,
    })),
    issues,
    automationRecommendations,
  };
}

/**
 * Generate executive summary in plain business language.
 */
function generateExecutiveSummary(
  scores: AuditScores,
  domain: string,
  issues: AuditIssueSerialized[]
): ExecutiveSummary {
  const overallLabel = getScoreLabel(scores.overall);
  const highIssueCount = issues.filter((i) => i.severity === "high").length;
  const mediumIssueCount = issues.filter((i) => i.severity === "medium").length;

  let headline: string;
  if (scores.overall >= 80) {
    headline = `${domain} has a strong digital footprint overall.`;
  } else if (scores.overall >= 60) {
    headline = `${domain} has a solid foundation with room to improve visibility and conversions.`;
  } else if (scores.overall >= 40) {
    headline = `${domain} has several key gaps in SEO, tracking, and conversion setup.`;
  } else {
    headline = `${domain} needs priority updates to compete effectively online.`;
  }

  const bodyParts: string[] = [];
  bodyParts.push(
    `Your website scored ${scores.overall} out of 100 (${overallLabel.label}).`
  );

  if (highIssueCount > 0) {
    bodyParts.push(
      `We found ${highIssueCount} high-priority ${highIssueCount === 1 ? "issue" : "issues"} requiring prompt attention.`
    );
  }

  if (mediumIssueCount > 0) {
    bodyParts.push(
      `There are also ${mediumIssueCount} medium-priority improvements to consider.`
    );
  }

  const weakest = Object.entries(scores)
    .filter(([key]) => key !== "overall")
    .sort(([, a], [, b]) => a - b)[0];

  if (weakest && weakest[1] < 60) {
    const categoryNames: Record<string, string> = {
      seo: "SEO",
      performance: "performance",
      accessibility: "accessibility",
      conversion: "conversion readiness",
      automation: "automation readiness",
      google_visibility: "Google ecosystem visibility",
      gbp_readiness: "Google Business Profile readiness",
      meta_marketing: "Meta marketing setup",
      social_sharing: "social sharing metadata",
    };
    bodyParts.push(
      `Your weakest area is ${categoryNames[weakest[0]] || weakest[0]} at ${weakest[1]}%. Improving this will unlock the highest business impact.`
    );
  }

  return {
    headline,
    body: bodyParts.join(" "),
  };
}

/**
 * Generate list of what's working well.
 */
function generateStrengths(
  health: HealthAnalysis,
  seo: SeoAnalysis,
  pagespeed: PageSpeedResults,
  conversion: ConversionAnalysis,
  googleMeta: GoogleMetaAnalysis
): AuditFinding[] {
  const strengths: AuditFinding[] = [];

  if (health.https_enabled) {
    strengths.push({
      title: "HTTPS is enabled",
      description: "Your website uses a secure HTTPS connection.",
      category: "health",
    });
  }

  if (seo.title && seo.title_length >= 30 && seo.title_length <= 60) {
    strengths.push({
      title: "Well-optimized page title",
      description: `Title tag "${seo.title}" is within recommended 30-60 characters.`,
      category: "seo",
    });
  }

  if (seo.meta_description && seo.meta_description_length >= 120) {
    strengths.push({
      title: "Meta description is set",
      description: "Meta description is present and properly formatted.",
      category: "seo",
    });
  }

  if (seo.h1_count === 1) {
    strengths.push({
      title: "Proper H1 heading structure",
      description: "Your page has exactly one H1 heading.",
      category: "seo",
    });
  }

  if (googleMeta.googleVisibility.ga4_detected) {
    strengths.push({
      title: "Google Analytics 4 detected: website traffic can be measured",
      description: `Status: Detected on public website (${googleMeta.googleVisibility.ga4_id_masked}).`,
      category: "google",
    });
  }

  if (googleMeta.googleVisibility.gtm_detected) {
    strengths.push({
      title: "Google Tag Manager container active",
      description: `Status: Detected on public website (${googleMeta.googleVisibility.gtm_id_masked}).`,
      category: "google",
    });
  }

  if (googleMeta.metaMarketing.pixel_detected) {
    strengths.push({
      title: "Meta Pixel code detected",
      description: `Status: Detected on public website (${googleMeta.metaMarketing.pixel_id_masked}).`,
      category: "meta",
    });
  }

  if (googleMeta.gbpAndLocal.gbp_link_present) {
    strengths.push({
      title: "Google Business Profile link verified",
      description: "Status: Detected on public website. Helps local customers find directions and reviews.",
      category: "google_business_profile",
    });
  }

  if (googleMeta.gbpAndLocal.local_business_schema_complete) {
    strengths.push({
      title: "LocalBusiness schema structured data present",
      description: "Status: Detected on public website. Helps Google display rich local business information.",
      category: "local_seo",
    });
  }

  if (googleMeta.socialSharing.og_image && googleMeta.socialSharing.og_title) {
    strengths.push({
      title: "Open Graph metadata configured for social sharing",
      description: "Status: Detected on public website. Links shared on social media display rich previews.",
      category: "social",
    });
  }

  const mobilePerf = pagespeed.mobile?.performance_score;
  if (mobilePerf != null && mobilePerf >= 80) {
    strengths.push({
      title: "Strong mobile performance",
      description: `Mobile Lighthouse performance score is ${mobilePerf}/100.`,
      category: "performance",
    });
  }

  const { strengths: convStrengths } = summarizeConversion(conversion);
  for (const s of convStrengths.slice(0, 3)) {
    strengths.push({
      title: s,
      description: "",
      category: "conversion",
    });
  }

  return strengths;
}

/**
 * Generate all audit issues.
 */
function generateIssues(
  health: HealthAnalysis,
  seo: SeoAnalysis,
  pagespeed: PageSpeedResults,
  conversion: ConversionAnalysis,
  automation: AutomationAnalysis,
  googleMeta: GoogleMetaAnalysis
): AuditIssueSerialized[] {
  const issues: AuditIssueSerialized[] = [];

  // ---- Health ----
  if (!health.https_enabled) {
    issues.push(issue("health", "high", "Website not using HTTPS",
      "Your website is served over HTTP without SSL/TLS encryption.",
      "Browsers mark HTTP sites as 'Not Secure', damaging trust. Google uses HTTPS as a ranking signal.",
      "Install an SSL certificate and redirect all HTTP traffic to HTTPS.",
      "easy", true));
  }

  if (!health.favicon_present) {
    issues.push(issue("health", "low", "No favicon detected",
      "We could not find a favicon link on the page.",
      "A missing favicon makes your site look unfinished in browser tabs.",
      "Add a favicon.ico file and include a <link rel='icon'> tag.",
      "easy", true));
  }

  if (!health.viewport_meta) {
    issues.push(issue("health", "high", "Missing viewport meta tag",
      "No viewport meta tag found in the page head.",
      "Without a viewport tag, your site may render incorrectly on mobile devices.",
      "Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your HTML head.",
      "easy", true));
  }

  if (!health.language_attribute) {
    issues.push(issue("health", "medium", "Missing HTML language attribute",
      "The <html> tag does not have a 'lang' attribute.",
      "Screen readers and search engines use the language attribute to interpret text.",
      "Add lang='en' (or your primary language) to the <html> tag.",
      "easy", true));
  }

  // ---- Google & Meta Presence ----
  // Google Visibility
  if (!googleMeta.googleVisibility.ga4_detected) {
    issues.push(issue("google", "high", "Google Analytics 4 tag not detected",
      "We could not find a GA4 measurement tag (G-XXXXXXXXXX) on the homepage. Status: Not detected on public website.",
      "Without GA4, website traffic, conversion events, and visitor acquisition sources cannot be measured.",
      "Install Google Analytics 4 via GTM or directly in your page head to track website performance.",
      "easy", true));
  }

  if (!googleMeta.googleVisibility.gtm_detected) {
    issues.push(issue("google", "medium", "Google Tag Manager container not detected",
      "No GTM container snippet (GTM-XXXXXXX) found. Status: Not detected on public website.",
      "Tag Manager simplifies managing analytics, ad pixels, and tracking scripts without updating code.",
      "Deploy Google Tag Manager container on your website to streamline marketing tags.",
      "easy", true));
  }

  if (!googleMeta.googleVisibility.google_ads_detected) {
    issues.push(issue("google", "low", "Google Ads conversion tag not detected",
      "No Google Ads remarketing or conversion tag (AW-XXXXXXXXX) found. Status: Not detected on public website.",
      "You may not be able to track ad conversions or build remarketing audiences from website traffic.",
      "Link Google Ads with GA4 or install the Google Ads tag via GTM.",
      "easy", true));
  }

  if (!googleMeta.googleVisibility.search_console_verified) {
    issues.push(issue("google", "low", "Google Search Console verification meta tag not found",
      "Google Search Console verification tag not found: this does not prove Search Console is not configured; it may be verified by DNS or another method. Status: Not detected on public website.",
      "Verifying Search Console lets you monitor search impressions, clicks, indexing issues, and keyword rankings.",
      "Verify Search Console via DNS TXT record or HTML meta tag to monitor search performance.",
      "easy", true));
  }

  // GBP & Local SEO
  if (!googleMeta.gbpAndLocal.gbp_link_present) {
    issues.push(issue("google_business_profile", "high", "Google Business Profile link not found",
      "Google Business Profile link not found: add a verified Maps/Business Profile link to strengthen local trust and make it easier for customers to find directions and reviews. Status: Not detected on public website.",
      "Linking your GBP profile improves local SEO pack rankings and builds instant customer trust.",
      "Add a direct link to your Google Business Profile / Maps listing in the header, footer, or contact section.",
      "easy", true));
  }

  if (!googleMeta.gbpAndLocal.local_business_schema_complete) {
    issues.push(issue("local_seo", "high", "LocalBusiness schema is missing or incomplete",
      "LocalBusiness schema is missing: add structured business data for name, phone, address/service area, opening hours, and website. Status: Not detected on public website.",
      "Structured local schema helps Google display rich business info, map pins, and local pack rankings.",
      "Implement JSON-LD LocalBusiness schema with business name, address, phone number, hours, and geo-coordinates.",
      "moderate", true));
  }

  if (!googleMeta.gbpAndLocal.business_address) {
    issues.push(issue("local_seo", "medium", "No physical address or service area detected",
      "Could not find a physical address or service area in structured data or contact section. Status: Not detected on public website.",
      "Local search algorithms rely on clear address signals to show your business in nearby searches.",
      "Add your full business address or service area to your footer, contact page, and JSON-LD schema.",
      "easy", true));
  }

  if (!googleMeta.gbpAndLocal.opening_hours_present) {
    issues.push(issue("local_seo", "medium", "No business opening hours detected",
      "Could not find operating hours in content or schema. Status: Not detected on public website.",
      "Customers and search engines look for clear business hours to know when you are open.",
      "Display operating hours on your contact page and include them in LocalBusiness schema.",
      "easy", true));
  }

  // Meta Marketing
  if (!googleMeta.metaMarketing.pixel_detected) {
    issues.push(issue("meta", "high", "Meta Pixel not detected",
      "Meta Pixel not detected: you may not be able to build retargeting audiences from website visitors. Status: Not detected on public website.",
      "Without Meta Pixel, ad campaigns on Facebook & Instagram cannot track website conversions or retarget visitors.",
      "Install Meta Pixel base code via GTM or page header.",
      "easy", true));
  }

  if (!googleMeta.metaMarketing.domain_verified) {
    issues.push(issue("meta", "low", "Facebook domain verification tag not found",
      "No facebook-domain-verification meta tag detected. Status: Not detected on public website.",
      "Domain verification authorizes your Meta Business Manager to manage ad link editing.",
      "Verify your domain in Meta Business Manager using DNS TXT record or meta tag.",
      "easy", true));
  }

  if (!googleMeta.metaMarketing.facebook_page_link && !googleMeta.metaMarketing.instagram_profile_link) {
    issues.push(issue("meta", "medium", "Facebook page or Instagram profile link missing",
      "No links to official Facebook or Instagram profiles detected. Status: Not detected on public website.",
      "Social profile links build brand authenticity and give visitors alternative engagement channels.",
      "Add icons/links to your official Facebook page and Instagram profile in the footer.",
      "easy", true));
  }

  // Social Sharing Metadata
  if (!googleMeta.socialSharing.og_image) {
    issues.push(issue("social", "medium", "Open Graph image missing",
      "Open Graph image missing: shared links on WhatsApp, LinkedIn, Facebook, and other platforms may appear less compelling. Status: Not detected on public website.",
      "Without an og:image tag, social shares will display a generic link without an eye-catching thumbnail preview.",
      "Add <meta property='og:image' content='https://yourdomain.com/og-image.jpg'> with 1200x630 dimensions.",
      "easy", true));
  }

  if (!googleMeta.socialSharing.og_title || !googleMeta.socialSharing.og_description) {
    issues.push(issue("social", "medium", "Incomplete Open Graph title or description",
      "Missing og:title or og:description meta tags. Status: Not detected on public website.",
      "Link previews on social media and messaging apps will fall back to basic text snippets.",
      "Set custom og:title and og:description meta tags optimized for social sharing.",
      "easy", true));
  }

  if (!googleMeta.socialSharing.twitter_card) {
    issues.push(issue("social", "low", "Twitter/X Card metadata missing",
      "No twitter:card meta tag found. Status: Not detected on public website.",
      "Links shared on Twitter/X may not expand into rich media summary cards.",
      "Add <meta name='twitter:card' content='summary_large_image'> to your page head.",
      "easy", true));
  }

  // ---- SEO ----
  if (!seo.title) {
    issues.push(issue("seo", "high", "Missing page title",
      "No <title> tag found on the page.",
      "The title tag is the most important on-page SEO element.",
      "Add a descriptive, keyword-rich title tag between 30-60 characters.",
      "easy", true));
  } else if (seo.title_length < 30 || seo.title_length > 60) {
    issues.push(issue("seo", "medium", "Page title length is not optimal",
      `Title tag is ${seo.title_length} characters: "${seo.title}"`,
      "Titles over 60 characters get truncated in search results.",
      "Rewrite title to be between 30-60 characters.",
      "easy", true));
  }

  if (!seo.meta_description) {
    issues.push(issue("seo", "high", "Missing meta description",
      "No meta description tag found on the page.",
      "The meta description appears in search result snippets.",
      "Write a meta description of 120-160 characters.",
      "easy", true));
  }

  if (seo.h1_count === 0) {
    issues.push(issue("seo", "high", "No H1 heading found",
      "The page does not contain an H1 heading tag.",
      "H1 headings signal the main topic of the page to search engines.",
      "Add a single, descriptive H1 heading.",
      "easy", true));
  }

  if (!seo.canonical_tag) {
    issues.push(issue("seo", "medium", "No canonical tag",
      "No <link rel='canonical'> tag found.",
      "Prevents duplicate content indexing issues.",
      "Add a canonical tag pointing to the preferred URL.",
      "easy", true));
  }

  if (!seo.robots_txt_reachable) {
    issues.push(issue("seo", "medium", "robots.txt not found",
      "Could not access robots.txt at the domain root.",
      "robots.txt helps search crawlers navigate your site.",
      "Create a robots.txt file at your domain root.",
      "easy", true));
  }

  if (!seo.sitemap_xml_reachable) {
    issues.push(issue("seo", "medium", "XML sitemap not found",
      "Could not access sitemap.xml at the domain root.",
      "An XML sitemap helps search engines discover all pages.",
      "Generate and submit an XML sitemap.",
      "easy", true));
  }

  if (seo.images_missing_alt > 0) {
    issues.push(issue("seo", "medium",
      `${seo.images_missing_alt} image(s) missing alt text`,
      `Found ${seo.images_missing_alt} out of ${seo.image_count} images without alt attributes.`,
      "Alt text is essential for accessibility and image search.",
      "Add descriptive alt text to every meaningful image.",
      "easy", true));
  }

  // ---- Performance ----
  const mobilePerf = pagespeed.mobile?.performance_score;
  if (mobilePerf != null && mobilePerf < 50) {
    issues.push(issue("performance", "high", "Poor mobile performance score",
      `Mobile Lighthouse performance score is ${mobilePerf}/100.`,
      "Slow mobile pages drive visitors away and lower search rankings.",
      "Optimize images, reduce JavaScript execution, and improve server response time.",
      "advanced", true));
  }

  // ---- Conversion ----
  if (!conversion.has_form) {
    issues.push(issue("conversion", "high", "No lead capture form found",
      "We could not find any form element on the homepage.",
      "Without a form, visitors have no way to request a quote or contact you.",
      "Add a lead capture form to your homepage.",
      "easy", true));
  }

  if (!conversion.has_whatsapp_link) {
    issues.push(issue("conversion", "high", "No WhatsApp lead channel detected",
      "We could not find a WhatsApp click-to-chat link on the homepage.",
      "Visitors on mobile leave instead of contacting you immediately.",
      "Add a WhatsApp CTA connected to an automated qualification bot.",
      "easy", true));
  }

  if (!conversion.has_clear_cta) {
    issues.push(issue("conversion", "high", "No clear call-to-action text detected",
      "We could not identify standard CTA text patterns.",
      "Without clear CTAs, visitors do not know what action to take next.",
      "Add prominent CTA buttons in your hero and contact sections.",
      "easy", true));
  }

  // ---- Automation ----
  const missingGaps = automation.gaps.filter((g) => !g.present);
  for (const gap of missingGaps) {
    const rec = getGapIssue(gap.key);
    if (rec) issues.push(rec);
  }

  return issues;
}

function issue(
  category: AuditIssueSerialized["category"],
  severity: IssueSeverity,
  title: string,
  finding: string,
  businessImpact: string,
  recommendedFix: string,
  effort: IssueEffort,
  canHelp: boolean
): AuditIssueSerialized {
  return {
    category,
    severity,
    title,
    finding,
    business_impact: businessImpact,
    recommended_fix: recommendedFix,
    effort,
    can_help: canHelp,
    sort_order: 0,
  };
}

function getGapIssue(gapKey: string): AuditIssueSerialized | null {
  switch (gapKey) {
    case "whatsapp":
    case "chat_widget":
    case "lead_form":
      return null;
    case "booking":
      return issue("automation", "medium", "No online booking system",
        "No scheduling or booking link detected on the page.",
        "Without online booking, clients must call or email to schedule.",
        "Add a booking tool like Calendly with automated reminders.",
        "easy", true);
    case "email_capture":
      return issue("automation", "medium", "No email capture mechanism",
        "No newsletter signup or lead magnet detected.",
        "Email capture lets you nurture interested visitors over time.",
        "Add an email signup form or lead magnet download.",
        "easy", true);
    case "crm_hints":
      return issue("automation", "medium", "No CRM integration detected",
        "No evidence of CRM or marketing tool integration.",
        "Leads from your website may go untracked or unfollowed.",
        "Connect forms and chat to a CRM using n8n or Zapier.",
        "moderate", true);
    case "follow_up":
      return issue("automation", "medium", "No automated follow-up path",
        "No evidence of automated follow-up workflows.",
        "Leads not followed up within minutes become cold.",
        "Set up automated email or WhatsApp follow-up sequences.",
        "moderate", true);
    case "automation_evidence":
      return issue("automation", "low", "Limited automation evidence",
        "Limited evidence of workflow automation or integration.",
        "Manual processes slow response times.",
        "Use n8n workflow automation to connect website and CRM.",
        "advanced", true);
    default:
      return null;
  }
}
