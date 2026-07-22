// =============================================================================
// Score Labels
// =============================================================================

export interface ScoreLabel {
  label: string;
  colorClass: string;
  bgClass: string;
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 80) {
    return {
      label: "Strong",
      colorClass: "text-emerald-700 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    };
  }
  if (score >= 60) {
    return {
      label: "Needs improvement",
      colorClass: "text-amber-700 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-950/30",
    };
  }
  if (score >= 40) {
    return {
      label: "Significant gaps",
      colorClass: "text-orange-700 dark:text-orange-400",
      bgClass: "bg-orange-50 dark:bg-orange-950/30",
    };
  }
  return {
    label: "Priority action needed",
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/30",
  };
}
