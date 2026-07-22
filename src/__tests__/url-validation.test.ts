import { describe, it, expect } from "vitest";
import { normalizeUrl } from "@/lib/validation/url";

describe("normalizeUrl", () => {
  it("prepends https:// when no protocol is provided", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("preserves existing https://", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("preserves existing http://", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("removes trailing slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com");
  });

  it("preserves paths", () => {
    expect(normalizeUrl("example.com/page")).toBe("https://example.com/page");
  });

  it("lowercases the hostname", () => {
    expect(normalizeUrl("EXAMPLE.COM")).toBe("https://example.com");
  });

  it("handles www prefix", () => {
    expect(normalizeUrl("www.example.com")).toBe("https://www.example.com");
  });

  it("strips wrapping quotes", () => {
    expect(normalizeUrl('"example.com"')).toBe("https://example.com");
  });

  it("strips wrapping angle brackets", () => {
    expect(normalizeUrl("<example.com>")).toBe("https://example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
  });

  it("handles subdomains", () => {
    expect(normalizeUrl("sub.domain.example.com")).toBe(
      "https://sub.domain.example.com"
    );
  });

  it("preserves query parameters", () => {
    const result = normalizeUrl("example.com?foo=bar");
    expect(result).toContain("foo=bar");
  });
});
