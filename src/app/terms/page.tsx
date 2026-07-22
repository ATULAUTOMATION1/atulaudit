import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for AtulAudit website audit tool.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-bold text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: July 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Service description
              </h2>
              <p className="mt-2">
                AtulAudit is a free website audit tool provided by
                AtulAutomation. It analyzes publicly accessible web pages for
                SEO, performance, accessibility, conversion, and automation
                readiness.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Authorization to audit
              </h2>
              <p className="mt-2">
                By submitting a URL for audit, you confirm that you are
                authorized to request an analysis of the submitted website. You
                should only audit websites that you own, manage, or have
                explicit permission to analyze.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Acceptable use
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Only submit publicly accessible website URLs</li>
                <li>Do not use the service for automated or bulk scanning</li>
                <li>Do not attempt to circumvent rate limits or security measures</li>
                <li>Do not submit URLs to internal networks, localhost, or private infrastructure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Accuracy disclaimer
              </h2>
              <p className="mt-2">
                Audit results are generated automatically using heuristic
                analysis and third-party APIs (such as Google PageSpeed
                Insights). Scores and findings are indicative and should not be
                treated as definitive assessments. We recommend consulting with
                a professional for critical decisions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Limitation of liability
              </h2>
              <p className="mt-2">
                AtulAudit and AtulAutomation are provided &quot;as is&quot;
                without warranties of any kind. We are not responsible for any
                damages arising from the use of audit results, including but not
                limited to business decisions based on scores or
                recommendations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Contact
              </h2>
              <p className="mt-2">
                For questions about these terms, contact AtulAutomation at{" "}
                <a
                  href="https://atulautomation.com"
                  className="text-primary underline underline-offset-2"
                >
                  atulautomation.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
