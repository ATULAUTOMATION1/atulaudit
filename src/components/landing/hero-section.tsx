import { UrlInputForm } from "./url-input-form";
import { Search, Gauge, Eye, Megaphone, Zap } from "lucide-react";

const checks = [
  { icon: Search, label: "SEO" },
  { icon: Gauge, label: "Speed" },
  { icon: Eye, label: "Accessibility" },
  { icon: Megaphone, label: "Conversion" },
  { icon: Zap, label: "Automation" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Subtle gradient accent */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-teal-100 to-transparent blur-3xl dark:from-teal-950/40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find what is holding your website&nbsp;back.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Get a practical website audit covering SEO, speed, accessibility,
            conversion, and automation opportunities.
          </p>
        </div>

        <div className="mx-auto mt-10 flex justify-center">
          <UrlInputForm />
        </div>

        {/* What we check */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What we check
          </span>
          {checks.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
