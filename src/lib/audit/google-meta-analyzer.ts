// =============================================================================
// Google & Meta Presence Analyzer
// =============================================================================
// Scans HTML for Google ecosystem tags, GBP/Local SEO signals, Meta marketing tags,
// and social sharing metadata. Protects raw identifiers by masking them for UI.
// =============================================================================

import * as cheerio from "cheerio";
import type {
  GoogleMetaAnalysis,
  GoogleVisibilityData,
  GbpLocalData,
  MetaMarketingData,
  SocialSharingData,
} from "./types";

type SchemaObject = Record<string, unknown>;

/**
 * Mask raw tracking identifiers for public display.
 * E.g., G-1234567890 -> G-****7890, 123456789012345 -> ****2345
 */
export function maskTrackingId(id: string | null): string | null {
  if (!id) return null;
  const clean = id.trim();
  if (clean.startsWith("G-")) {
    const suffix = clean.slice(-4);
    return `G-****${suffix}`;
  }
  if (clean.startsWith("GTM-")) {
    const suffix = clean.slice(-4);
    return `GTM-****${suffix}`;
  }
  if (clean.startsWith("AW-")) {
    const suffix = clean.slice(-4);
    return `AW-****${suffix}`;
  }
  if (clean.length >= 8 && /^\d+$/.test(clean)) {
    return `****${clean.slice(-4)}`;
  }
  if (clean.length > 6) {
    return `****${clean.slice(-4)}`;
  }
  return "****";
}

/**
 * Perform complete Google & Meta Presence Analysis.
 */
export async function analyzeGoogleMeta(
  html: string,
  baseUrl: string
): Promise<GoogleMetaAnalysis> {
  const $ = cheerio.load(html);
  const fullHtml = html.toLowerCase();

  // -------------------------------------------------------------------------
  // 1. GOOGLE VISIBILITY CHECKS
  // -------------------------------------------------------------------------
  // GA4
  const ga4Match = html.match(/\b(G-[A-Z0-9]{8,12})\b/i);
  const ga4Id = ga4Match ? ga4Match[1] : null;

  // GTM
  const gtmMatch = html.match(/\b(GTM-[A-Z0-9]{5,10})\b/i);
  const gtmId = gtmMatch ? gtmMatch[1] : null;

  // Google Ads
  const adsMatch = html.match(/\b(AW-[0-9]{8,12})\b/i);
  const adsId = adsMatch ? adsMatch[1] : null;

  // Google Search Console verification meta tag
  const searchConsoleVerified =
    !!$('meta[name="google-site-verification"]').length ||
    fullHtml.includes("google-site-verification");

  // Google Maps embed
  const googleMapsEmbed =
    !!$(
      'iframe[src*="google.com/maps"], iframe[src*="maps.google.com"]'
    ).length;

  // Google Maps / GBP links
  let googleMapsLink = false;
  let gbpLink = false;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      href.includes("maps.google.com") ||
      href.includes("google.com/maps") ||
      href.includes("maps.app.goo.gl")
    ) {
      googleMapsLink = true;
    }
    if (
      href.includes("g.page/") ||
      href.includes("maps.app.goo.gl") ||
      (href.includes("google.com/maps/place") || href.includes("google.com/search?q=") && href.includes("lrd="))
    ) {
      gbpLink = true;
    }
  });

  if (gbpLink) googleMapsLink = true;

  // Schemas
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const detectedSchemasSet = new Set<string>();
  let localBusinessSchemaObj: SchemaObject | null = null;
  let organizationSchemaObj: SchemaObject | null = null;

  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        const extractType = (obj: SchemaObject) => {
          const type = obj["@type"];
          if (type) {
            const types = Array.isArray(type) ? type : [type];
            types.forEach((t) => {
              if (typeof t === "string") {
                detectedSchemasSet.add(t);
                if (
                  t.toLowerCase().includes("localbusiness") ||
                  t.toLowerCase().includes("store") ||
                  t.toLowerCase().includes("restaurant") ||
                  t.toLowerCase().includes("medical") ||
                  t.toLowerCase().includes("service")
                ) {
                  localBusinessSchemaObj = obj;
                }
                if (t.toLowerCase() === "organization") {
                  organizationSchemaObj = obj;
                }
              }
            });
          }
        };

        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === "object") extractType(item as SchemaObject);
          });
        } else if (typeof parsed === "object" && parsed !== null) {
          extractType(parsed as SchemaObject);
          if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
            parsed["@graph"].forEach((graphItem: unknown) => {
              if (graphItem && typeof graphItem === "object") {
                extractType(graphItem as SchemaObject);
              }
            });
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  const detectedSchemas = Array.from(detectedSchemasSet);

  // Privacy Policy link
  const hasPrivacyPolicy =
    !!$('a[href*="privacy"]').length ||
    /privacy\s*policy/i.test(fullHtml);

  // Terms link
  const hasTermsOfService =
    !!$('a[href*="terms"], a[href*="conditions"]').length ||
    /terms\s*(of\s*service|&|and\s*conditions)/i.test(fullHtml);

  // Cookie banner heuristic
  const hasCookieBanner =
    fullHtml.includes("cookiebot") ||
    fullHtml.includes("onetrust") ||
    fullHtml.includes("cookieyes") ||
    fullHtml.includes("termly") ||
    fullHtml.includes("cookie-banner") ||
    fullHtml.includes("consent-banner") ||
    fullHtml.includes("cookie-notice") ||
    fullHtml.includes("gdpr") ||
    !!$('[id*="cookie"], [class*="cookie"], [id*="consent"]').length;

  // Ads.txt check (only if ad scripts found)
  const hasAdPublisherScripts =
    fullHtml.includes("adsbygoogle") ||
    fullHtml.includes("doubleclick.net") ||
    fullHtml.includes("googlesyndication.com") ||
    fullHtml.includes("adservice");

  let hasAdsTxt: boolean | null = null;
  if (hasAdPublisherScripts) {
    try {
      const adsTxtUrl = new URL("/ads.txt", baseUrl).toString();
      const res = await fetch(adsTxtUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });
      hasAdsTxt = res.ok && res.status === 200;
    } catch {
      hasAdsTxt = false;
    }
  }

  const googleVisibility: GoogleVisibilityData = {
    ga4_detected: !!ga4Id || fullHtml.includes("googletagmanager.com/gtag/js?id=g-"),
    ga4_id_masked: maskTrackingId(ga4Id),
    gtm_detected: !!gtmId || fullHtml.includes("googletagmanager.com/gtm.js"),
    gtm_id_masked: maskTrackingId(gtmId),
    google_ads_detected: !!adsId || fullHtml.includes("google_conversion_id"),
    google_ads_id_masked: maskTrackingId(adsId),
    search_console_verified: searchConsoleVerified,
    google_maps_embed: googleMapsEmbed,
    google_maps_link: googleMapsLink,
    gbp_link: gbpLink,
    has_ads_txt: hasAdsTxt,
    detected_schemas: detectedSchemas,
    has_privacy_policy: hasPrivacyPolicy,
    has_terms_of_service: hasTermsOfService,
    has_cookie_banner: hasCookieBanner,
  };

  // -------------------------------------------------------------------------
  // 2. GOOGLE BUSINESS PROFILE & LOCAL SEO CHECKS
  // -------------------------------------------------------------------------
  const schemaTarget: SchemaObject = (localBusinessSchemaObj || organizationSchemaObj) ?? {};

  const rawName = schemaTarget?.name;
  const businessName =
    (typeof rawName === "string" ? rawName : null) ||
    $("title").text().split("|")[0].split("-")[0].trim() ||
    null;

  let businessAddress: string | null = null;
  const rawAddress = schemaTarget?.address;
  if (rawAddress) {
    if (typeof rawAddress === "string") {
      businessAddress = rawAddress;
    } else if (typeof rawAddress === "object" && rawAddress !== null) {
      const addr = rawAddress as Record<string, string>;
      const parts = [
        addr.streetAddress,
        addr.addressLocality,
        addr.addressRegion,
        addr.postalCode,
        addr.addressCountry,
      ].filter(Boolean);
      if (parts.length > 0) businessAddress = parts.join(", ");
    }
  }

  if (!businessAddress) {
    const footerContactText = $("footer, #contact, .contact, #footer").text();
    const addressMatch = footerContactText.match(
      /\d{1,5}\s+[\w\s\.,]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|drv|boulevard|blvd|suite|ste|floor|fl|building|bldg|nagar|road|chowk|sector|phase|colony|area|city|state|pin|zip)[\w\s\.,]*/i
    );
    if (addressMatch) {
      businessAddress = addressMatch[0].trim().slice(0, 100);
    }
  }

  const phonePresent =
    !!$('a[href^="tel:"]').length ||
    /\+?\d{1,4}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(fullHtml);

  const clickToCallPresent = !!$('a[href^="tel:"]').length;
  const emailPresent = !!$('a[href^="mailto:"]').length || /[\w.-]+@[\w.-]+\.\w+/.test(fullHtml);

  const openingHoursPresent =
    !!schemaTarget?.openingHours ||
    !!schemaTarget?.openingHoursSpecification ||
    /opening\s*hours|business\s*hours|mon\s*-\s*fri|monday\s*-\s*friday|working\s*hours/i.test(
      fullHtml
    );

  const contactPagePresent =
    !!$('a[href*="contact"]').length ||
    /contact\s*us|get\s*in\s*touch/i.test(fullHtml);

  const serviceAreaKeywordsPresent =
    /service\s*area|serving|locations?|in\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/.test(
      $("title").text() + " " + $("h1").text() + " " + $("h2").text()
    );

  const reviewsOrSocialProofPresent =
    /google\s*reviews?|trustpilot|yelp|customer\s*reviews?|star\s*rating|\d\.\d\s*stars?/i.test(
      fullHtml
    ) ||
    !!$('a[href*="trustpilot"], a[href*="yelp"], a[href*="google.com/maps"]').length;

  const sameAsLinks: string[] = [];
  const rawSameAs = schemaTarget?.sameAs;
  if (rawSameAs) {
    const sameAsArr = Array.isArray(rawSameAs) ? rawSameAs : [rawSameAs];
    sameAsArr.forEach((link: unknown) => {
      if (typeof link === "string") sameAsLinks.push(link);
    });
  }

  const napDetails: string[] = [];
  let napConsistent = true;

  if (businessName) {
    napDetails.push(`Business Name detected: "${businessName}"`);
  } else {
    napConsistent = false;
    napDetails.push("Business Name missing in structured data.");
  }

  if (businessAddress) {
    napDetails.push(`Business Address detected: "${businessAddress}"`);
  } else {
    napConsistent = false;
    napDetails.push("Business Address not explicitly structured or detected.");
  }

  if (clickToCallPresent) {
    napDetails.push("Click-to-call phone number link active.");
  } else {
    napConsistent = false;
    napDetails.push("Missing click-to-call phone link (tel:).");
  }

  const gbpAndLocal: GbpLocalData = {
    gbp_link_present: gbpLink,
    local_business_schema_complete:
      !!localBusinessSchemaObj && !!businessName && !!businessAddress && phonePresent,
    business_name: businessName,
    business_address: businessAddress,
    phone_present: phonePresent,
    click_to_call_present: clickToCallPresent,
    email_present: emailPresent,
    opening_hours_present: openingHoursPresent,
    contact_page_present: contactPagePresent,
    service_area_keywords_present: serviceAreaKeywordsPresent,
    reviews_or_social_proof_present: reviewsOrSocialProofPresent,
    same_as_links: sameAsLinks,
    nap_consistency: {
      consistent: napConsistent,
      details: napDetails,
    },
  };

  // -------------------------------------------------------------------------
  // 3. META MARKETING CHECKS
  // -------------------------------------------------------------------------
  const pixelDetected =
    fullHtml.includes("connect.facebook.net") ||
    fullHtml.includes("fbq(") ||
    fullHtml.includes("facebook.com/tr");

  // Extract Meta Pixel ID
  let pixelId: string | null = null;
  const pixelIdMatch = html.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{12,16})['"]/i);
  if (pixelIdMatch) {
    pixelId = pixelIdMatch[1];
  } else {
    const scriptPixelMatch = html.match(/facebook\.com\/tr\?id=(\d{12,16})/i);
    if (scriptPixelMatch) pixelId = scriptPixelMatch[1];
  }

  const domainVerified =
    !!$('meta[name="facebook-domain-verification"]').length ||
    fullHtml.includes("facebook-domain-verification");

  const facebookPageLink =
    !!$('a[href*="facebook.com/"], a[href*="fb.com/"]').length;

  const instagramProfileLink =
    !!$('a[href*="instagram.com/"]').length;

  const whatsappLink =
    fullHtml.includes("wa.me") ||
    fullHtml.includes("api.whatsapp.com") ||
    !!$('a[href*="wa.me"], a[href*="whatsapp"]').length;

  const metaMarketing: MetaMarketingData = {
    pixel_detected: pixelDetected,
    pixel_id_masked: maskTrackingId(pixelId),
    domain_verified: domainVerified,
    facebook_page_link: facebookPageLink,
    instagram_profile_link: instagramProfileLink,
    whatsapp_link: whatsappLink,
    capi_status: "Requires account connection to verify",
  };

  // -------------------------------------------------------------------------
  // 4. SOCIAL SHARING METADATA CHECKS
  // -------------------------------------------------------------------------
  const socialSharing: SocialSharingData = {
    og_title: $('meta[property="og:title"]').attr("content") || null,
    og_description: $('meta[property="og:description"]').attr("content") || null,
    og_image: $('meta[property="og:image"]').attr("content") || null,
    og_url: $('meta[property="og:url"]').attr("content") || null,
    og_type: $('meta[property="og:type"]').attr("content") || null,
    twitter_card: $('meta[name="twitter:card"]').attr("content") || null,
    twitter_title: $('meta[name="twitter:title"]').attr("content") || null,
    twitter_description: $('meta[name="twitter:description"]').attr("content") || null,
    twitter_image: $('meta[name="twitter:image"]').attr("content") || null,
  };

  return {
    googleVisibility,
    gbpAndLocal,
    metaMarketing,
    socialSharing,
  };
}
