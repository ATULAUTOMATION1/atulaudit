import {
  Search,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "SEO and Crawlability",
    description:
      "Title tags, meta descriptions, canonical URLs, structured data, robots.txt, sitemap.xml, heading structure, and indexing risk analysis.",
  },
  {
    icon: Gauge,
    title: "Performance and Core Web Vitals",
    description:
      "Lighthouse scores for mobile and desktop, LCP, CLS, INP, FCP, TTFB, and specific recommendations for render-blocking resources, image optimization, and caching.",
  },
  {
    icon: ShieldCheck,
    title: "Conversion and Trust Signals",
    description:
      "Contact forms, phone links, WhatsApp CTAs, booking integrations, chat widgets, testimonials, social proof, pricing pages, and clear call-to-action detection.",
  },
  {
    icon: Zap,
    title: "Automation Opportunities",
    description:
      "Gaps in WhatsApp automation, AI chatbots, lead follow-up workflows, CRM integration, booking automation, and n8n workflow potential — with specific recommendations.",
  },
];

export function FeatureSections() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Comprehensive checks
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything we analyze
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border/50 bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
