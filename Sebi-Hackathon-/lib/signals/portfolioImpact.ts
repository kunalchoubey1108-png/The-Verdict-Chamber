// ── Portfolio Digital Twin — Impact Analysis ──────────────────────────────────
// Applies the proposed trade to a copy of the portfolio and computes the
// incremental risk impact: new concentration, correlated positions, VaR delta.

import type { PortfolioHolding, TradeThesis } from "@/lib/types/thesis";
import type { PortfolioImpact, ConcentrationChange } from "@/lib/types/evidence";
import { clamp } from "@/lib/utils/format";

/** Symbols that are considered correlated to Financials sector */
const FINANCIALS_SYMBOLS = new Set([
  "HDFCBANK", "ICICIBANK", "AXISBANK", "SBIN", "KOTAKBANK",
  "INDUSINDBK", "BANDHANBNK", "FEDERALBNK", "IDFCFIRSTB",
]);

/**
 * Compute the portfolio impact of executing the proposed trade.
 * Returns null if no portfolio snapshot is attached.
 */
export function computePortfolioImpact(
  thesis: TradeThesis
): PortfolioImpact | undefined {
  const holdings = thesis.portfolioSnapshot;
  if (!holdings || holdings.length === 0) return undefined;

  const { instrument, positionSize, direction } = thesis;

  // Current portfolio total value
  const currentTotal = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  if (currentTotal <= 0) return undefined;

  // Proposed new position value (positive for LONG, negative for SHORT)
  const newPositionValue = direction === "LONG" ? positionSize : -positionSize;
  const newTotal = currentTotal + positionSize; // gross exposure increases

  // ── Sector concentration before + after ─────────────────────────────────
  const sectorsBefore: Record<string, number> = {};
  holdings.forEach((h) => {
    const sec = h.sector ?? "Other";
    sectorsBefore[sec] = (sectorsBefore[sec] ?? 0) + h.qty * h.ltp;
  });

  const sectorsAfter: Record<string, number> = { ...sectorsBefore };
  const targetSector = instrument.sector ?? "Other";
  sectorsAfter[targetSector] =
    (sectorsAfter[targetSector] ?? 0) + Math.abs(newPositionValue);

  const sectorConcentration: ConcentrationChange[] = Object.keys(sectorsAfter)
    .map((sec) => {
      const before = ((sectorsBefore[sec] ?? 0) / currentTotal) * 100;
      const after = ((sectorsAfter[sec] ?? 0) / newTotal) * 100;
      return { sector: sec, before, after, delta: after - before };
    })
    .filter((c) => Math.abs(c.delta) > 0.1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // ── Correlation warning ──────────────────────────────────────────────────
  let correlationWarning: string | null = null;
  const existingSectorValue = sectorsBefore[targetSector] ?? 0;
  const existingSectorPct = (existingSectorValue / currentTotal) * 100;

  if (existingSectorPct > 20) {
    correlationWarning = `You already have ${existingSectorPct.toFixed(1)}% in ${targetSector}. This trade increases concentration further.`;
  } else {
    // Check if specific correlated symbols are held
    const correlatedHolding = holdings.find(
      (h) =>
        FINANCIALS_SYMBOLS.has(h.symbol) &&
        FINANCIALS_SYMBOLS.has(instrument.symbol) &&
        h.symbol !== instrument.symbol
    );
    if (correlatedHolding) {
      correlationWarning = `You hold ${correlatedHolding.name} — highly correlated to ${instrument.name} in the same sector.`;
    }
  }

  // ── VaR delta (simplified) ───────────────────────────────────────────────
  // Simplified: new position adds proportional VaR assuming 2% daily vol
  const ASSUMED_DAILY_VOL = 0.02;
  const newPositionPct = (positionSize / newTotal) * 100;
  const varDeltaPct = clamp(
    (positionSize / currentTotal) * ASSUMED_DAILY_VOL * 100 * 2.33, // 99% 1-day VaR
    0,
    10
  );

  // ── Summary text ─────────────────────────────────────────────────────────
  const topSectorAfter = sectorConcentration[0];
  const parts: string[] = [];

  parts.push(
    `The proposed ${direction} of ${instrument.symbol} (₹${positionSize.toLocaleString("en-IN")}) would represent ${newPositionPct.toFixed(1)}% of total portfolio.`
  );

  if (topSectorAfter && Math.abs(topSectorAfter.delta) > 1) {
    parts.push(
      `${topSectorAfter.sector} exposure moves from ${topSectorAfter.before.toFixed(1)}% to ${topSectorAfter.after.toFixed(1)}%.`
    );
  }

  if (correlationWarning) {
    parts.push(correlationWarning);
  }

  parts.push(
    `Estimated VaR contribution: +${varDeltaPct.toFixed(2)}% of portfolio (99% 1-day).`
  );

  return {
    newPositionPct,
    sectorConcentration,
    correlationWarning,
    varDeltaPct,
    summary: parts.join(" "),
  };
}
