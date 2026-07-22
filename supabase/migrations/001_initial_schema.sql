-- AtulAudit Database Schema
-- Run this migration against your Supabase project via SQL Editor or CLI.

-- ============================================================
-- 1. AUDIT JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  final_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  error_message TEXT,

  -- Report access token (non-guessable, used for public report URLs)
  report_token UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Lead capture fields (populated after form submission)
  lead_name TEXT,
  lead_email TEXT,
  lead_company TEXT,
  lead_phone TEXT,
  lead_consent BOOLEAN DEFAULT FALSE,
  lead_submitted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups (public report access)
CREATE INDEX IF NOT EXISTS idx_audit_jobs_report_token ON audit_jobs (report_token);

-- Index for status-based queries (job processing)
CREATE INDEX IF NOT EXISTS idx_audit_jobs_status ON audit_jobs (status);

-- Index for domain-based lookups (rate limiting, caching)
CREATE INDEX IF NOT EXISTS idx_audit_jobs_normalized_url ON audit_jobs (normalized_url);

-- ============================================================
-- 2. AUDIT REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,

  overall_score INTEGER,
  seo_score INTEGER,
  performance_score INTEGER,
  accessibility_score INTEGER,
  conversion_score INTEGER,
  automation_score INTEGER,
  google_visibility_score INTEGER,
  gbp_readiness_score INTEGER,
  meta_marketing_score INTEGER,
  social_sharing_score INTEGER,

  -- Full report payload: all findings, analyses, metadata
  report_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One report per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_reports_job_id ON audit_reports (audit_job_id);

-- ============================================================
-- 3. AUDIT ISSUES
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_report_id UUID NOT NULL REFERENCES audit_reports(id) ON DELETE CASCADE,

  category TEXT NOT NULL
    CHECK (category IN ('seo', 'performance', 'accessibility', 'conversion', 'automation', 'health', 'google', 'google_business_profile', 'local_seo', 'meta', 'social')),
  severity TEXT NOT NULL
    CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  finding TEXT NOT NULL,
  business_impact TEXT NOT NULL,
  recommended_fix TEXT NOT NULL,
  effort TEXT NOT NULL
    CHECK (effort IN ('easy', 'moderate', 'advanced')),
  can_help BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups by report
CREATE INDEX IF NOT EXISTS idx_audit_issues_report_id ON audit_issues (audit_report_id);

-- Sorted listing
CREATE INDEX IF NOT EXISTS idx_audit_issues_sort ON audit_issues (audit_report_id, sort_order);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE audit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_issues ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- audit_jobs policies
-- --------------------------------------------------------

-- Service role has full access (used by API routes)
CREATE POLICY "Service role full access on audit_jobs"
  ON audit_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon users can read ONLY their specific job via report_token.
CREATE POLICY "Anon read own audit job by token"
  ON audit_jobs
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND report_token = COALESCE(
      current_setting('request.headers', true)::json->>'x-report-token',
      '00000000-0000-0000-0000-000000000000'
    )::uuid
  );

-- --------------------------------------------------------
-- audit_reports policies
-- --------------------------------------------------------

CREATE POLICY "Service role full access on audit_reports"
  ON audit_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon users can read a report only if they have the matching
-- report_token for the parent audit_job.
CREATE POLICY "Anon read report by job token"
  ON audit_reports
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND EXISTS (
      SELECT 1 FROM audit_jobs aj
      WHERE aj.id = audit_reports.audit_job_id
      AND aj.report_token = COALESCE(
        current_setting('request.headers', true)::json->>'x-report-token',
        '00000000-0000-0000-0000-000000000000'
      )::uuid
    )
  );

-- --------------------------------------------------------
-- audit_issues policies
-- --------------------------------------------------------

CREATE POLICY "Service role full access on audit_issues"
  ON audit_issues
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Anon read issues by job token"
  ON audit_issues
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND EXISTS (
      SELECT 1 FROM audit_reports ar
      JOIN audit_jobs aj ON aj.id = ar.audit_job_id
      WHERE ar.id = audit_issues.audit_report_id
      AND aj.report_token = COALESCE(
        current_setting('request.headers', true)::json->>'x-report-token',
        '00000000-0000-0000-0000-000000000000'
      )::uuid
    )
  );

-- ============================================================
-- 5. HELPER FUNCTION: Secure report access
-- ============================================================

CREATE OR REPLACE FUNCTION get_report_by_token(p_job_id UUID, p_token UUID)
RETURNS TABLE (
  job_id UUID,
  submitted_url TEXT,
  normalized_url TEXT,
  final_url TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  report_id UUID,
  overall_score INTEGER,
  seo_score INTEGER,
  performance_score INTEGER,
  accessibility_score INTEGER,
  conversion_score INTEGER,
  automation_score INTEGER,
  google_visibility_score INTEGER,
  gbp_readiness_score INTEGER,
  meta_marketing_score INTEGER,
  social_sharing_score INTEGER,
  report_json JSONB,
  has_lead BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aj.id AS job_id,
    aj.submitted_url,
    aj.normalized_url,
    aj.final_url,
    aj.status,
    aj.error_message,
    aj.created_at,
    aj.completed_at,
    ar.id AS report_id,
    ar.overall_score,
    ar.seo_score,
    ar.performance_score,
    ar.accessibility_score,
    ar.conversion_score,
    ar.automation_score,
    ar.google_visibility_score,
    ar.gbp_readiness_score,
    ar.meta_marketing_score,
    ar.social_sharing_score,
    ar.report_json,
    (aj.lead_email IS NOT NULL) AS has_lead
  FROM audit_jobs aj
  LEFT JOIN audit_reports ar ON ar.audit_job_id = aj.id
  WHERE aj.id = p_job_id
    AND aj.report_token = p_token;
END;
$$;

-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_jobs_updated_at
  BEFORE UPDATE ON audit_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
