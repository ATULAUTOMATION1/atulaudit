// =============================================================================
// GET /api/audits/[id]/pdf — PDF/Print redirect
// =============================================================================
// TODO: Implement server-side PDF generation using Puppeteer or Playwright
// in a separate worker/service. Vercel serverless functions have limited
// binary support, so a dedicated PDF generation service is recommended.
//
// For MVP, this endpoint redirects to the print-friendly report page.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const token = request.nextUrl.searchParams.get("token") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Redirect to print-friendly page
  return NextResponse.redirect(
    `${appUrl}/audit/${jobId}/print?token=${token}`
  );
}
