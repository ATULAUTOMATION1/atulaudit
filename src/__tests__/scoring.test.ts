import { describe, it, expect } from "vitest";
import { calculateScores } from "@/lib/scoring/engine";
import type { ScoringData } from "@/lib/scoring/rules";

function makeScoringData(overrides: Partial<ScoringData> = {}): ScoringData {
  return {
    seo: {
      robots_txt_reachable: true,
      sitemap_xml_reachable: true,
      canonical_tag: "https://example.com",
      robots_meta: null,
      title: "Test Page Title - Example",
      title_length: 30,
      meta_description: "This is a test meta description that is long enough to be considered good for search results.",
      meta_description_length: 95,
      og_title: "Test OG Title",
      og_description: "Test OG Description",
      h1_count: 1,
      h2_count: 3,
      structured_data_count: 1,
      structured_data_types: ["Organization"],
      word_count: 500,
      internal_link_count: 15,
      external_link_count: 3,
      broken_href_count: 0,
      image_count: 5,
      images_missing_alt: 0,
      has_noindex: false,
      indexing_risks: [],
      ...(overrides.seo || {}),
    },
    pagespeed: {
      mobile: {
        performance_score: 85,
        seo_score: 90,
        accessibility_score: 92,
        best_practices_score: 88,
        lcp_ms: 2000,
        cls: 0.05,
        fcp_ms: 1500,
        inp_ms: 150,
        ttfb_ms: 500,
        tbt_ms: 200,
        speed_index_ms: 3000,
        actionable_audits: [],
      },
      desktop: {
        performance_score: 92,
        seo_score: 95,
        accessibility_score: 95,
        best_practices_score: 92,
        lcp_ms: 1500,
        cls: 0.02,
        fcp_ms: 800,
        inp_ms: 100,
        ttfb_ms: 300,
        tbt_ms: 100,
        speed_index_ms: 2000,
        actionable_audits: [],
      },
      api_configured: true,
      ...(overrides.pagespeed || {}),
    },
    conversion: {
      has_form: true,
      has_contact_form: true,
      has_phone_link: true,
      has_email_link: true,
      has_whatsapp_link: true,
      has_booking_link: true,
      has_chat_widget: true,
      has_testimonials: true,
      has_social_profiles: true,
      has_clear_cta: true,
      has_pricing_link: true,
      has_trust_signals: true,
      has_multiple_ctas: true,
      detected_chat_providers: ["Tawk"],
      detected_booking_providers: ["Calendly"],
      detected_social_platforms: ["Facebook", "LinkedIn", "Instagram"],
      cta_texts: ["Contact Us", "Get a Quote"],
      phone_numbers: ["+919999999999"],
      email_addresses: ["hello@example.com"],
      ...(overrides.conversion || {}),
    },
    automation: {
      gaps: [
        { key: "whatsapp", label: "WhatsApp", present: true, weight: 15 },
        { key: "chat_widget", label: "Chat", present: true, weight: 15 },
        { key: "lead_form", label: "Form", present: true, weight: 15 },
        { key: "booking", label: "Booking", present: true, weight: 12 },
        { key: "email_capture", label: "Email", present: true, weight: 10 },
        { key: "follow_up", label: "Follow-up", present: true, weight: 10 },
        { key: "crm_hints", label: "CRM", present: false, weight: 10 },
        { key: "automation_evidence", label: "Automation", present: true, weight: 13 },
      ],
      readiness_score: 90,
      ...(overrides.automation || {}),
    },
    googleMeta: {
      googleVisibility: {
        ga4_detected: true,
        ga4_id_masked: "G-****1234",
        gtm_detected: true,
        gtm_id_masked: "GTM-****1234",
        google_ads_detected: true,
        google_ads_id_masked: "AW-****1234",
        search_console_verified: true,
        google_maps_embed: true,
        google_maps_link: true,
        gbp_link: true,
        has_ads_txt: null,
        detected_schemas: ["LocalBusiness"],
        has_privacy_policy: true,
        has_terms_of_service: true,
        has_cookie_banner: true,
      },
      gbpAndLocal: {
        gbp_link_present: true,
        local_business_schema_complete: true,
        business_name: "Acme Corp",
        business_address: "123 Street",
        phone_present: true,
        click_to_call_present: true,
        email_present: true,
        opening_hours_present: true,
        contact_page_present: true,
        service_area_keywords_present: true,
        reviews_or_social_proof_present: true,
        same_as_links: ["https://facebook.com"],
        nap_consistency: { consistent: true, details: ["Name matches"] },
      },
      metaMarketing: {
        pixel_detected: true,
        pixel_id_masked: "****1234",
        domain_verified: true,
        facebook_page_link: true,
        instagram_profile_link: true,
        whatsapp_link: true,
        capi_status: "Requires account connection to verify",
      },
      socialSharing: {
        og_title: "Title",
        og_description: "Description",
        og_image: "https://example.com/img.jpg",
        og_url: "https://example.com",
        og_type: "website",
        twitter_card: "summary",
        twitter_title: "Title",
        twitter_description: "Desc",
        twitter_image: "https://example.com/img.jpg",
      },
      ...(overrides.googleMeta || {}),
    },
    health: {
      https_enabled: true,
      language_attribute: "en",
      viewport_meta: true,
      favicon_present: true,
      ...(overrides.health || {}),
    },
  };
}

describe("calculateScores", () => {
  it("returns scores between 0 and 100", () => {
    const data = makeScoringData();
    const scores = calculateScores(data);

    expect(scores.overall).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeLessThanOrEqual(100);
    expect(scores.seo).toBeGreaterThanOrEqual(0);
    expect(scores.seo).toBeLessThanOrEqual(100);
    expect(scores.performance).toBeGreaterThanOrEqual(0);
    expect(scores.performance).toBeLessThanOrEqual(100);
    expect(scores.accessibility).toBeGreaterThanOrEqual(0);
    expect(scores.accessibility).toBeLessThanOrEqual(100);
    expect(scores.conversion).toBeGreaterThanOrEqual(0);
    expect(scores.conversion).toBeLessThanOrEqual(100);
    expect(scores.google_visibility).toBeGreaterThanOrEqual(0);
    expect(scores.gbp_readiness).toBeGreaterThanOrEqual(0);
    expect(scores.meta_marketing).toBeGreaterThanOrEqual(0);
    expect(scores.social_sharing).toBeGreaterThanOrEqual(0);
  });

  it("gives high scores for a well-configured website", () => {
    const data = makeScoringData();
    const scores = calculateScores(data);

    expect(scores.seo).toBeGreaterThanOrEqual(80);
    expect(scores.performance).toBeGreaterThanOrEqual(80);
    expect(scores.accessibility).toBeGreaterThanOrEqual(80);
    expect(scores.conversion).toBeGreaterThanOrEqual(80);
    expect(scores.google_visibility).toBe(100);
    expect(scores.gbp_readiness).toBe(100);
    expect(scores.meta_marketing).toBe(100);
    expect(scores.social_sharing).toBe(100);
    expect(scores.overall).toBeGreaterThanOrEqual(80);
  });

  it("calculates GBP score according to exact rule weights", () => {
    const data = makeScoringData();
    const scores = calculateScores(data);
    expect(scores.gbp_readiness).toBe(100);
  });

  it("correctly weights overall score with all 9 categories", () => {
    const data = makeScoringData();
    const scores = calculateScores(data);

    const expected = Math.round(
      scores.seo * 0.20 +
      scores.performance * 0.15 +
      scores.accessibility * 0.10 +
      scores.conversion * 0.15 +
      scores.automation * 0.15 +
      scores.google_visibility * 0.10 +
      scores.gbp_readiness * 0.05 +
      scores.meta_marketing * 0.05 +
      scores.social_sharing * 0.05
    );

    expect(scores.overall).toBe(expected);
  });
});
