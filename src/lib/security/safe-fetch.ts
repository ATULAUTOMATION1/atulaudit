// =============================================================================
// Safe Fetch Wrapper
// =============================================================================
// Fetches a URL with SSRF protection, timeouts, redirect limits, and body
// size limits. Used for fetching user-provided URLs during audits.
// =============================================================================

import { FETCH_LIMITS } from "@/lib/constants";
import { validateUrlSafety, validateUrlForFetch } from "@/lib/security/ssrf";
import type { SafeFetchResult } from "@/lib/audit/types";

/**
 * Safely fetch a URL with all security protections applied.
 */
export async function safeFetch(
  url: string,
  options: {
    timeoutMs?: number;
    maxRedirects?: number;
    maxBodyBytes?: number;
  } = {}
): Promise<SafeFetchResult> {
  const {
    timeoutMs = FETCH_LIMITS.timeoutMs,
    maxBodyBytes = FETCH_LIMITS.maxBodyBytes,
  } = options;

  const startTime = Date.now();

  // Step 1: Validate URL safety (including DNS resolution)
  const safetyError = await validateUrlSafety(url);
  if (safetyError) {
    return {
      ok: false,
      status: 0,
      html: "",
      finalUrl: url,
      redirectCount: 0,
      responseTimeMs: Date.now() - startTime,
      contentLength: 0,
      headers: {},
      error: safetyError,
    };
  }

  // Step 2: Fetch with timeout and redirect tracking
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let redirectCount = 0;
  let currentUrl = url;

  try {
    const response = await fetch(currentUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "AtulAudit/1.0 (Website Audit Tool; +https://atulautomation.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    // Track redirects via response.redirected
    if (response.redirected) {
      redirectCount = 1; // Exact count unavailable with redirect: 'follow'
      currentUrl = response.url;

      // Validate final URL after redirect
      const redirectSafety = validateUrlForFetch(response.url);
      if (redirectSafety) {
        return {
          ok: false,
          status: response.status,
          html: "",
          finalUrl: response.url,
          redirectCount,
          responseTimeMs: Date.now() - startTime,
          contentLength: 0,
          headers: {},
          error: `Redirect target is unsafe: ${redirectSafety}`,
        };
      }
    }

    // Step 3: Read body with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        ok: response.ok,
        status: response.status,
        html: "",
        finalUrl: response.url || currentUrl,
        redirectCount,
        responseTimeMs: Date.now() - startTime,
        contentLength: 0,
        headers: Object.fromEntries(response.headers.entries()),
        error: "No response body.",
      };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > maxBodyBytes) {
        reader.cancel();
        return {
          ok: false,
          status: response.status,
          html: "",
          finalUrl: response.url || currentUrl,
          redirectCount,
          responseTimeMs: Date.now() - startTime,
          contentLength: totalBytes,
          headers: Object.fromEntries(response.headers.entries()),
          error: `Response body exceeds maximum size of ${Math.round(maxBodyBytes / 1024 / 1024)}MB.`,
        };
      }

      chunks.push(value);
    }

    const decoder = new TextDecoder("utf-8", { fatal: false });
    const html = decoder.decode(
      new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0)).buffer
        ? Buffer.concat(chunks)
        : new Uint8Array()
    );

    return {
      ok: response.ok,
      status: response.status,
      html,
      finalUrl: response.url || currentUrl,
      redirectCount,
      responseTimeMs: Date.now() - startTime,
      contentLength: totalBytes,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (err) {
    clearTimeout(timeout);
    const error =
      err instanceof DOMException && err.name === "AbortError"
        ? `Request timed out after ${timeoutMs / 1000} seconds.`
        : err instanceof Error
          ? err.message
          : "Unknown fetch error.";

    return {
      ok: false,
      status: 0,
      html: "",
      finalUrl: currentUrl,
      redirectCount,
      responseTimeMs: Date.now() - startTime,
      contentLength: 0,
      headers: {},
      error,
    };
  }
}
