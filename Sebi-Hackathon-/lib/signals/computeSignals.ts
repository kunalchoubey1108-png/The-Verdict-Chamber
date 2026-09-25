// ── Multi-Factor Signal Engine ────────────────────────────────────────────────
// Computes 6 market signals from the quote data and the thesis levels.
// All computation is deterministic — no additional API calls needed.
// Returns a SignalSet + market regime classification.

import type { InstrumentQuote, Signal, SignalSet, MarketRegime, SignalDirection, SignalStrength } from "@/lib/types/evidence";
import type { TradeThesis } from "@/lib/types/thesis";
import { clamp, normalise } from "@/lib/utils/format";

// ── Signal helpers ────────────────────────────────────────────────────────────

function direction(value: number, threshold = 20): SignalDirection {
  if (value > threshold) return "bullish";
  if (value < -threshold) return "bearish";
  return "neutral";
}

function strength(value: number): SignalStrength {
  const abs = Math.abs(value);
  if (abs >= 65) return "strong";
  if (abs >= 30) return "moderate";
  return "weak";
}

function makeSignal(
  name: string,
  rawValue: number,
  summary: string
): Signal {
  const value = clamp(rawValue, -100, 100);
  return { name, value, direction: direction(value), strength: strength(value), summary };
}

// ── Individual signals ────────────────────────────────────────────────────────

/** Momentum: where is the current price within its 52W range? */
function momentumSignal(quote: InstrumentQuote): Signal {
  const { ltp, week52High, week52Low } = quote;
  const range = week52High - week52Low;
  if (range <= 0) return makeSignal("Momentum", 0, "52W range unavailable.");

  // Normalise to -100 (at 52W low) → +100 (at 52W high)
  const pctInRange = ((ltp - week52Low) / range) * 100;
  // Shift so middle of range = 0
  const value = normalise(pctInRange, 0, 100, -100, 100);

  const posLabel = pctInRange > 75
    ? "near 52W high"
    : pctInRange < 25
    ? "near 52W low"
    : "mid-range";

  return makeSignal(
    "Momentum",
    value,
    `Price is ${posLabel} (${pctInRange.toFixed(0)}% of 52W range: ₹${week52Low.toFixed(0)}–₹${week52High.toFixed(0)}).`
  );
}

/** Volume anomaly: today's volume vs. 10-day average */
function volumeSignal(quote: InstrumentQuote): Signal {
  const { volume, avgVolume10d, changePct } = quote;

  // If no volume data, return neutral
  if (!volume || !avgVolume10d) {
    return makeSignal("Volume", 0, "Volume data unavailable from feed.");
  }

  const ratio = volume / avgVolume10d; // 1.0 = average
  // High volume on up day = bullish; high volume on down day = bearish
  const dirFactor = changePct >= 0 ? 1 : -1;
  const value = clamp(dirFactor * normalise(ratio, 0.5, 2.5, 0, 100), -100, 100);

  const label = ratio > 2 ? "very high" : ratio > 1.5 ? "elevated" : ratio < 0.5 ? "very low" : "normal";

  return makeSignal(
    "Volume",
    value,
    `Volume is ${label} (${ratio.toFixed(1)}× 10-day average) on a ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% day.`
  );
}

/** Volatility: today's intraday range as % of price */
function volatilitySignal(quote: InstrumentQuote): Signal {
  const { high, low, ltp } = quote;
  if (!high || !low || high <= low) {
    return makeSignal("Volatility", 0, "Intraday range unavailable.");
  }

  const rangePct = ((high - low) / ltp) * 100;
  // High volatility = negative signal (higher risk)
  const value = -clamp(normalise(rangePct, 0.5, 4, 0, 100), 0, 100);

  const label = rangePct > 3 ? "high" : rangePct > 1.5 ? "moderate" : "low";

  return makeSignal(
    "Volatility",
    value,
    `Intraday range is ${rangePct.toFixed(2)}% (${label}) — High ₹${high.toFixed(0)} / Low ₹${low.toFixed(0)}.`
  );
}

/** Risk:Reward — calculated from thesis price levels or estimated baseline */
function riskRewardSignal(thesis: TradeThesis): Signal {
  const direction = thesis.direction || "LONG";
  const entry = thesis.entryPrice || 100;
  const target = thesis.target || (direction === "LONG" ? entry * 1.08 : entry * 0.92);
  const stopLoss = thesis.stopLoss || (direction === "LONG" ? entry * 0.96 : entry * 1.04);

  const reward = direction === "LONG" ? target - entry : entry - target;
  const risk = direction === "LONG" ? entry - stopLoss : stopLoss - entry;

  if (risk <= 0) return makeSignal("Risk:Reward", 20, "Calculated risk-to-reward baseline.");

  const rr = reward / risk;
  // R:R of 3 = +100, 1 = 0, 0 = -100
  const value = clamp(normalise(rr, 0, 3, -100, 100), -100, 100);

  return makeSignal(
    "Risk:Reward",
    value,
    `Asymmetry edge is ${rr.toFixed(2)}:1 (${reward.toFixed(1)} reward / ${risk.toFixed(1)} risk). ${
      rr >= 2 ? "Favourable risk-to-reward." : rr >= 1 ? "Balanced risk." : "Caution on reward asymmetry."
    }`
  );
}

/**
 * Trap Score: detects bull/bear traps.
 * Bull trap: price near 52W high + falling volume + bearish day
 * Bear trap: price near 52W low + rising volume + bullish day
 */
function trapScoreSignal(quote: InstrumentQuote, thesis: TradeThesis): Signal {
  const { ltp, week52High, week52Low, changePct, volume, avgVolume10d } = quote;
  const range = week52High - week52Low;
  if (range <= 0) return makeSignal("Trap Risk", 0, "Insufficient data.");

  const pctInRange = ((ltp - week52Low) / range) * 100;
  const isNearHigh = pctInRange > 80;
  const isNearLow = pctInRange < 20;
  const volumeRatio = avgVolume10d > 0 ? volume / avgVolume10d : 1;
  const fallingVolume = volumeRatio < 0.8;
  const risingVolume = volumeRatio > 1.3;
  const upDay = changePct > 0;

  let trapScore = 0; // positive = trap likely, negative = genuine move

  if (thesis.direction === "LONG") {
    // Bull trap signal: near 52W high, weak volume, bearish day
    if (isNearHigh && fallingVolume && !upDay) trapScore = 70;
    else if (isNearHigh && fallingVolume) trapScore = 40;
    else if (isNearHigh) trapScore = 20;
    else if (isNearLow && risingVolume) trapScore = -60; // strong support
  } else {
    // Bear trap signal: near 52W low, weak volume, bullish day (failed breakdown)
    if (isNearLow && risingVolume && upDay) trapScore = 70;
    else if (isNearLow && fallingVolume) trapScore = 40;
    else if (isNearLow) trapScore = 20;
    else if (isNearHigh && fallingVolume) trapScore = -50; // distribution
  }

  const label = trapScore > 50 ? "high" : trapScore > 25 ? "moderate" : "low";
  const summary = trapScore > 25
    ? `${label.charAt(0).toUpperCase() + label.slice(1)} trap risk: price ${isNearHigh ? "near 52W high" : "near 52W low"} with ${fallingVolume ? "declining" : "low"} volume.`
    : "Trap probability is low based on price position and volume context.";

  // Trap score is a risk signal — higher trap = more negative for the trade
  return makeSignal("Trap Risk", -trapScore, summary);
}

/** News sentiment — placeholder using Finnhub free news endpoint */
function newsSentimentSignal(): Signal {
  // Finnhub news sentiment endpoint is a paid feature on NSE stocks.
  // We return neutral as a documented limitation and surface it as a warning.
  return makeSignal(
    "News Sentiment",
    0,
    "News sentiment not available for this instrument on the free tier."
  );
}

// ── Composite signal ──────────────────────────────────────────────────────────

const WEIGHTS = {
  momentum: 0.25,
  volumeAnomaly: 0.15,
  volatility: 0.10,
  riskReward: 0.30,
  trapScore: 0.15,
  newsSentiment: 0.05,
};

function composite(signals: Omit<SignalSet, "composite">): Signal {
  const weighted =
    signals.momentum.value * WEIGHTS.momentum +
    signals.volumeAnomaly.value * WEIGHTS.volumeAnomaly +
    signals.volatility.value * WEIGHTS.volatility +
    signals.riskReward.value * WEIGHTS.riskReward +
    signals.trapScore.value * WEIGHTS.trapScore +
    signals.newsSentiment.value * WEIGHTS.newsSentiment;

  return makeSignal(
    "Composite",
    weighted,
    `Weighted composite of all signals (momentum ×0.25, R:R ×0.30, trap ×0.15, volume ×0.15, volatility ×0.10, sentiment ×0.05).`
  );
}

// ── Market regime ─────────────────────────────────────────────────────────────

export function classifyRegime(niftyChangePct: number): MarketRegime {
  // Simplified regime based on Nifty's own-day performance.
  // Production version would use 20/50 SMA crossover from candle data.
  if (niftyChangePct > 1.0) {
    return { label: "trending-up", display: "Trending Up", niftyChangePct,
      summary: `Nifty 50 is up ${niftyChangePct.toFixed(2)}% today — broad market tailwind. Favours LONG setups.` };
  }
  if (niftyChangePct < -1.0) {
    return { label: "trending-down", display: "Trending Down", niftyChangePct,
      summary: `Nifty 50 is down ${Math.abs(niftyChangePct).toFixed(2)}% today — broad market headwind. Caution on LONG entries.` };
  }
  if (niftyChangePct < -2.5) {
    return { label: "risk-off", display: "Risk-Off", niftyChangePct,
      summary: `Nifty 50 is down ${Math.abs(niftyChangePct).toFixed(2)}% — risk-off conditions. Avoid aggressive sizing.` };
  }
  return { label: "ranging", display: "Ranging", niftyChangePct,
    summary: `Nifty 50 is flat (${niftyChangePct > 0 ? "+" : ""}${niftyChangePct.toFixed(2)}%) — no clear trend. Require stronger stock-specific catalyst.` };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeSignals(
  quote: InstrumentQuote,
  thesis: TradeThesis,
  niftyChangePct: number
): { signals: SignalSet; regime: MarketRegime } {
  const partial: Omit<SignalSet, "composite"> = {
    momentum: momentumSignal(quote),
    volumeAnomaly: volumeSignal(quote),
    volatility: volatilitySignal(quote),
    riskReward: riskRewardSignal(thesis),
    trapScore: trapScoreSignal(quote, thesis),
    newsSentiment: newsSentimentSignal(),
  };

  const signals: SignalSet = {
    ...partial,
    composite: composite(partial),
  };

  const regime = classifyRegime(niftyChangePct);

  return { signals, regime };
}
