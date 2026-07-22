// =============================================================================
// POST /api/audits/[id]/lead — Submit lead capture form
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/lib/validation/lead";
import { getJobById, updateJobWithLead } from "@/lib/services/audit-job";
import { getReportByJobId } from "@/lib/services/audit-report";
import { appendToGoogleSheets } from "@/lib/services/google-sheets";
import { sendWhatsAppConfirmation } from "@/lib/services/whatsapp";
import { sendAuditEmails } from "@/lib/email/resend";
import { sendLeadWebhook } from "@/lib/services/webhook";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { extractDomain } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validation = leadFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Please check your form inputs.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Lead captured (development mode).",
      });
    }

    // Verify job exists
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Audit not found." },
        { status: 404 }
      );
    }

    // Save lead data to Supabase database
    await updateJobWithLead(jobId, {
      name: validation.data.name,
      email: validation.data.email,
      company: validation.data.company,
      phone: validation.data.phone,
      consent: validation.data.consent,
    });

    // Get report data
    const report = await getReportByJobId(jobId);
    const domain = extractDomain(job.final_url || job.normalized_url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const reportUrl = `${appUrl}/audit/${jobId}?token=${job.report_token}`;
    const timestamp = new Date().toISOString();
    const overallScore = report?.overall_score ?? report?.report_json?.scores?.overall ?? 0;

    const topIssues = report?.report_json?.issues
      ?.filter((i: { severity: string }) => i.severity === "high")
      ?.slice(0, 5)
      ?.map((i: { title: string; severity: string; category: string }) => ({
        title: i.title,
        severity: i.severity,
        category: i.category,
      })) || [];

    // Trigger direct integrations in parallel (non-blocking)
    Promise.allSettled([
      // 1. Direct Google Sheets Append
      appendToGoogleSheets({
        auditId: jobId,
        domain,
        overallScore,
        seoScore: report?.seo_score ?? report?.report_json?.scores?.seo ?? 0,
        performanceScore: report?.performance_score ?? report?.report_json?.scores?.performance ?? 0,
        accessibilityScore: report?.accessibility_score ?? report?.report_json?.scores?.accessibility ?? 0,
        conversionScore: report?.conversion_score ?? report?.report_json?.scores?.conversion ?? 0,
        automationScore: report?.automation_score ?? report?.report_json?.scores?.automation ?? 0,
        lead: {
          name: validation.data.name,
          email: validation.data.email,
          company: validation.data.company,
          phone: validation.data.phone,
        },
        reportUrl,
        timestamp,
      }),

      // 2. Direct Resend Email Confirmation & Team Alert
      sendAuditEmails({
        to: validation.data.email,
        name: validation.data.name,
        domain,
        overallScore,
        reportUrl,
        topIssues,
      }),

      // 3. Direct WhatsApp Confirmation Message
      ...(validation.data.phone
        ? [
            sendWhatsAppConfirmation({
              phone: validation.data.phone,
              name: validation.data.name,
              domain,
              overallScore,
              reportUrl,
            }),
          ]
        : []),

      // 4. Optional n8n Webhook
      sendLeadWebhook({
        auditId: jobId,
        domain,
        overallScore,
        topIssues,
        lead: {
          name: validation.data.name,
          email: validation.data.email,
          company: validation.data.company,
          phone: validation.data.phone,
          consent: validation.data.consent,
        },
        reportUrl,
        timestamp,
      }),
    ]).catch((err) => {
      console.error("[api/lead] Error executing lead dispatch tasks:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your full report is now unlocked.",
    });
  } catch (err) {
    console.error("[api/audits/[id]/lead] Error:", err);
    return NextResponse.json(
      { error: "Failed to save contact details. Please try again." },
      { status: 500 }
    );
  }
}
