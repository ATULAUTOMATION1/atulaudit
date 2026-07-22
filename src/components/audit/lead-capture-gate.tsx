"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, type LeadFormData } from "@/lib/validation/lead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";

interface LeadCaptureGateProps {
  jobId: string;
  onUnlocked: () => void;
}

export function LeadCaptureGate({ jobId, onUnlocked }: LeadCaptureGateProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", consent: false },
  });

  const consentValue = watch("consent");

  async function onSubmit(data: LeadFormData) {
    setServerError("");
    try {
      const response = await fetch(`/api/audits/${jobId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        setServerError(result.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      onUnlocked();
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Full report unlocked
          </p>
          <p className="text-xs text-muted-foreground">
            Thank you! Scroll down to see the complete audit details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Unlock the full report
          </h3>
          <p className="text-sm text-muted-foreground">
            Enter your details to see all issues, detailed recommendations, and
            your complete automation opportunity analysis.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              placeholder="Your name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Work email *</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              placeholder="Company name"
              {...register("company")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Phone / WhatsApp</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              {...register("phone")}
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="lead-consent"
            checked={consentValue === true}
            onCheckedChange={(checked) =>
              setValue("consent", checked === true, {
                shouldValidate: true,
              })
            }
            aria-invalid={!!errors.consent}
            className="mt-0.5"
          />
          <Label htmlFor="lead-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I agree to be contacted by AtulAutomation about this audit and
            related services.
          </Label>
        </div>
        {errors.consent && (
          <p className="text-xs text-destructive">{errors.consent.message}</p>
        )}

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting
            </>
          ) : (
            "Unlock full report"
          )}
        </Button>
      </form>
    </div>
  );
}
