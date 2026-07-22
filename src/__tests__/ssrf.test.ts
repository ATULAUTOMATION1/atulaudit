import { describe, it, expect } from "vitest";
import {
  isPrivateIPv4,
  isPrivateIPv6,
  validateUrlForFetch,
} from "@/lib/security/ssrf";

describe("isPrivateIPv4", () => {
  it("blocks loopback 127.0.0.1", () => {
    expect(isPrivateIPv4("127.0.0.1")).toBe(true);
  });

  it("blocks loopback 127.255.255.255", () => {
    expect(isPrivateIPv4("127.255.255.255")).toBe(true);
  });

  it("blocks 10.x.x.x", () => {
    expect(isPrivateIPv4("10.0.0.1")).toBe(true);
    expect(isPrivateIPv4("10.255.255.255")).toBe(true);
  });

  it("blocks 172.16-31.x.x", () => {
    expect(isPrivateIPv4("172.16.0.1")).toBe(true);
    expect(isPrivateIPv4("172.31.255.255")).toBe(true);
  });

  it("allows 172.32.x.x", () => {
    expect(isPrivateIPv4("172.32.0.1")).toBe(false);
  });

  it("blocks 192.168.x.x", () => {
    expect(isPrivateIPv4("192.168.0.1")).toBe(true);
    expect(isPrivateIPv4("192.168.255.255")).toBe(true);
  });

  it("blocks link-local 169.254.x.x", () => {
    expect(isPrivateIPv4("169.254.0.1")).toBe(true);
    expect(isPrivateIPv4("169.254.169.254")).toBe(true); // AWS metadata
  });

  it("blocks 0.0.0.0", () => {
    expect(isPrivateIPv4("0.0.0.0")).toBe(true);
  });

  it("blocks multicast 224-239.x.x.x", () => {
    expect(isPrivateIPv4("224.0.0.1")).toBe(true);
    expect(isPrivateIPv4("239.255.255.255")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateIPv4("8.8.8.8")).toBe(false);
    expect(isPrivateIPv4("1.1.1.1")).toBe(false);
    expect(isPrivateIPv4("93.184.216.34")).toBe(false);
  });

  it("treats invalid IPs as private (safe default)", () => {
    expect(isPrivateIPv4("not.an.ip")).toBe(true);
    expect(isPrivateIPv4("256.0.0.1")).toBe(true);
  });
});

describe("isPrivateIPv6", () => {
  it("blocks ::1 loopback", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
  });

  it("blocks :: unspecified", () => {
    expect(isPrivateIPv6("::")).toBe(true);
  });

  it("blocks link-local fe80::", () => {
    expect(isPrivateIPv6("fe80::1")).toBe(true);
  });

  it("blocks unique local fc00::", () => {
    expect(isPrivateIPv6("fc00::1")).toBe(true);
    expect(isPrivateIPv6("fd00::1")).toBe(true);
  });

  it("blocks IPv4-mapped private IPv6", () => {
    expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIPv6("::ffff:192.168.1.1")).toBe(true);
  });

  it("allows IPv4-mapped public IPv6", () => {
    expect(isPrivateIPv6("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("validateUrlForFetch", () => {
  it("rejects non-http protocols", () => {
    expect(validateUrlForFetch("ftp://example.com")).not.toBeNull();
    expect(validateUrlForFetch("file:///etc/passwd")).not.toBeNull();
  });

  it("rejects localhost", () => {
    expect(validateUrlForFetch("http://localhost")).not.toBeNull();
    expect(validateUrlForFetch("http://localhost:3000")).not.toBeNull();
  });

  it("rejects private IP literals", () => {
    expect(validateUrlForFetch("http://127.0.0.1")).not.toBeNull();
    expect(validateUrlForFetch("http://192.168.1.1")).not.toBeNull();
    expect(validateUrlForFetch("http://10.0.0.1")).not.toBeNull();
  });

  it("rejects metadata endpoint", () => {
    expect(validateUrlForFetch("http://metadata.google.internal")).not.toBeNull();
  });

  it("allows valid public URLs", () => {
    expect(validateUrlForFetch("https://example.com")).toBeNull();
    expect(validateUrlForFetch("https://www.google.com")).toBeNull();
    expect(validateUrlForFetch("http://example.com")).toBeNull();
  });

  it("rejects non-standard ports", () => {
    expect(validateUrlForFetch("http://example.com:6379")).not.toBeNull();
    expect(validateUrlForFetch("http://example.com:22")).not.toBeNull();
  });

  it("allows common web ports", () => {
    expect(validateUrlForFetch("http://example.com:8080")).toBeNull();
    expect(validateUrlForFetch("https://example.com:8443")).toBeNull();
  });
});
