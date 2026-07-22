// =============================================================================
// HTML Analyzer — Cheerio-based static HTML parsing
// =============================================================================

import * as cheerio from "cheerio";
import type { SeoAnalysis, ConversionAnalysis } from "@/lib/audit/types";

export interface HtmlParseResult {
  seo: Omit<SeoAnalysis, "robots_txt_reachable" | "sitemap_xml_reachable">;
  conversion: ConversionAnalysis;
  htmlSizeBytes: number;
  languageAttribute: string | null;
  viewportMeta: boolean;
  faviconPresent: boolean;
}

/**
 * Parse HTML and extract SEO, conversion, and health data.
 */
export function analyzeHtml(html: string, baseUrl: string): HtmlParseResult {
  const $ = cheerio.load(html);
  const baseParsed = new URL(baseUrl);
  const baseHost = baseParsed.hostname;

  // ---- Health ----
  const languageAttribute = $("html").attr("lang") || null;
  const viewportMeta = !!$(
    'meta[name="viewport"], meta[name="Viewport"]'
  ).length;
  const faviconPresent = !!(
    $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .length
  );

  // ---- SEO ----
  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const robotsMeta = $('meta[name="robots"]').attr("content") || null;
  const ogTitle =
    $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() || null;

  const h1Count = $("h1").length;
  const h2Count = $("h2").length;

  // Structured data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const structuredDataTypes: string[] = [];
  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        const type = parsed["@type"];
        if (type) {
          if (Array.isArray(type)) {
            structuredDataTypes.push(...type);
          } else {
            structuredDataTypes.push(type);
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  // Word count (body text only)
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText
    ? bodyText.split(/\s+/).filter((w) => w.length > 0).length
    : 0;

  // Links
  let internalLinks = 0;
  let externalLinks = 0;
  let brokenHrefs = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() || "";
    if (!href || href === "#" || href.startsWith("javascript:")) {
      brokenHrefs++;
      return;
    }
    try {
      const linkUrl = new URL(href, baseUrl);
      if (linkUrl.hostname === baseHost) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {
      if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
        internalLinks++;
      } else {
        brokenHrefs++;
      }
    }
  });

  // Images
  const images = $("img");
  const imageCount = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null || alt.trim() === "") {
      imagesMissingAlt++;
    }
  });

  // Noindex
  const hasNoindex =
    robotsMeta?.toLowerCase().includes("noindex") ||
    !!$('meta[name="googlebot"][content*="noindex"]').length;

  // Indexing risks
  const indexingRisks: string[] = [];
  if (hasNoindex) indexingRisks.push("Page has noindex directive");
  if (!title) indexingRisks.push("Missing title tag");
  if (!metaDescription) indexingRisks.push("Missing meta description");
  if (h1Count === 0) indexingRisks.push("No H1 heading found");
  if (h1Count > 1) indexingRisks.push("Multiple H1 headings detected");
  if (wordCount < 100)
    indexingRisks.push("Very low word count (thin content risk)");

  // ---- Conversion ----
  const fullHtml = html.toLowerCase();

  // Forms
  const forms = $("form");
  const hasForm = forms.length > 0;
  const hasContactForm =
    hasForm &&
    !!(
      forms.filter(
        (_, el) =>
          Boolean(
            $(el).html()?.toLowerCase().includes("email") ||
            $(el).html()?.toLowerCase().includes("message") ||
            $(el).html()?.toLowerCase().includes("contact") ||
            $(el).attr("id")?.toLowerCase().includes("contact") ||
            $(el).attr("class")?.toLowerCase().includes("contact")
          )
      ).length
    );

  // Phone links
  const phoneLinks: string[] = [];
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    phoneLinks.push(href.replace("tel:", ""));
  });

  // Email links
  const emailLinks: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    emailLinks.push(href.replace("mailto:", "").split("?")[0]);
  });

  // WhatsApp
  const hasWhatsapp =
    fullHtml.includes("wa.me") ||
    fullHtml.includes("api.whatsapp.com") ||
    fullHtml.includes("whatsapp.com/send") ||
    !!$('a[href*="wa.me"], a[href*="whatsapp"]').length;

  // Booking
  const bookingProviders: string[] = [];
  const bookingPatterns: Record<string, RegExp> = {
    Calendly: /calendly\.com/i,
    "Cal.com": /cal\.com/i,
    "Zoho Bookings": /zoho.*book/i,
    "Google Calendar": /calendar\.google\.com/i,
    Acuity: /acuityscheduling\.com/i,
    "Square Appointments": /squareup\.com.*appointments/i,
  };
  for (const [name, pattern] of Object.entries(bookingPatterns)) {
    if (pattern.test(fullHtml)) bookingProviders.push(name);
  }

  // Chat widgets
  const chatProviders: string[] = [];
  const chatPatterns: Record<string, RegExp> = {
    Tawk: /tawk\.to/i,
    Intercom: /intercom/i,
    Crisp: /crisp\.chat/i,
    Drift: /drift\.com/i,
    LiveChat: /livechat/i,
    "Facebook Messenger": /m\.me|messenger/i,
    Zendesk: /zopim|zendesk/i,
    Freshchat: /freshchat/i,
    HubSpot: /hubspot.*chat/i,
    Tidio: /tidio/i,
  };
  for (const [name, pattern] of Object.entries(chatPatterns)) {
    if (pattern.test(fullHtml)) chatProviders.push(name);
  }

  // CTA text patterns
  const ctaTexts: string[] = [];
  const ctaPatterns =
    /\b(contact\s*us|get\s*(a\s*)?quote|book\s*(a\s*)?(demo|call|meeting|appointment|consultation)|start\s*(now|free|trial)|call\s*(us|now|today)|free\s*(consultation|audit|trial)|enquir[ey]|request\s*(a\s*)?(demo|quote|callback)|schedule|sign\s*up|get\s*started|learn\s*more|try\s*(it\s*)?free)\b/gi;
  $("a, button").each((_, el) => {
    const text = $(el).text().trim();
    if (text && ctaPatterns.test(text) && text.length < 60) {
      ctaTexts.push(text);
      ctaPatterns.lastIndex = 0; // Reset regex
    }
  });

  // Testimonials
  const hasTestimonials =
    /testimonial|review|what\s*(our\s*)?(clients?|customers?)\s*say|rating|stars?\s*\d/i.test(
      fullHtml
    );

  // Social profiles
  const socialPlatforms: string[] = [];
  const socialPatterns: Record<string, RegExp> = {
    Facebook: /facebook\.com|fb\.com/i,
    Twitter: /twitter\.com|x\.com/i,
    LinkedIn: /linkedin\.com/i,
    Instagram: /instagram\.com/i,
    YouTube: /youtube\.com/i,
    Pinterest: /pinterest\.com/i,
  };
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [name, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !socialPlatforms.includes(name)) {
        socialPlatforms.push(name);
      }
    }
  });

  // Pricing
  const hasPricing =
    /pricing|price|plans?\s*(and|&)?\s*pricing|our\s*plans/i.test(fullHtml) ||
    !!$('a[href*="pricing"], a[href*="plans"]').length;

  // Trust signals
  const hasTrustSignals =
    /client\s*logos?|trusted\s*by|as\s*seen\s*(in|on)|case\s*stud(y|ies)|partner(s|ship)|certified|award|accredit/i.test(
      fullHtml
    );

  const conversionResult: ConversionAnalysis = {
    has_form: hasForm,
    has_contact_form: hasContactForm,
    has_phone_link: phoneLinks.length > 0,
    has_email_link: emailLinks.length > 0,
    has_whatsapp_link: hasWhatsapp,
    has_booking_link: bookingProviders.length > 0,
    has_chat_widget: chatProviders.length > 0,
    has_testimonials: hasTestimonials,
    has_social_profiles: socialPlatforms.length > 0,
    has_clear_cta: ctaTexts.length > 0,
    has_pricing_link: hasPricing,
    has_trust_signals: hasTrustSignals,
    has_multiple_ctas: ctaTexts.length >= 2,
    detected_chat_providers: chatProviders,
    detected_booking_providers: bookingProviders,
    detected_social_platforms: socialPlatforms,
    cta_texts: [...new Set(ctaTexts)].slice(0, 10),
    phone_numbers: [...new Set(phoneLinks)].slice(0, 5),
    email_addresses: [...new Set(emailLinks)].slice(0, 5),
  };

  return {
    seo: {
      canonical_tag: canonical,
      robots_meta: robotsMeta,
      title,
      title_length: title?.length || 0,
      meta_description: metaDescription,
      meta_description_length: metaDescription?.length || 0,
      og_title: ogTitle,
      og_description: ogDescription,
      h1_count: h1Count,
      h2_count: h2Count,
      structured_data_count: jsonLdScripts.length,
      structured_data_types: [...new Set(structuredDataTypes)],
      word_count: wordCount,
      internal_link_count: internalLinks,
      external_link_count: externalLinks,
      broken_href_count: brokenHrefs,
      image_count: imageCount,
      images_missing_alt: imagesMissingAlt,
      has_noindex: hasNoindex,
      indexing_risks: indexingRisks,
    },
    conversion: conversionResult,
    htmlSizeBytes: Buffer.byteLength(html, "utf-8"),
    languageAttribute,
    viewportMeta,
    faviconPresent,
  };
}
