"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Lock, ExternalLink, Wrench } from "lucide-react";
import type { GoogleMetaAnalysis } from "@/lib/audit/types";
import { BRAND } from "@/lib/constants";

interface SectionGoogleMetaProps {
  data: GoogleMetaAnalysis;
  domain: string;
}

export function SectionGoogleMeta({ data, domain }: SectionGoogleMetaProps) {
  const { googleVisibility, gbpAndLocal, metaMarketing, socialSharing } = data;

  // Items configured vs missing
  const configuredItems: string[] = [];
  const missingItems: string[] = [];

  if (googleVisibility.ga4_detected) {
    configuredItems.push(`GA4 Analytics Tag (${googleVisibility.ga4_id_masked})`);
  } else {
    missingItems.push("Google Analytics 4 (GA4)");
  }

  if (googleVisibility.gtm_detected) {
    configuredItems.push(`Google Tag Manager (${googleVisibility.gtm_id_masked})`);
  } else {
    missingItems.push("Google Tag Manager (GTM)");
  }

  if (googleVisibility.google_ads_detected) {
    configuredItems.push(`Google Ads Tag (${googleVisibility.google_ads_id_masked})`);
  } else {
    missingItems.push("Google Ads Conversion Tag");
  }

  if (metaMarketing.pixel_detected) {
    configuredItems.push(`Meta Pixel (${metaMarketing.pixel_id_masked})`);
  } else {
    missingItems.push("Meta (Facebook) Pixel");
  }

  if (gbpAndLocal.gbp_link_present) {
    configuredItems.push("Google Business Profile / Maps Link");
  } else {
    missingItems.push("Google Business Profile Link");
  }

  if (gbpAndLocal.local_business_schema_complete) {
    configuredItems.push("LocalBusiness Schema Data");
  } else {
    missingItems.push("LocalBusiness Structured Schema");
  }

  if (socialSharing.og_image && socialSharing.og_title) {
    configuredItems.push("Open Graph Social Preview Metadata");
  } else {
    missingItems.push("Open Graph Preview Metadata");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">New Category</Badge>
          <h2 className="text-xl font-bold text-foreground">Google & Meta Presence</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit of public tracking tags, Google Business Profile readiness, Meta marketing setup, and social sharing metadata for {domain}.
        </p>
      </div>

      {/* 1. What is Configured vs Missing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Detected on Public Website ({configuredItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configuredItems.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-foreground">
                {configuredItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No major marketing tags detected publicly.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Not Detected on Public Website ({missingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missingItems.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-foreground">
                {missingItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-700 font-medium">All primary marketing tags detected!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Google Business Profile & Local SEO Checklist */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Google Business Profile & Local SEO Readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <CheckItem label="Google Business Profile Link" present={gbpAndLocal.gbp_link_present} />
            <CheckItem label="LocalBusiness JSON-LD Schema" present={gbpAndLocal.local_business_schema_complete} />
            <CheckItem label="Business Name Detected" present={!!gbpAndLocal.business_name} detail={gbpAndLocal.business_name || undefined} />
            <CheckItem label="Physical Address / Service Area" present={!!gbpAndLocal.business_address} detail={gbpAndLocal.business_address || undefined} />
            <CheckItem label="Phone Number Present" present={gbpAndLocal.phone_present} />
            <CheckItem label="Click-to-Call Link (tel:)" present={gbpAndLocal.click_to_call_present} />
            <CheckItem label="Business Hours Details" present={gbpAndLocal.opening_hours_present} />
            <CheckItem label="Contact Page Link" present={gbpAndLocal.contact_page_present} />
            <CheckItem label="Local Area Keyword Targeting" present={gbpAndLocal.service_area_keywords_present} />
            <CheckItem label="Reviews / Social Proof Links" present={gbpAndLocal.reviews_or_social_proof_present} />
          </div>

          {/* NAP Consistency Evaluation */}
          <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">NAP (Name, Address, Phone) Consistency Check</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {gbpAndLocal.nap_consistency.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 3. Meta Marketing & Social Sharing Checklist */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Meta Marketing & Social Metadata Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckItem label="Meta (Facebook) Pixel" present={metaMarketing.pixel_detected} detail={metaMarketing.pixel_id_masked || undefined} />
            <CheckItem label="Facebook Domain Verification Meta Tag" present={metaMarketing.domain_verified} />
            <CheckItem label="Facebook Page Link" present={metaMarketing.facebook_page_link} />
            <CheckItem label="Instagram Profile Link" present={metaMarketing.instagram_profile_link} />
            <CheckItem label="WhatsApp Contact CTA Link" present={metaMarketing.whatsapp_link} />
            <CheckItem label="Open Graph Image (og:image)" present={!!socialSharing.og_image} />
            <CheckItem label="Open Graph Title & Description" present={!!(socialSharing.og_title && socialSharing.og_description)} />
            <CheckItem label="Twitter/X Summary Card Metadata" present={!!socialSharing.twitter_card} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Account Connection / Verification Section (Coming Soon) */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Deep Account-Level Integrations</h3>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">Coming Soon</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                A public audit verifies code and metadata present on your website. Deep account verification requires authorized OAuth account connection.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/60 bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Google Account Data</span>
                <Badge variant="secondary" className="text-[10px]">Requires Connection</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Unlocks Google Business Profile review analytics, Google Ads conversion tracking validation, Search Console crawl errors, and GA4 goal completion metrics.
              </p>
              <Button size="sm" variant="outline" disabled className="w-full text-xs opacity-75 cursor-not-allowed">
                Connect Google Account (Coming Soon)
              </Button>
            </div>

            <div className="rounded-md border border-border/60 bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Meta Business Data</span>
                <Badge variant="secondary" className="text-[10px]">Requires Connection</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Unlocks Meta Conversions API (CAPI) server-side event verification, Meta Business Manager domain ownership status, and Pixel audience overlap analytics.
              </p>
              <Button size="sm" variant="outline" disabled className="w-full text-xs opacity-75 cursor-not-allowed">
                Connect Meta Account (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Implementation Recommendation from AtulAutomation */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Wrench className="h-4 w-4 text-primary" />
              Need help implementing Google & Meta tags?
            </h4>
            <p className="text-xs text-muted-foreground">
              AtulAutomation can configure your GTM, GA4, Meta Pixel, LocalBusiness schema, and Google Business Profile for optimal lead tracking.
            </p>
          </div>
          <a
            href={`${BRAND.companyUrl}?ref=audit_google_meta&domain=${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ size: "sm" })} shrink-0`}
          >
            Get Implementation Help
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckItem({ label, present, detail }: { label: string; present: boolean; detail?: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-md border p-2.5 ${present ? "border-emerald-200/60 bg-emerald-50/20 dark:border-emerald-900/20" : "border-border/60 bg-card"}`}>
      {present ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {present ? "Detected on public website" : "Not detected on public website"}
          {detail ? ` (${detail})` : ""}
        </p>
      </div>
    </div>
  );
}
