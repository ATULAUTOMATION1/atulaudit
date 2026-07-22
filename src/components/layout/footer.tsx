import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { BRAND } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:justify-between">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              A free website audit tool by{" "}
              <a
                href={BRAND.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {BRAND.company}
              </a>
              . Helping businesses improve their online presence with SEO,
              performance, and automation insights.
            </p>
          </div>

          <nav className="flex gap-8 text-sm" aria-label="Footer navigation">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Legal</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Company</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <a
                    href={BRAND.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    {BRAND.company}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {year} {BRAND.company}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
