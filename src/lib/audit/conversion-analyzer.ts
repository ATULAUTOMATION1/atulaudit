// =============================================================================
// Conversion Analyzer — Detects conversion and trust signals
// =============================================================================
// This module's detection work is done in html-analyzer.ts.
// This file re-exports the type and provides any additional analysis logic.
// =============================================================================

import type { ConversionAnalysis } from "@/lib/audit/types";

/**
 * Summarize conversion readiness from analysis results.
 */
export function summarizeConversion(analysis: ConversionAnalysis): {
  strengths: string[];
  gaps: string[];
} {
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (analysis.has_contact_form) strengths.push("Contact form found on page");
  else if (analysis.has_form) strengths.push("Form element found on page");
  else gaps.push("No lead capture form detected");

  if (analysis.has_phone_link) strengths.push("Clickable phone number available");
  else gaps.push("No clickable phone link (tel:) found");

  if (analysis.has_email_link) strengths.push("Email contact link available");
  else gaps.push("No mailto: email link found");

  if (analysis.has_whatsapp_link) strengths.push("WhatsApp link detected");
  else gaps.push("No WhatsApp click-to-chat link found");

  if (analysis.has_booking_link)
    strengths.push(
      `Booking link detected (${analysis.detected_booking_providers.join(", ")})`
    );
  else gaps.push("No online booking or scheduling link found");

  if (analysis.has_chat_widget)
    strengths.push(
      `Chat widget detected (${analysis.detected_chat_providers.join(", ")})`
    );
  else gaps.push("No live chat or chatbot widget found");

  if (analysis.has_clear_cta) strengths.push("Clear call-to-action text found");
  else gaps.push("No clear call-to-action text detected");

  if (analysis.has_testimonials)
    strengths.push("Testimonials or reviews section found");
  else gaps.push("No testimonials or reviews section detected");

  if (analysis.has_social_profiles)
    strengths.push(
      `Social profiles linked (${analysis.detected_social_platforms.join(", ")})`
    );
  else gaps.push("No social media profile links found");

  if (analysis.has_trust_signals) strengths.push("Trust signals detected (logos, certifications, or case studies)");
  else gaps.push("No trust signals found (client logos, certifications, etc.)");

  if (analysis.has_pricing_link) strengths.push("Pricing page or section found");

  if (analysis.has_multiple_ctas) strengths.push("Multiple CTAs distributed across the page");

  return { strengths, gaps };
}
