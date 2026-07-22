// =============================================================================
// Audit Report Service
// =============================================================================

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { AuditReport, AuditIssueSerialized, ReportData, AuditScores } from "@/lib/audit/types";

/**
 * Create an audit report with scores and full data.
 */
export async function createAuditReport(
  auditJobId: string,
  scores: AuditScores,
  reportData: ReportData
): Promise<AuditReport> {
  if (!isSupabaseConfigured()) {
    return {
      id: crypto.randomUUID(),
      audit_job_id: auditJobId,
      overall_score: scores.overall,
      seo_score: scores.seo,
      performance_score: scores.performance,
      accessibility_score: scores.accessibility,
      conversion_score: scores.conversion,
      automation_score: scores.automation,
      google_visibility_score: scores.google_visibility,
      gbp_readiness_score: scores.gbp_readiness,
      meta_marketing_score: scores.meta_marketing,
      social_sharing_score: scores.social_sharing,
      report_json: reportData,
      created_at: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("audit_reports")
    .insert({
      audit_job_id: auditJobId,
      overall_score: scores.overall,
      seo_score: scores.seo,
      performance_score: scores.performance,
      accessibility_score: scores.accessibility,
      conversion_score: scores.conversion,
      automation_score: scores.automation,
      google_visibility_score: scores.google_visibility,
      gbp_readiness_score: scores.gbp_readiness,
      meta_marketing_score: scores.meta_marketing,
      social_sharing_score: scores.social_sharing,
      report_json: reportData,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create audit report: ${error.message}`);
  return data as AuditReport;
}

/**
 * Create audit issues in bulk.
 */
export async function createAuditIssues(
  auditReportId: string,
  issues: AuditIssueSerialized[]
): Promise<void> {
  if (!isSupabaseConfigured() || issues.length === 0) return;

  const supabase = getSupabaseAdmin();
  const rows = issues.map((issue, index) => ({
    audit_report_id: auditReportId,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    finding: issue.finding,
    business_impact: issue.business_impact,
    recommended_fix: issue.recommended_fix,
    effort: issue.effort,
    can_help: issue.can_help,
    sort_order: issue.sort_order ?? index,
  }));

  const { error } = await supabase.from("audit_issues").insert(rows);
  if (error) throw new Error(`Failed to create audit issues: ${error.message}`);
}

/**
 * Get the report for an audit job.
 */
export async function getReportByJobId(
  auditJobId: string
): Promise<AuditReport | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("audit_reports")
    .select("*")
    .eq("audit_job_id", auditJobId)
    .single();

  if (error || !data) return null;
  return data as AuditReport;
}
