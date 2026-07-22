// =============================================================================
// Audit Job Service
// =============================================================================
// CRUD operations for audit_jobs table. Server-side only (uses admin client).
// =============================================================================

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { AuditJob, AuditStatus } from "@/lib/audit/types";

/**
 * Create a new audit job.
 */
export async function createAuditJob(
  submittedUrl: string,
  normalizedUrl: string
): Promise<AuditJob> {
  if (!isSupabaseConfigured()) {
    // Development fallback: return a mock job
    return {
      id: crypto.randomUUID(),
      submitted_url: submittedUrl,
      normalized_url: normalizedUrl,
      final_url: null,
      status: "queued",
      error_message: null,
      report_token: crypto.randomUUID(),
      lead_name: null,
      lead_email: null,
      lead_company: null,
      lead_phone: null,
      lead_consent: false,
      lead_submitted_at: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("audit_jobs")
    .insert({
      submitted_url: submittedUrl,
      normalized_url: normalizedUrl,
      status: "queued",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create audit job: ${error.message}`);
  return data as AuditJob;
}

/**
 * Get an audit job by ID with token validation.
 */
export async function getAuditJobByToken(
  jobId: string,
  reportToken: string
): Promise<AuditJob | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("audit_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("report_token", reportToken)
    .single();

  if (error || !data) return null;
  return data as AuditJob;
}

/**
 * Get an audit job by ID (server-side only, no token required).
 */
export async function getJobById(jobId: string): Promise<AuditJob | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("audit_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) return null;
  return data as AuditJob;
}

/**
 * Update job status.
 */
export async function updateJobStatus(
  jobId: string,
  status: AuditStatus,
  extra: Partial<Pick<AuditJob, "final_url" | "error_message" | "completed_at">> = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("audit_jobs")
    .update({ status, ...extra })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to update job status: ${error.message}`);
}

/**
 * Update job with lead contact details.
 */
export async function updateJobWithLead(
  jobId: string,
  lead: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    consent: boolean;
  }
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("audit_jobs")
    .update({
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || null,
      lead_phone: lead.phone || null,
      lead_consent: lead.consent,
      lead_submitted_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to save lead data: ${error.message}`);
}
