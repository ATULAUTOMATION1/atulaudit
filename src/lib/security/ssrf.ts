// =============================================================================
// SSRF Protection
// =============================================================================
// Validates URLs and resolved IPs to prevent Server-Side Request Forgery.
// Blocks requests to localhost, private networks, link-local, and metadata IPs.
// =============================================================================

import { promises as dns } from "dns";

/**
 * Check if an IPv4 address is in a private/reserved range.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat invalid IPs as private (safe default)
  }

  const [a, b, c, d] = parts;

  // Loopback: 127.0.0.0/8
  if (a === 127) return true;

  // Current network: 0.0.0.0/8
  if (a === 0) return true;

  // Private RFC1918: 10.0.0.0/8
  if (a === 10) return true;

  // Private RFC1918: 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;

  // Private RFC1918: 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // Link-local: 169.254.0.0/16 (includes AWS/GCP/Azure metadata)
  if (a === 169 && b === 254) return true;

  // Broadcast: 255.255.255.255
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  // Multicast: 224.0.0.0/4
  if (a >= 224 && a <= 239) return true;

  // Reserved: 240.0.0.0/4
  if (a >= 240) return true;

  // IETF protocol assignments: 192.0.0.0/24
  if (a === 192 && b === 0 && c === 0) return true;

  // Documentation: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;

  // Benchmarking: 198.18.0.0/15
  if (a === 198 && (b === 18 || b === 19)) return true;

  return false;
}

/**
 * Check if an IPv6 address is private/reserved.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback: ::1
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified: ::
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Link-local: fe80::/10
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80")) return true;

  // Unique local: fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // IPv4-mapped IPv6: ::ffff:x.x.x.x
  const v4MappedMatch = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4MappedMatch) {
    return isPrivateIPv4(v4MappedMatch[1]);
  }

  return false;
}

/**
 * Check if any IP (v4 or v6) is private.
 */
export function isPrivateIP(ip: string): boolean {
  if (ip.includes(":")) {
    return isPrivateIPv6(ip);
  }
  return isPrivateIPv4(ip);
}

/**
 * Validate a URL for safe server-side fetching.
 * Returns an error message if the URL is unsafe, null if safe.
 */
export function validateUrlForFetch(urlString: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return "Invalid URL format.";
  }

  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only HTTP and HTTPS URLs are allowed.";
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (
    hostname === "localhost" ||
    hostname === "localhost." ||
    hostname.endsWith(".localhost")
  ) {
    return "Localhost URLs are not allowed.";
  }

  // Block IP literals directly
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    if (isPrivateIPv4(hostname)) {
      return "Private IP addresses are not allowed.";
    }
  }

  // Block IPv6 literals (enclosed in brackets in URLs)
  if (hostname.startsWith("[") || hostname === "::1") {
    return "IPv6 literal addresses are not allowed for audit.";
  }

  // Block common metadata endpoints
  if (hostname === "metadata.google.internal") {
    return "Cloud metadata endpoints are not allowed.";
  }

  // Block non-standard ports that might indicate internal services
  if (parsed.port) {
    const port = parseInt(parsed.port, 10);
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) {
      return "Non-standard ports are not allowed for website audits.";
    }
  }

  return null;
}

/**
 * Resolve a hostname and validate that it does not point to private IPs.
 * This prevents DNS rebinding attacks.
 */
export async function resolveAndValidate(hostname: string): Promise<string | null> {
  try {
    const addresses = await dns.resolve4(hostname);

    for (const ip of addresses) {
      if (isPrivateIP(ip)) {
        return `DNS resolves to private IP (${ip}). This URL cannot be audited.`;
      }
    }

    return null; // Safe
  } catch {
    // Try IPv6 as fallback
    try {
      const addresses6 = await dns.resolve6(hostname);
      for (const ip of addresses6) {
        if (isPrivateIP(ip)) {
          return `DNS resolves to private IPv6 (${ip}). This URL cannot be audited.`;
        }
      }
      return null;
    } catch {
      return `Could not resolve hostname: ${hostname}. Please check the URL and try again.`;
    }
  }
}

/**
 * Full URL safety validation: parse + check + DNS resolve.
 */
export async function validateUrlSafety(urlString: string): Promise<string | null> {
  const staticError = validateUrlForFetch(urlString);
  if (staticError) return staticError;

  const parsed = new URL(urlString);
  const dnsError = await resolveAndValidate(parsed.hostname);
  return dnsError;
}
