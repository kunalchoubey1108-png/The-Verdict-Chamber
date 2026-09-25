// ── Formatting utilities ──────────────────────────────────────────────────────
// Shared between server (API routes) and client (React components).
// Mirrors the fmt/pct helpers in the legacy NiveshOS app.js.

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const INR2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as ₹ in Indian numbering (e.g. ₹12,45,300) */
export function fmtINR(n: number): string {
  return "₹" + INR.format(Math.round(n));
}

/** Format a number as ₹ with 2 decimal places */
export function fmtINR2(n: number): string {
  return "₹" + INR2.format(n);
}

/** Format signed INR (+₹1,234 or −₹1,234) */
export function fmtSigned(n: number): string {
  return (n >= 0 ? "+₹" : "−₹") + INR.format(Math.abs(Math.round(n)));
}

/** Format a percentage with sign (+2.4% or −1.1%) */
export function fmtPct(n: number, decimals = 2): string {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(decimals) + "%";
}

/** Format a percentage without sign */
export function fmtPctAbs(n: number, decimals = 1): string {
  return n.toFixed(decimals) + "%";
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Format a large number in crores (e.g. 1,23,456 cr) */
export function fmtCrores(n: number): string {
  const cr = n / 1e7;
  if (cr >= 1000) return (cr / 1000).toFixed(1) + "L cr";
  return cr.toFixed(0) + " cr";
}

/** Return "good" | "warn" | "serious" | "critical" class suffix based on value */
export function riskClass(score: number): string {
  if (score >= 75) return "critical";
  if (score >= 50) return "serious";
  if (score >= 25) return "warn";
  return "good";
}

/** Normalise a value from [inMin, inMax] → [outMin, outMax] */
export function normalise(
  v: number,
  inMin: number,
  inMax: number,
  outMin = -100,
  outMax = 100
): number {
  if (inMax === inMin) return 0;
  const ratio = (v - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

/** ISO timestamp → readable "22 Sep 2026, 11:42 PM" */
export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Verdict outcome → colour token name */
export function verdictColor(outcome: string): string {
  if (outcome === "TRADE") return "good";
  if (outcome === "WATCH") return "warn";
  return "critical";
}
