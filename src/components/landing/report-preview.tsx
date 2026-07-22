import { Card, CardContent } from "@/components/ui/card";

const exampleScores = [
  { label: "Overall", score: 62, color: "text-amber-600 dark:text-amber-400" },
  { label: "SEO", score: 71, color: "text-amber-600 dark:text-amber-400" },
  { label: "Performance", score: 45, color: "text-orange-600 dark:text-orange-400" },
  { label: "Accessibility", score: 78, color: "text-amber-600 dark:text-amber-400" },
  { label: "Conversion", score: 38, color: "text-red-600 dark:text-red-400" },
  { label: "Automation", score: 25, color: "text-red-600 dark:text-red-400" },
];

export function ReportPreview() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Example report preview
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            A clear picture of your website health
          </h2>
          <p className="mt-3 text-muted-foreground">
            Your report includes scores across every category that matters for
            business growth.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {exampleScores.map((item) => (
            <Card
              key={item.label}
              className="border-border/50 bg-card/60 backdrop-blur-sm"
            >
              <CardContent className="flex flex-col items-center py-5 px-3 text-center">
                <span className={`text-3xl font-bold tabular-nums ${item.color}`}>
                  {item.score}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {item.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground italic">
          Scores shown above are an example, not live data.
        </p>
      </div>
    </section>
  );
}
