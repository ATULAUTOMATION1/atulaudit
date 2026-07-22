import { Target, TrendingUp, MessageSquare } from "lucide-react";

export function MoreThanSeo() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            More than an SEO checker
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Most audit tools stop at technical errors. AtulAudit goes further —
            it checks whether your website is actually built to capture leads,
            convert visitors, and support automation workflows. We look at the
            full picture, from crawlability to conversion to AI-readiness.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Find conversion gaps
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Detect missing contact forms, WhatsApp links, booking widgets,
              and trust signals that cost you leads every day.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Actionable priorities
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every issue includes what we found, why it matters for your
              business, and a clear recommended fix with effort level.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Automation opportunities
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover where AI chatbots, WhatsApp agents, automated
              follow-ups, and workflow tools can save you time and close more
              deals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
