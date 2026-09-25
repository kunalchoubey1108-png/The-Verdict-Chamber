// ── Evidence Pack Types ───────────────────────────────────────────────────────
// The structured market evidence assembled before the jury deliberates.
// Every jury agent receives the same EvidencePack as their context.

import type { TradeThesis } from "./thesis";

// ── Market Quote ─────────────────────────────────────────────────────────────

export interface InstrumentQuote {
  symbol: string;
  name: string;
  /** Current last-traded price */
  ltp: number;
  /** Previous close */
  prevClose: number;
  /** Today's change % */
  changePct: number;
  /** Today's open */
  open: number;
  /** Today's high */
  high: number;
  /** Today's low */
  low: number;
  /** 52-week high */
  week52High: number;
  /** 52-week low */
  week52Low: number;
  /** Today's volume */
  volume: number;
  /** 10-day average volume (for volume anomaly signal) */
  avgVolume10d: number;
  /** Market cap in crores, if available */
  marketCapCr?: number;
  /** Data freshness */
  asOf: string;
  /** true = live from Finnhub; false = fallback mock */
  isLive: boolean;
}

// ── Signal Set ───────────────────────────────────────────────────────────────

export type SignalDirection = "bullish" | "bearish" | "neutral";
export type SignalStrength = "strong" | "moderate" | "weak";

export interface Signal {
  name: string;
  value: number;       // normalised -100 (bearish) to +100 (bullish)
  direction: SignalDirection;
  strength: SignalStrength;
  /** Human-readable summary for the agents */
  summary: string;
}

export interface SignalSet {
  momentum: Signal;
  volumeAnomaly: Signal;
  volatility: Signal;
  riskReward: Signal;
  trapScore: Signal;
  newsSentiment: Signal;
  /** Composite signal — weighted average of all */
  composite: Signal;
}

// ── Market Regime ─────────────────────────────────────────────────────────────

export type RegimeLabel = "trending-up" | "trending-down" | "ranging" | "risk-off";

export interface MarketRegime {
  label: RegimeLabel;
  /** Human label for display */
  display: string;
  /** Supporting summary */
  summary: string;
  /** Nifty 50 change % today */
  niftyChangePct: number;
}

// ── Portfolio Impact ──────────────────────────────────────────────────────────

export interface ConcentrationChange {
  sector: string;
  before: number;  // %
  after: number;   // %
  delta: number;   // pp
}

export interface PortfolioImpact {
  /** New position size as % of total portfolio after trade */
  newPositionPct: number;
  /** Sector concentration after trade */
  sectorConcentration: ConcentrationChange[];
  /** Whether the trade creates a correlated position with an existing holding */
  correlationWarning: string | null;
  /** Estimated VaR increase (as % of portfolio) */
  varDeltaPct: number;
  /** Free-text portfolio impact summary for agents */
  summary: string;
}

// ── Full Evidence Pack ────────────────────────────────────────────────────────

export interface EvidencePack {
  /** ISO timestamp when evidence was assembled */
  assembledAt: string;
  thesis: TradeThesis;
  quote: InstrumentQuote;
  signals: SignalSet;
  regime: MarketRegime;
  /** Computed R:R ratio (positive = favourable) */
  riskRewardRatio: number;
  /** Distance of entry to stop-loss as % */
  stopLossPct: number;
  /** Distance of entry to target as % */
  targetPct: number;
  portfolioImpact?: PortfolioImpact;
  /** Any data-quality warnings to surface to agents */
  warnings: string[];
}
