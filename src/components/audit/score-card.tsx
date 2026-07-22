import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "./score-ring";
import { getScoreLabel } from "@/lib/scoring/labels";
import type { AuditScores } from "@/lib/audit/types";

interface ScoreCardProps {
  label: string;
  score: number;
  description?: string;
}

export function ScoreCard({ label, score, description }: ScoreCardProps) {
  const scoreLabel = getScoreLabel(score);

  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center py-5 px-3 text-center">
        <ScoreRing score={score} size={72} strokeWidth={5} />
        <h3 className="mt-3 text-xs font-semibold text-foreground leading-tight">{label}</h3>
        <span className={`mt-1 text-[11px] font-medium ${scoreLabel.colorClass}`}>
          {scoreLabel.label}
        </span>
        {description && (
          <p className="mt-1 text-[10px] text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ScoreSection({ scores }: { scores: AuditScores }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Core Website Health</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ScoreCard label="SEO" score={scores.seo} />
        <ScoreCard label="Performance" score={scores.performance} />
        <ScoreCard label="Accessibility" score={scores.accessibility} />
        <ScoreCard label="Conversion" score={scores.conversion} />
        <ScoreCard label="Automation" score={scores.automation} />
      </div>

      <h3 className="text-sm font-semibold text-foreground pt-2">Google & Meta Presence</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Google Visibility" score={scores.google_visibility ?? 0} />
        <ScoreCard label="Google Business Profile" score={scores.gbp_readiness ?? 0} />
        <ScoreCard label="Meta Marketing" score={scores.meta_marketing ?? 0} />
        <ScoreCard label="Social Sharing" score={scores.social_sharing ?? 0} />
      </div>
    </div>
  );
}
