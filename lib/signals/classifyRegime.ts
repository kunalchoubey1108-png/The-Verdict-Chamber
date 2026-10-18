import type { MarketRegime } from "@/lib/types/evidence";

export function classifyRegime(niftyChangePct: number): MarketRegime {
  if (niftyChangePct > 1.0) {
    return { label: "trending-up", display: "Trending Up", niftyChangePct,
      summary: `Nifty 50 is up ${niftyChangePct.toFixed(2)}% today — broad market tailwind. Favours LONG setups.` };
  }
  if (niftyChangePct < -2.5) {
    return { label: "risk-off", display: "Risk-Off", niftyChangePct,
      summary: `Nifty 50 is down ${Math.abs(niftyChangePct).toFixed(2)}% — risk-off conditions. Avoid aggressive sizing.` };
  }
  if (niftyChangePct < -1.0) {
    return { label: "trending-down", display: "Trending Down", niftyChangePct,
      summary: `Nifty 50 is down ${Math.abs(niftyChangePct).toFixed(2)}% today — broad market headwind. Caution on LONG entries.` };
  }
  return { label: "ranging", display: "Ranging", niftyChangePct,
    summary: `Nifty 50 is flat (${niftyChangePct > 0 ? "+" : ""}${niftyChangePct.toFixed(2)}%) — no clear trend. Require stronger stock-specific catalyst.` };
}
