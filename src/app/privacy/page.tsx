import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for AtulAudit website audit tool.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: July 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                What we collect
              </h2>
              <p className="mt-2">
                When you use AtulAudit, we collect the website URL you submit
                for analysis. If you choose to unlock the full report, we also
                collect the contact details you provide: name, email address,
                company name, and phone number.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                How we use your data
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>To generate your website audit report</li>
                <li>To contact you about the audit results and our services (only with your consent)</li>
                <li>To improve our audit tool and service offerings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Data storage
              </h2>
              <p className="mt-2">
                Audit data and contact information are stored securely in our
                database. We do not sell your personal information to third
                parties. Website audit data (URLs, HTML content) is processed
                server-side and not stored beyond what is needed for the report.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Third-party services
              </h2>
              <p className="mt-2">
                We use Google PageSpeed Insights API to measure website
                performance. When you submit a URL, it is sent to Google for
                analysis. Please refer to Google&apos;s privacy policy for their
                data handling practices.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Your rights
              </h2>
              <p className="mt-2">
                You can request deletion of your audit data and contact
                information by emailing us. We will process deletion requests
                within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                Contact
              </h2>
              <p className="mt-2">
                For privacy-related inquiries, contact AtulAutomation at{" "}
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
