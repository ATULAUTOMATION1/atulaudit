// =============================================================================
// AtulAudit — Brand & Application Constants
// =============================================================================

export const BRAND = {
  name: "AtulAudit",
  company: "AtulAutomation",
  companyUrl: "https://atulautomation.com",
  tagline: "Find what is holding your website back.",
  description:
    "Get a practical website audit covering SEO, speed, accessibility, conversion, and automation opportunities.",
} as const;

// Design tokens (must match tailwind.config.ts)
export const COLORS = {
  teal: {
    DEFAULT: "#0D7377",
    dark: "#0A5C5F",
    light: "#10918F",
    50: "#E6F5F5",
  },
  surface: {
    light: "#FAFAF8",
    dark: "#111111",
  },
  text: {
    primary: "#1A1A1A",
    muted: "#6B6B6B",
    inverse: "#FAFAF8",
  },
} as const;

// Score labels
export const SCORE_LABELS = {
  STRONG: { min: 80, max: 100, label: "Strong", color: "text-emerald-600" },
  NEEDS_IMPROVEMENT: {
    min: 60,
    max: 79,
    label: "Needs improvement",
    color: "text-amber-600",
  },
  SIGNIFICANT_GAPS: {
    min: 40,
    max: 59,
    label: "Significant gaps",
    color: "text-orange-600",
  },
  PRIORITY_ACTION: {
    min: 0,
    max: 39,
    label: "Priority action needed",
    color: "text-red-600",
  },
} as const;

export function getScoreLabel(score: number) {
  if (score >= 80) return SCORE_LABELS.STRONG;
  if (score >= 60) return SCORE_LABELS.NEEDS_IMPROVEMENT;
  if (score >= 40) return SCORE_LABELS.SIGNIFICANT_GAPS;
  return SCORE_LABELS.PRIORITY_ACTION;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#059669"; // emerald-600
  if (score >= 60) return "#D97706"; // amber-600
  if (score >= 40) return "#EA580C"; // orange-600
  return "#DC2626"; // red-600
}

// Audit progress steps
export const AUDIT_STEPS = [
  "Checking website availability",
  "Reviewing SEO foundations",
  "Measuring mobile performance",
  "Measuring desktop performance",
  "Finding conversion opportunities",
  "Preparing your report",
] as const;

// Feature categories shown on landing page
export const AUDIT_CATEGORIES = [
  { key: "seo", label: "SEO", description: "Technical SEO and crawlability" },
  {
    key: "speed",
    label: "Speed",
    description: "Performance and Core Web Vitals",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    description: "WCAG and usability checks",
  },
  {
    key: "conversion",
    label: "Conversion",
    description: "Lead capture and trust signals",
  },
  {
    key: "automation",
    label: "Automation",
    description: "AI and workflow opportunities",
  },
] as const;

// Severity levels
export const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

// Rate limiting
export const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
} as const;

// Fetch constraints
export const FETCH_LIMITS = {
  timeoutMs: 15_000,
  maxRedirects: 5,
  maxBodyBytes: 5 * 1024 * 1024, // 5 MB
} as const;
