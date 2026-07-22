"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AUDIT_STEPS } from "@/lib/constants";

export function AuditProgress() {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Simulate step progression based on elapsed time
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < AUDIT_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 8000); // Move to next step every 8 seconds

    const timeInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-8 text-center">
      <div>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Analyzing your website
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes 30–90 seconds. Please keep this tab open.
        </p>
      </div>

      <div className="space-y-3 text-left">
        {AUDIT_STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-foreground font-medium"
                  : isComplete
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <div className="h-4 w-4 shrink-0 rounded-full border border-border" />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {elapsed}s elapsed
      </p>
    </div>
  );
}
