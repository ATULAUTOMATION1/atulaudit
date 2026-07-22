import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { BRAND } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="AtulAudit home">
            <Logo />
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline-block">
            Powered by{" "}
            <a
              href={BRAND.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {BRAND.company}
            </a>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#audit-form"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Run free audit
          </a>
        </div>
      </div>
    </header>
  );
}
