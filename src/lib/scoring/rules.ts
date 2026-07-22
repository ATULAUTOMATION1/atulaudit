// =============================================================================
// Scoring Rules — Documented weights for each audit category
// =============================================================================

import type {
  SeoAnalysis,
  PageSpeedResults,
  ConversionAnalysis,
  AutomationAnalysis,
  GoogleMetaAnalysis,
} from "@/lib/audit/types";

export interface ScoringRule {
  key: string;
  label: string;
  maxPoints: number;
  evaluate: (data: ScoringData) => number;
}

export interface ScoringData {
  seo: SeoAnalysis;
  pagespeed: PageSpeedResults;
  conversion: ConversionAnalysis;
  automation: AutomationAnalysis;
  googleMeta: GoogleMetaAnalysis;
  health: {
    https_enabled: boolean;
    language_attribute: string | null;
    viewport_meta: boolean;
    favicon_present: boolean;
  };
}

// ---- SEO Rules (100 points total) ----
export const seoRules: ScoringRule[] = [
  {
    key: "https",
    label: "HTTPS enabled",
    maxPoints: 10,
    evaluate: (d) => (d.health.https_enabled ? 10 : 0),
  },
  {
    key: "title",
    label: "Title tag present and optimal length",
    maxPoints: 10,
    evaluate: (d) => {
      if (!d.seo.title) return 0;
      const len = d.seo.title_length;
      if (len >= 30 && len <= 60) return 10;
      if (len >= 20 && len <= 70) return 7;
      return 4;
    },
  },
  {
    key: "meta_description",
    label: "Meta description present and optimal length",
    maxPoints: 10,
    evaluate: (d) => {
      if (!d.seo.meta_description) return 0;
      const len = d.seo.meta_description_length;
      if (len >= 120 && len <= 160) return 10;
      if (len >= 70 && len <= 200) return 7;
      return 4;
    },
  },
  {
    key: "h1",
    label: "Exactly one H1 heading",
    maxPoints: 8,
    evaluate: (d) => (d.seo.h1_count === 1 ? 8 : d.seo.h1_count > 1 ? 4 : 0),
  },
  {
    key: "canonical",
    label: "Canonical tag present",
    maxPoints: 8,
    evaluate: (d) => (d.seo.canonical_tag ? 8 : 0),
  },
  {
    key: "robots_txt",
    label: "robots.txt accessible",
    maxPoints: 7,
    evaluate: (d) => (d.seo.robots_txt_reachable ? 7 : 0),
  },
  {
    key: "sitemap",
    label: "sitemap.xml accessible",
    maxPoints: 7,
    evaluate: (d) => (d.seo.sitemap_xml_reachable ? 7 : 0),
  },
  {
    key: "og_tags",
    label: "Open Graph title and description",
    maxPoints: 6,
    evaluate: (d) => {
      let points = 0;
      if (d.seo.og_title) points += 3;
      if (d.seo.og_description) points += 3;
      return points;
    },
  },
  {
    key: "structured_data",
    label: "Structured data (JSON-LD) present",
    maxPoints: 6,
    evaluate: (d) => {
      if (d.seo.structured_data_count >= 2) return 6;
      if (d.seo.structured_data_count === 1) return 4;
      return 0;
    },
  },
  {
    key: "images_alt",
    label: "Images have alt text",
    maxPoints: 8,
    evaluate: (d) => {
      if (d.seo.image_count === 0) return 8;
      const coverage =
        (d.seo.image_count - d.seo.images_missing_alt) / d.seo.image_count;
      return Math.round(coverage * 8);
    },
  },
  {
    key: "internal_links",
    label: "Internal links present",
    maxPoints: 5,
    evaluate: (d) => {
      if (d.seo.internal_link_count >= 10) return 5;
      if (d.seo.internal_link_count >= 5) return 4;
      if (d.seo.internal_link_count >= 1) return 2;
      return 0;
    },
  },
  {
    key: "word_count",
    label: "Sufficient content (word count)",
    maxPoints: 5,
    evaluate: (d) => {
      if (d.seo.word_count >= 500) return 5;
      if (d.seo.word_count >= 300) return 4;
      if (d.seo.word_count >= 100) return 2;
      return 0;
    },
  },
  {
    key: "language",
    label: "Language attribute set",
    maxPoints: 5,
    evaluate: (d) => (d.health.language_attribute ? 5 : 0),
  },
  {
    key: "viewport",
    label: "Viewport meta tag",
    maxPoints: 5,
    evaluate: (d) => (d.health.viewport_meta ? 5 : 0),
  },
];

// ---- Performance Rules (100 points total) ----
export const performanceRules: ScoringRule[] = [
  {
    key: "lighthouse_perf",
    label: "Lighthouse performance score",
    maxPoints: 50,
    evaluate: (d) => {
      const mobile = d.pagespeed.mobile?.performance_score;
      const desktop = d.pagespeed.desktop?.performance_score;
      if (mobile != null && desktop != null) {
        return Math.round(((mobile * 0.6 + desktop * 0.4) / 100) * 50);
      }
      if (mobile != null) return Math.round((mobile / 100) * 50);
      if (desktop != null) return Math.round((desktop / 100) * 50);
      return 25;
    },
  },
  {
    key: "lcp",
    label: "Largest Contentful Paint (LCP)",
    maxPoints: 15,
    evaluate: (d) => {
      const lcp = d.pagespeed.mobile?.lcp_ms ?? d.pagespeed.desktop?.lcp_ms;
      if (lcp == null) return 8;
      if (lcp <= 2500) return 15;
      if (lcp <= 4000) return 10;
      if (lcp <= 6000) return 5;
      return 0;
    },
  },
  {
    key: "cls",
    label: "Cumulative Layout Shift (CLS)",
    maxPoints: 10,
    evaluate: (d) => {
      const cls = d.pagespeed.mobile?.cls ?? d.pagespeed.desktop?.cls;
      if (cls == null) return 5;
      if (cls <= 0.1) return 10;
      if (cls <= 0.25) return 6;
      return 2;
    },
  },
  {
    key: "fcp",
    label: "First Contentful Paint (FCP)",
    maxPoints: 10,
    evaluate: (d) => {
      const fcp = d.pagespeed.mobile?.fcp_ms ?? d.pagespeed.desktop?.fcp_ms;
      if (fcp == null) return 5;
      if (fcp <= 1800) return 10;
      if (fcp <= 3000) return 6;
      return 2;
    },
  },
  {
    key: "inp",
    label: "Interaction to Next Paint (INP)",
    maxPoints: 10,
    evaluate: (d) => {
      const inp = d.pagespeed.mobile?.inp_ms ?? d.pagespeed.desktop?.inp_ms;
      if (inp == null) return 5;
      if (inp <= 200) return 10;
      if (inp <= 500) return 6;
      return 2;
    },
  },
  {
    key: "ttfb",
    label: "Time to First Byte (TTFB)",
    maxPoints: 5,
    evaluate: (d) => {
      const ttfb = d.pagespeed.mobile?.ttfb_ms ?? d.pagespeed.desktop?.ttfb_ms;
      if (ttfb == null) return 3;
      if (ttfb <= 800) return 5;
      if (ttfb <= 1800) return 3;
      return 1;
    },
  },
];

// ---- Accessibility Rules (100 points total) ----
export const accessibilityRules: ScoringRule[] = [
  {
    key: "lighthouse_a11y",
    label: "Lighthouse accessibility score",
    maxPoints: 60,
    evaluate: (d) => {
      const mobile = d.pagespeed.mobile?.accessibility_score;
      const desktop = d.pagespeed.desktop?.accessibility_score;
      const score = mobile ?? desktop;
      if (score == null) return 30;
      return Math.round((score / 100) * 60);
    },
  },
  {
    key: "alt_text_coverage",
    label: "Image alt text coverage",
    maxPoints: 15,
    evaluate: (d) => {
      const total = d.seo.image_count;
      if (total === 0) return 15;
      const coverage = (total - d.seo.images_missing_alt) / total;
      return Math.round(coverage * 15);
    },
  },
  {
    key: "language_attr",
    label: "HTML language attribute",
    maxPoints: 10,
    evaluate: (d) => (d.health.language_attribute ? 10 : 0),
  },
  {
    key: "viewport_a11y",
    label: "Viewport meta tag",
    maxPoints: 10,
    evaluate: (d) => (d.health.viewport_meta ? 10 : 0),
  },
  {
    key: "heading_structure",
    label: "Proper heading structure",
    maxPoints: 5,
    evaluate: (d) => {
      if (d.seo.h1_count === 1 && d.seo.h2_count > 0) return 5;
      if (d.seo.h1_count === 1) return 3;
      return 0;
    },
  },
];

// ---- Conversion Rules (100 points total) ----
export const conversionRules: ScoringRule[] = [
  {
    key: "contact_form",
    label: "Contact or lead capture form",
    maxPoints: 15,
    evaluate: (d) => (d.conversion.has_contact_form ? 15 : d.conversion.has_form ? 10 : 0),
  },
  {
    key: "phone_email",
    label: "Phone and email links",
    maxPoints: 10,
    evaluate: (d) => {
      let points = 0;
      if (d.conversion.has_phone_link) points += 5;
      if (d.conversion.has_email_link) points += 5;
      return points;
    },
  },
  {
    key: "whatsapp",
    label: "WhatsApp contact link",
    maxPoints: 10,
    evaluate: (d) => (d.conversion.has_whatsapp_link ? 10 : 0),
  },
  {
    key: "chat_widget",
    label: "Chat widget or chatbot",
    maxPoints: 10,
    evaluate: (d) => (d.conversion.has_chat_widget ? 10 : 0),
  },
  {
    key: "cta_text",
    label: "Clear call-to-action text",
    maxPoints: 10,
    evaluate: (d) => (d.conversion.has_clear_cta ? 10 : 0),
  },
  {
    key: "booking",
    label: "Online booking or scheduling",
    maxPoints: 8,
    evaluate: (d) => (d.conversion.has_booking_link ? 8 : 0),
  },
  {
    key: "social_profiles",
    label: "Social media presence",
    maxPoints: 7,
    evaluate: (d) => {
      const count = d.conversion.detected_social_platforms.length;
      if (count >= 3) return 7;
      if (count >= 1) return 4;
      return 0;
    },
  },
  {
    key: "testimonials",
    label: "Testimonials or reviews",
    maxPoints: 8,
    evaluate: (d) => (d.conversion.has_testimonials ? 8 : 0),
  },
  {
    key: "trust_signals",
    label: "Trust signals (logos, certifications)",
    maxPoints: 7,
    evaluate: (d) => (d.conversion.has_trust_signals ? 7 : 0),
  },
  {
    key: "pricing",
    label: "Pricing information available",
    maxPoints: 5,
    evaluate: (d) => (d.conversion.has_pricing_link ? 5 : 0),
  },
  {
    key: "multiple_ctas",
    label: "Multiple CTAs across the page",
    maxPoints: 10,
    evaluate: (d) => (d.conversion.has_multiple_ctas ? 10 : 0),
  },
];

// ---- Google Visibility Rules (100 points total) ----
export const googleVisibilityRules: ScoringRule[] = [
  {
    key: "ga4",
    label: "GA4 analytics tag detected",
    maxPoints: 25,
    evaluate: (d) => (d.googleMeta.googleVisibility.ga4_detected ? 25 : 0),
  },
  {
    key: "gtm",
    label: "Google Tag Manager container detected",
    maxPoints: 20,
    evaluate: (d) => (d.googleMeta.googleVisibility.gtm_detected ? 20 : 0),
  },
  {
    key: "google_ads",
    label: "Google Ads tag detected",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.googleVisibility.google_ads_detected ? 15 : 0),
  },
  {
    key: "search_console",
    label: "Search Console verification meta tag",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.googleVisibility.search_console_verified ? 15 : 0),
  },
  {
    key: "google_maps",
    label: "Google Maps embed or link",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.googleVisibility.google_maps_link || d.googleMeta.googleVisibility.google_maps_embed ? 15 : 0),
  },
  {
    key: "trust_pages",
    label: "Privacy Policy and Terms pages",
    maxPoints: 10,
    evaluate: (d) => {
      let pts = 0;
      if (d.googleMeta.googleVisibility.has_privacy_policy) pts += 5;
      if (d.googleMeta.googleVisibility.has_terms_of_service) pts += 5;
      return pts;
    },
  },
];

// ---- Google Business Profile & Local SEO Rules (100 points total - Exact Prompt Weights) ----
export const gbpRules: ScoringRule[] = [
  {
    key: "maps_gbp_link",
    label: "Maps/GBP link present",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.gbp_link_present ? 15 : 0),
  },
  {
    key: "local_business_schema",
    label: "Complete LocalBusiness schema",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.local_business_schema_complete ? 15 : 0),
  },
  {
    key: "business_name",
    label: "Business name detected",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.business_name ? 10 : 0),
  },
  {
    key: "address_details",
    label: "Address or service-area details",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.business_address ? 10 : 0),
  },
  {
    key: "phone_present",
    label: "Phone present",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.phone_present ? 10 : 0),
  },
  {
    key: "click_to_call",
    label: "Click-to-call link",
    maxPoints: 5,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.click_to_call_present ? 5 : 0),
  },
  {
    key: "opening_hours",
    label: "Opening hours details",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.opening_hours_present ? 10 : 0),
  },
  {
    key: "contact_page",
    label: "Contact page link",
    maxPoints: 5,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.contact_page_present ? 5 : 0),
  },
  {
    key: "local_keywords",
    label: "Local keywords/service area in title/H1/content",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.service_area_keywords_present ? 10 : 0),
  },
  {
    key: "reviews_proof",
    label: "Reviews/testimonials/social proof",
    maxPoints: 5,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.reviews_or_social_proof_present ? 5 : 0),
  },
  {
    key: "same_as_links",
    label: "sameAs profile links in schema",
    maxPoints: 5,
    evaluate: (d) => (d.googleMeta.gbpAndLocal.same_as_links.length > 0 ? 5 : 0),
  },
];

// ---- Meta Marketing Rules (100 points total) ----
export const metaMarketingRules: ScoringRule[] = [
  {
    key: "meta_pixel",
    label: "Meta Pixel code detected",
    maxPoints: 40,
    evaluate: (d) => (d.googleMeta.metaMarketing.pixel_detected ? 40 : 0),
  },
  {
    key: "domain_verification",
    label: "Facebook domain verification tag",
    maxPoints: 20,
    evaluate: (d) => (d.googleMeta.metaMarketing.domain_verified ? 20 : 0),
  },
  {
    key: "fb_page",
    label: "Facebook page link",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.metaMarketing.facebook_page_link ? 15 : 0),
  },
  {
    key: "ig_profile",
    label: "Instagram profile link",
    maxPoints: 15,
    evaluate: (d) => (d.googleMeta.metaMarketing.instagram_profile_link ? 15 : 0),
  },
  {
    key: "whatsapp_marketing",
    label: "WhatsApp marketing CTA link",
    maxPoints: 10,
    evaluate: (d) => (d.googleMeta.metaMarketing.whatsapp_link ? 10 : 0),
  },
];

// ---- Social Sharing Rules (100 points total) ----
export const socialSharingRules: ScoringRule[] = [
  {
    key: "og_title",
    label: "og:title tag present",
    maxPoints: 20,
    evaluate: (d) => (d.googleMeta.socialSharing.og_title ? 20 : 0),
  },
  {
    key: "og_description",
    label: "og:description tag present",
    maxPoints: 20,
    evaluate: (d) => (d.googleMeta.socialSharing.og_description ? 20 : 0),
  },
  {
    key: "og_image",
    label: "og:image preview image tag present",
    maxPoints: 25,
    evaluate: (d) => (d.googleMeta.socialSharing.og_image ? 25 : 0),
  },
  {
    key: "og_url_type",
    label: "og:url and og:type tags",
    maxPoints: 15,
    evaluate: (d) => {
      let pts = 0;
      if (d.googleMeta.socialSharing.og_url) pts += 8;
      if (d.googleMeta.socialSharing.og_type) pts += 7;
      return pts;
    },
  },
  {
    key: "twitter_cards",
    label: "Twitter/X Card tags present",
    maxPoints: 20,
    evaluate: (d) => {
      let pts = 0;
      if (d.googleMeta.socialSharing.twitter_card) pts += 5;
      if (d.googleMeta.socialSharing.twitter_title) pts += 5;
      if (d.googleMeta.socialSharing.twitter_description) pts += 5;
      if (d.googleMeta.socialSharing.twitter_image) pts += 5;
      return pts;
    },
  },
];
