import { Suspense } from "react";
import type { Metadata } from "next";
import AuditReportClient from "@/components/audit/audit-report-client";

export const metadata: Metadata = {
  title: "Audit Report",
  description: "Your website audit report from AtulAudit.",
  robots: { index: false, follow: false },
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuditReportClient jobId={id} />
    </Suspense>
  );
}
