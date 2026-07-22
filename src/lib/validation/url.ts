// =============================================================================
// URL Validation
// =============================================================================

import { z } from "zod";

/**
 * Normalize a user-provided URL:
 * - Prepend https:// if no protocol is present
 * - Lowercase the hostname
 * - Remove trailing slash
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();

  // Strip whitespace and common wrapping characters
  url = url.replace(/^["'<>]+|["'<>]+$/g, "");

  // Prepend https:// if no protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // Enforce lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove trailing slash from pathname if it's just "/"
    let normalized = parsed.toString();
    if (parsed.pathname === "/" && !normalized.endsWith("/?")) {
      normalized = normalized.replace(/\/$/, "");
    }

    return normalized;
  } catch {
    // If URL is still invalid after normalization, return as-is
    // Validation will catch it later
    return url;
  }
}

/**
 * Zod schema for audit URL input.
 */
export const urlInputSchema = z.object({
  url: z
    .string()
    .min(1, "Please enter a website URL.")
    .max(2048, "URL is too long.")
    .refine(
      (val) => {
        const normalized = normalizeUrl(val);
        try {
          const parsed = new URL(normalized);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid website URL (e.g., example.com)." }
    ),
});

export type UrlInput = z.infer<typeof urlInputSchema>;
