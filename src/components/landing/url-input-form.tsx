"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UrlInputForm({ id = "audit-form" }: { id?: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a website URL.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start audit. Please try again.");
        setLoading(false);
        return;
      }

      // Navigate to audit page with token
      router.push(`/audit/${data.jobId}?token=${data.reportToken}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-3"
      noValidate
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            placeholder="https://yourwebsite.com"
            className="h-12 pl-10 text-base"
            disabled={loading}
            aria-label="Website URL to audit"
            aria-describedby={error ? "url-error" : undefined}
            autoComplete="url"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6 text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              Analyze website
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <p id="url-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Public websites only. Typically ready in under 2 minutes. By submitting,
        you confirm you are authorized to audit this website.
      </p>
    </form>
  );
}
