// ── Formatting utilities ──────────────────────────────────────────────────────
// Shared between server (API routes) and client (React components).

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Format a number as US dollars (e.g. $1,188.00) */
export function fmtUSD(n: number): string {
  return USD.format(n);
}

/** ISO timestamp → readable "Oct 25, 2026, 11:42 PM" */
export function fmtDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
