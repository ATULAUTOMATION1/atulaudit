import { Globe, Cpu, FileText } from "lucide-react";

const steps = [
  {
    icon: Globe,
    step: "1",
    title: "Enter your URL",
    description:
      "Paste your website URL and hit analyze. We only audit publicly accessible homepages.",
  },
  {
    icon: Cpu,
    step: "2",
    title: "We run the audit",
    description:
      "Our system fetches your page, checks SEO, measures speed via Google Lighthouse, and scans for conversion and automation gaps.",
  },
  {
    icon: FileText,
    step: "3",
    title: "Review your report",
    description:
      "Get a detailed report with scores, strengths, priority fixes, and actionable recommendations written in plain business language.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three simple steps to understand your website&apos;s strengths and
            weaknesses.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">
                Step {item.step}
              </div>
              <h3 className="mt-2 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
