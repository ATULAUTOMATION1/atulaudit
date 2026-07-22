// =============================================================================
// AtulAudit — Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Job & Report
// ---------------------------------------------------------------------------

export type AuditStatus = "queued" | "running" | "completed" | "failed";
export type IssueSeverity = "high" | "medium" | "low";
export type IssueEffort = "easy" | "moderate" | "advanced";
export type IssueCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "conversion"
  | "automation"
  | "health"
  | "google"
  | "google_business_profile"
  | "local_seo"
  | "meta"
  | "social";

export interface AuditJob {
  id: string;
  submitted_url: string;
  normalized_url: string;
  final_url: string | null;
  status: AuditStatus;
  error_message: string | null;
  report_token: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_company: string | null;
  lead_phone: string | null;
  lead_consent: boolean;
  lead_submitted_at: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface AuditReport {
  id: string;
  audit_job_id: string;
  overall_score: number | null;
  seo_score: number | null;
  performance_score: number | null;
  accessibility_score: number | null;
  conversion_score: number | null;
  automation_score: number | null;
  google_visibility_score?: number | null;
  gbp_readiness_score?: number | null;
  meta_marketing_score?: number | null;
  social_sharing_score?: number | null;
  report_json: ReportData;
  created_at: string;
}

export interface AuditIssue {
  id: string;
  audit_report_id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  finding: string;
  business_impact: string;
  recommended_fix: string;
  effort: IssueEffort;
  can_help: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Report Data (stored in report_json JSONB column)
// ---------------------------------------------------------------------------

export interface ReportData {
  meta: ReportMeta;
  health: HealthAnalysis;
  seo: SeoAnalysis;
  pagespeed: PageSpeedResults;
  conversion: ConversionAnalysis;
  automation: AutomationAnalysis;
  googleMeta: GoogleMetaAnalysis;
  scores: AuditScores;
  summary: ExecutiveSummary;
  strengths: AuditFinding[];
  priorities: AuditFinding[];
  issues: AuditIssueSerialized[];
  automationRecommendations: AutomationRecommendation[];
}

export interface ReportMeta {
  audited_at: string;
  domain: string;
  final_url: string;
  html_size_bytes: number;
  response_time_ms: number;
}

export interface ExecutiveSummary {
  headline: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Health Analysis
// ---------------------------------------------------------------------------

export interface HealthAnalysis {
  final_url: string;
  http_status: number;
  https_enabled: boolean;
  redirect_count: number;
  response_time_ms: number;
  html_size_bytes: number;
  language_attribute: string | null;
  viewport_meta: boolean;
  favicon_present: boolean;
}

// ---------------------------------------------------------------------------
// SEO Analysis
// ---------------------------------------------------------------------------

export interface SeoAnalysis {
  robots_txt_reachable: boolean;
  sitemap_xml_reachable: boolean;
  canonical_tag: string | null;
  robots_meta: string | null;
  title: string | null;
  title_length: number;
  meta_description: string | null;
  meta_description_length: number;
  og_title: string | null;
  og_description: string | null;
  h1_count: number;
  h2_count: number;
  structured_data_count: number;
  structured_data_types: string[];
  word_count: number;
  internal_link_count: number;
  external_link_count: number;
  broken_href_count: number;
  image_count: number;
  images_missing_alt: number;
  has_noindex: boolean;
  indexing_risks: string[];
}

// ---------------------------------------------------------------------------
// PageSpeed / Lighthouse
// ---------------------------------------------------------------------------

export interface PageSpeedResults {
  mobile: PageSpeedData | null;
  desktop: PageSpeedData | null;
  api_configured: boolean;
}

export interface PageSpeedData {
  performance_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  inp_ms: number | null;
  ttfb_ms: number | null;
  tbt_ms: number | null;
  speed_index_ms: number | null;
  actionable_audits: ActionableAudit[];
}

export interface ActionableAudit {
  id: string;
  title: string;
  description: string;
  display_value: string | null;
  score: number | null;
}

// ---------------------------------------------------------------------------
// Conversion Analysis
// ---------------------------------------------------------------------------

export interface ConversionAnalysis {
  has_form: boolean;
  has_contact_form: boolean;
  has_phone_link: boolean;
  has_email_link: boolean;
  has_whatsapp_link: boolean;
  has_booking_link: boolean;
  has_chat_widget: boolean;
  has_testimonials: boolean;
  has_social_profiles: boolean;
  has_clear_cta: boolean;
  has_pricing_link: boolean;
  has_trust_signals: boolean;
  has_multiple_ctas: boolean;
  detected_chat_providers: string[];
  detected_booking_providers: string[];
  detected_social_platforms: string[];
  cta_texts: string[];
  phone_numbers: string[];
  email_addresses: string[];
}

// ---------------------------------------------------------------------------
// Automation Analysis
// ---------------------------------------------------------------------------

export interface AutomationAnalysis {
  gaps: AutomationGap[];
  readiness_score: number;
}

export interface AutomationGap {
  key: string;
  label: string;
  present: boolean;
  weight: number;
}

export interface AutomationRecommendation {
  title: string;
  description: string;
  business_impact: string;
  effort: IssueEffort;
  category: string;
}

// ---------------------------------------------------------------------------
// Google & Meta Presence Analysis (NEW)
// ---------------------------------------------------------------------------

export interface GoogleMetaAnalysis {
  googleVisibility: GoogleVisibilityData;
  gbpAndLocal: GbpLocalData;
  metaMarketing: MetaMarketingData;
  socialSharing: SocialSharingData;
}

export interface GoogleVisibilityData {
  ga4_detected: boolean;
  ga4_id_masked: string | null;
  gtm_detected: boolean;
  gtm_id_masked: string | null;
  google_ads_detected: boolean;
  google_ads_id_masked: string | null;
  search_console_verified: boolean;
  google_maps_embed: boolean;
  google_maps_link: boolean;
  gbp_link: boolean;
  has_ads_txt: boolean | null;
  detected_schemas: string[];
  has_privacy_policy: boolean;
  has_terms_of_service: boolean;
  has_cookie_banner: boolean;
}

export interface GbpLocalData {
  gbp_link_present: boolean;
  local_business_schema_complete: boolean;
  business_name: string | null;
  business_address: string | null;
  phone_present: boolean;
  click_to_call_present: boolean;
  email_present: boolean;
  opening_hours_present: boolean;
  contact_page_present: boolean;
  service_area_keywords_present: boolean;
  reviews_or_social_proof_present: boolean;
  same_as_links: string[];
  nap_consistency: {
    consistent: boolean;
    details: string[];
  };
}

export interface MetaMarketingData {
  pixel_detected: boolean;
  pixel_id_masked: string | null;
  domain_verified: boolean;
  facebook_page_link: boolean;
  instagram_profile_link: boolean;
  whatsapp_link: boolean;
  capi_status: "Not detected on public website" | "Requires account connection to verify";
}

export interface SocialSharingData {
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_url: string | null;
  og_type: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface AuditScores {
  overall: number;
  seo: number;
  performance: number;
  accessibility: number;
  conversion: number;
  automation: number;
  google_visibility: number;
  gbp_readiness: number;
  meta_marketing: number;
  social_sharing: number;
}

// ---------------------------------------------------------------------------
// Findings (for strengths & priorities)
// ---------------------------------------------------------------------------

export interface AuditFinding {
  title: string;
  description: string;
  category: IssueCategory;
}

// ---------------------------------------------------------------------------
// Serialized issue (stored in report_json)
// ---------------------------------------------------------------------------

export interface AuditIssueSerialized {
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  finding: string;
  business_impact: string;
  recommended_fix: string;
  effort: IssueEffort;
  can_help: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

export interface CreateAuditResponse {
  jobId: string;
  reportToken: string;
}

export interface AuditStatusResponse {
  status: AuditStatus;
  error_message: string | null;
  submitted_url: string;
  normalized_url: string;
  final_url: string | null;
  created_at: string;
  completed_at: string | null;
  has_lead: boolean;
  report: {
    scores: AuditScores;
    data: ReportData;
  } | null;
}

export interface LeadSubmitResponse {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Safe Fetch
// ---------------------------------------------------------------------------

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  html: string;
  finalUrl: string;
  redirectCount: number;
  responseTimeMs: number;
  contentLength: number;
  headers: Record<string, string>;
  error?: string;
}
