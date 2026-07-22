/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuditPolling } from "@/hooks/use-audit-polling";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuditProgress } from "@/components/audit/audit-progress";
import { ScoreRing } from "@/components/audit/score-ring";
import { ScoreSection } from "@/components/audit/score-card";
import { IssueCard } from "@/components/audit/issue-card";
import { SectionGoogleMeta } from "@/components/audit/section-google-meta";
import { LeadCaptureGate } from "@/components/audit/lead-capture-gate";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  ExternalLink,
  Zap,
  ArrowRight,
} from "lucide-react";
import { formatDate, extractDomain, getFaviconUrl } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import type { AutomationRecommendation } from "@/lib/audit/types";

export default function AuditReportClient({ jobId }: { jobId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { data, error, isPolling } = useAuditPolling(jobId, token);
  const [unlocked, setUnlocked] = useState(false);

  // Error state
  if (error) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </Button>
        </div>
      </PageShell>
    );
  }

  // Loading / polling state
  if (!data || isPolling || data.status === "queued" || data.status === "running") {
    return (
      <PageShell>
        <div className="py-20">
          <AuditProgress />
        </div>
      </PageShell>
    );
  }

  // Failed state
  if (data.status === "failed") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Audit failed</h2>
          <p className="mt-2 text-muted-foreground">
            {data.error_message || "We could not complete the audit for this website."}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => (window.location.href = "/")}
          >
            Try another website
          </Button>
        </div>
      </PageShell>
    );
  }

  // Completed state — render report
  const report = data.report?.data;
  const scores = data.report?.scores;

  if (!report || !scores) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Report not available</h2>
          <p className="mt-2 text-muted-foreground">
            The audit completed but the report data could not be loaded.
          </p>
        </div>
      </PageShell>
    );
  }

  const domain = extractDomain(data.final_url || data.normalized_url);
  const freeIssues = report.issues?.filter((i) => i.severity === "high").slice(0, 3) || [];
  const allIssues = report.issues || [];
  const showGate = !unlocked && !data.has_lead;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ---- Header ---- */}
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <img
            src={getFaviconUrl(domain)}
            alt=""
            width={48}
            height={48}
            className="rounded-lg border border-border"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{domain}</h1>
            <p className="text-sm text-muted-foreground">
              Audited on {formatDate(data.completed_at || data.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/audit/${jobId}/print?token=${token}`, "_blank")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </Button>
            <a
              href={`${BRAND.companyUrl}?ref=audit&domain=${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm" })}
            >
              Get free implementation plan
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <Separator className="my-8" />

        {/* ---- Overall Score ---- */}
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={scores.overall} size={140} strokeWidth={10} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-foreground">
              {report.summary?.headline || `Overall Score: ${scores.overall}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {report.summary?.body}
            </p>
          </div>
        </div>

        {/* ---- Category Scores ---- */}
        <div className="mt-10">
          <ScoreSection scores={scores} />
        </div>

        {/* ---- What's Working Well ---- */}
        {report.strengths && report.strengths.length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              What&apos;s working well
            </h2>
            <div className="mt-4 grid gap-2">
              {report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md border border-emerald-200/50 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---- Top Priority Fixes (Free) ---- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Top priority fixes
          </h2>
          <div className="mt-4 space-y-3">
            {freeIssues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
            {freeIssues.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No high-priority issues found — great job!
              </p>
            )}
          </div>
        </section>

        {/* ---- Lead Capture Gate ---- */}
        {showGate && (
          <div className="my-10">
            <LeadCaptureGate jobId={jobId} onUnlocked={() => setUnlocked(true)} />
          </div>
        )}

        {/* ---- Full Report (gated) ---- */}
        {(!showGate) && (
          <>
            {/* 1. SEO and Technical Health */}
            {(() => {
              const seoIssues = allIssues.filter((i) => i.category === "seo");
              if (seoIssues.length === 0) return null;
              return (
                <section className="mt-10">
                  <h2 className="text-lg font-semibold text-foreground">SEO and Technical Health</h2>
                  <div className="mt-4 space-y-3">
                    {seoIssues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 2. Google & Meta Presence (NEW SECTION) */}
            {report.googleMeta && (
              <section className="mt-10">
                <SectionGoogleMeta data={report.googleMeta} domain={domain} />
              </section>
            )}

            {/* 3. Page Speed and Core Web Vitals */}
            {report.pagespeed?.api_configured && (report.pagespeed.mobile || report.pagespeed.desktop) && (
              <Card className="mt-10 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Page Speed and Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {report.pagespeed.mobile && (
                      <div className="rounded-md border border-border/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mobile Performance</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: `hsl(${(report.pagespeed.mobile.performance_score || 0) * 1.2}, 70%, 45%)` }}>
                          {report.pagespeed.mobile.performance_score ?? "N/A"}
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {report.pagespeed.mobile.lcp_ms != null && <p>LCP: {(report.pagespeed.mobile.lcp_ms / 1000).toFixed(1)}s</p>}
                          {report.pagespeed.mobile.cls != null && <p>CLS: {report.pagespeed.mobile.cls.toFixed(3)}</p>}
                          {report.pagespeed.mobile.fcp_ms != null && <p>FCP: {(report.pagespeed.mobile.fcp_ms / 1000).toFixed(1)}s</p>}
                          {report.pagespeed.mobile.tbt_ms != null && <p>TBT: {Math.round(report.pagespeed.mobile.tbt_ms)}ms</p>}
                        </div>
                      </div>
                    )}
                    {report.pagespeed.desktop && (
                      <div className="rounded-md border border-border/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Desktop Performance</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: `hsl(${(report.pagespeed.desktop.performance_score || 0) * 1.2}, 70%, 45%)` }}>
                          {report.pagespeed.desktop.performance_score ?? "N/A"}
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {report.pagespeed.desktop.lcp_ms != null && <p>LCP: {(report.pagespeed.desktop.lcp_ms / 1000).toFixed(1)}s</p>}
                          {report.pagespeed.desktop.cls != null && <p>CLS: {report.pagespeed.desktop.cls.toFixed(3)}</p>}
                          {report.pagespeed.desktop.fcp_ms != null && <p>FCP: {(report.pagespeed.desktop.fcp_ms / 1000).toFixed(1)}s</p>}
                          {report.pagespeed.desktop.tbt_ms != null && <p>TBT: {Math.round(report.pagespeed.desktop.tbt_ms)}ms</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Issues */}
            {(() => {
              const perfIssues = allIssues.filter((i) => i.category === "performance");
              if (perfIssues.length === 0) return null;
              return (
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">Performance Opportunities</h3>
                  <div className="mt-3 space-y-3">
                    {perfIssues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 4. Accessibility */}
            {(() => {
              const a11yIssues = allIssues.filter((i) => i.category === "accessibility");
              if (a11yIssues.length === 0) return null;
              return (
                <section className="mt-10">
                  <h2 className="text-lg font-semibold text-foreground">Accessibility</h2>
                  <div className="mt-4 space-y-3">
                    {a11yIssues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 5. Conversion Opportunities */}
            {(() => {
              const convIssues = allIssues.filter((i) => i.category === "conversion");
              if (convIssues.length === 0) return null;
              return (
                <section className="mt-10">
                  <h2 className="text-lg font-semibold text-foreground">Conversion Opportunities</h2>
                  <div className="mt-4 space-y-3">
                    {convIssues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* 6. AI Automation Opportunities */}
            {(() => {
              const autoIssues = allIssues.filter((i) => i.category === "automation");
              if (autoIssues.length === 0) return null;
              return (
                <section className="mt-10">
                  <h2 className="text-lg font-semibold text-foreground">AI Automation Opportunities</h2>
                  <div className="mt-4 space-y-3">
                    {autoIssues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Automation Recommendations */}
            {report.automationRecommendations && report.automationRecommendations.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Zap className="h-5 w-5 text-primary" />
                  Recommended Automation Workflows
                </h2>
                <div className="mt-4 space-y-3">
                  {report.automationRecommendations.map((rec: AutomationRecommendation, i: number) => (
                    <Card key={i} className="border-primary/20 bg-primary/5">
                      <CardContent className="space-y-2 p-5">
                        <h4 className="font-semibold text-foreground">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <p className="text-sm">
                          <span className="font-medium text-foreground">Business impact: </span>
                          <span className="text-muted-foreground">{rec.business_impact}</span>
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Effort: {rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 7. Recommended Next Step */}
            <section className="mt-12 mb-8">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Ready to build your Google & Meta marketing engine?
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Get a free implementation plan from AtulAutomation. We will configure your GTM, GA4, Meta Pixel, GBP listing, and local automation workflows.
                    </p>
                  </div>
                  <a
                    href={`${BRAND.companyUrl}?ref=audit&domain=${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: "lg" })}
                  >
                    Get free plan
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
