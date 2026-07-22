import { Badge } from "@/components/ui/badge";
import type { IssueSeverity } from "@/lib/audit/types";
import { cn } from "@/lib/utils";

const severityConfig: Record<
  IssueSeverity,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  low: {
    label: "Low",
    className:
      "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: IssueSeverity;
  className?: string;
}) {
  const config = severityConfig[severity];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
