// =============================================================================
// Scoring Engine — Pure functions for score calculation
// =============================================================================

import type { AuditScores } from "@/lib/audit/types";
import {
  seoRules,
  performanceRules,
  accessibilityRules,
  conversionRules,
  googleVisibilityRules,
  gbpRules,
  metaMarketingRules,
  socialSharingRules,
  type ScoringData,
} from "./rules";

/**
 * Calculate the score for a category by summing all rule evaluations.
 */
function calculateCategoryScore(
  rules: typeof seoRules,
  data: ScoringData
): number {
  const total = rules.reduce((sum, rule) => sum + rule.maxPoints, 0);
  const earned = rules.reduce((sum, rule) => {
    const score = rule.evaluate(data);
    return sum + Math.min(score, rule.maxPoints);
  }, 0);

  return Math.round((earned / total) * 100);
}

/**
 * Calculate all scores from analysis data.
 *
 * Overall = weighted average:
 *   SEO: 20%
 *   Performance: 15%
 *   Accessibility: 10%
 *   Conversion: 15%
 *   Automation: 15%
 *   Google Visibility: 10%
 *   GBP Readiness: 5%
 *   Meta Marketing: 5%
 *   Social Sharing: 5%
 */
export function calculateScores(data: ScoringData): AuditScores {
  const seo = calculateCategoryScore(seoRules, data);
  const performance = calculateCategoryScore(performanceRules, data);
  const accessibility = calculateCategoryScore(accessibilityRules, data);
  const conversion = calculateCategoryScore(conversionRules, data);
  const automation = data.automation.readiness_score;

  const googleVisibility = calculateCategoryScore(googleVisibilityRules, data);
  const gbpReadiness = calculateCategoryScore(gbpRules, data);
  const metaMarketing = calculateCategoryScore(metaMarketingRules, data);
  const socialSharing = calculateCategoryScore(socialSharingRules, data);

  const overall = Math.round(
    seo * 0.20 +
      performance * 0.15 +
      accessibility * 0.10 +
      conversion * 0.15 +
      automation * 0.15 +
      googleVisibility * 0.10 +
      gbpReadiness * 0.05 +
      metaMarketing * 0.05 +
      socialSharing * 0.05
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    seo: Math.min(100, Math.max(0, seo)),
    performance: Math.min(100, Math.max(0, performance)),
    accessibility: Math.min(100, Math.max(0, accessibility)),
    conversion: Math.min(100, Math.max(0, conversion)),
    automation: Math.min(100, Math.max(0, automation)),
    google_visibility: Math.min(100, Math.max(0, googleVisibility)),
    gbp_readiness: Math.min(100, Math.max(0, gbpReadiness)),
    meta_marketing: Math.min(100, Math.max(0, metaMarketing)),
    social_sharing: Math.min(100, Math.max(0, socialSharing)),
  };
}
