"use client";

import { useEffect, useState, useCallback } from "react";
import type { AuditStatusResponse } from "@/lib/audit/types";

export function useAuditPolling(jobId: string, token: string) {
  const [data, setData] = useState<AuditStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/audits/${jobId}?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || "Failed to check audit status.");
        setIsPolling(false);
        return;
      }

      const result: AuditStatusResponse = await response.json();
      setData(result);

      // Stop polling when done
      if (result.status === "completed" || result.status === "failed") {
        setIsPolling(false);
      }
    } catch {
      setError("Network error. Please refresh the page.");
      setIsPolling(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    let isSubscribed = true;

    const runCheck = async () => {
      if (isSubscribed) {
        await fetchStatus();
      }
    };

    runCheck();

    if (!isPolling) return;

    const interval = setInterval(() => {
      runCheck();
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [fetchStatus, isPolling]);

  return { data, error, isPolling, refetch: fetchStatus };
}
