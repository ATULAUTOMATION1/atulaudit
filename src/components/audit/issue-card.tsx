import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import type { AuditIssueSerialized } from "@/lib/audit/types";

export function IssueCard({ issue }: { issue: AuditIssueSerialized }) {
  return (
    <Card className="border-border/50">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground leading-snug">
            {issue.title}
          </h4>
          <SeverityBadge severity={issue.severity} className="shrink-0" />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">What we found: </span>
            {issue.finding}
          </div>
          <div>
            <span className="font-medium text-foreground">Why it matters: </span>
            {issue.business_impact}
          </div>
          <div>
            <span className="font-medium text-foreground">Recommended fix: </span>
            {issue.recommended_fix}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="text-xs">
            {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Effort: {issue.effort.charAt(0).toUpperCase() + issue.effort.slice(1)}
          </Badge>
          {issue.can_help && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              <Wrench className="mr-1 h-3 w-3" />
              AtulAutomation can help
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
