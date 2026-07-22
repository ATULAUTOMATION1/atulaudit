// =============================================================================
// GET /api/audits/[id] — Poll audit status and get report data
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuditJobByToken } from "@/lib/services/audit-job";
import { getReportByJobId } from "@/lib/services/audit-report";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { AuditStatusResponse } from "@/lib/audit/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing report token." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        status: "completed",
        error_message: null,
        submitted_url: "https://example.com",
        normalized_url: "https://example.com",
        final_url: "https://example.com",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        has_lead: false,
        report: null,
      } satisfies AuditStatusResponse);
    }

    const job = await getAuditJobByToken(jobId, token);
    if (!job) {
      return NextResponse.json(
        { error: "Audit not found or invalid token." },
        { status: 404 }
      );
    }

    const response: AuditStatusResponse = {
      status: job.status,
      error_message: job.error_message,
      submitted_url: job.submitted_url,
      normalized_url: job.normalized_url,
      final_url: job.final_url,
      created_at: job.created_at,
      completed_at: job.completed_at,
      has_lead: !!job.lead_email,
      report: null,
    };

    if (job.status === "completed") {
      const report = await getReportByJobId(job.id);
      if (report) {
        response.report = {
          scores: {
            overall: report.overall_score ?? report.report_json.scores?.overall ?? 0,
            seo: report.seo_score ?? report.report_json.scores?.seo ?? 0,
            performance: report.performance_score ?? report.report_json.scores?.performance ?? 0,
            accessibility: report.accessibility_score ?? report.report_json.scores?.accessibility ?? 0,
            conversion: report.conversion_score ?? report.report_json.scores?.conversion ?? 0,
            automation: report.automation_score ?? report.report_json.scores?.automation ?? 0,
            google_visibility: report.google_visibility_score ?? report.report_json.scores?.google_visibility ?? 0,
            gbp_readiness: report.gbp_readiness_score ?? report.report_json.scores?.gbp_readiness ?? 0,
            meta_marketing: report.meta_marketing_score ?? report.report_json.scores?.meta_marketing ?? 0,
            social_sharing: report.social_sharing_score ?? report.report_json.scores?.social_sharing ?? 0,
          },
          data: report.report_json,
        };
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[api/audits/[id]] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit status." },
      { status: 500 }
    );
  }
}
