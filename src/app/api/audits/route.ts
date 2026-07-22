// =============================================================================
// POST /api/audits — Create a new audit job
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { urlInputSchema, normalizeUrl } from "@/lib/validation/url";
import { validateUrlSafety } from "@/lib/security/ssrf";
import { checkRateLimit, getClientIP } from "@/lib/security/rate-limit";
import { createAuditJob } from "@/lib/services/audit-job";
import { runAudit } from "@/lib/audit/orchestrator";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(clientIP);
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          error: "Too many audit requests. Please try again later.",
          retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validation = urlInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid URL.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(validation.data.url);

    // SSRF validation
    const safetyError = await validateUrlSafety(normalizedUrl);
    if (safetyError) {
      return NextResponse.json(
        { error: safetyError },
        { status: 400 }
      );
    }

    // Create audit job
    const job = await createAuditJob(validation.data.url, normalizedUrl);

    // Start audit in background (non-blocking)
    // The orchestrator handles its own error handling and status updates.
    runAudit(job.id, normalizedUrl).catch((err) => {
      console.error("[api/audits] Background audit failed:", err);
    });

    return NextResponse.json(
      {
        jobId: job.id,
        reportToken: job.report_token,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/audits] Error creating audit:", err);
    return NextResponse.json(
      { error: "Failed to start audit. Please try again." },
      { status: 500 }
    );
  }
}
