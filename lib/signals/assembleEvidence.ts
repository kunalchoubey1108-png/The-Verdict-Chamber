import type { EvidencePack } from "@/lib/types/evidence";
import type { TradeThesis } from "@/lib/types/thesis";
import { POPULAR_INSTRUMENTS } from "@/lib/types/thesis";
import { computePortfolioImpact } from "@/lib/signals/portfolioImpact";
import { computeSignals } from "@/lib/signals/computeSignals";
import { fetchQuote } from "@/lib/signals/fetchQuote";

/** Build evidence from a validated thesis; all market-derived fields stay server-owned. */
export async function assembleEvidence(rawThesis: TradeThesis): Promise<EvidencePack> {
  const instrument = POPULAR_INSTRUMENTS.find(
    (candidate) => candidate.symbol === rawThesis.instrument.symbol &&
      candidate.finnhubSymbol === rawThesis.instrument.finnhubSymbol
  );
  if (!instrument) throw new Error("Unsupported instrument.");

  const warnings: string[] = [];
  const quote = await fetchQuote(instrument);
  if (!quote.isLive) {
    warnings.push("Using deterministic demo pricing because the live quote feed is unavailable; this is not a current market quote.");
  }
  if (!quote.week52High || !quote.week52Low) {
    warnings.push("52-week high and low are unavailable from the market data feed.");
  }
  if (!quote.volume || !quote.avgVolume10d) {
    warnings.push("Volume data is unavailable from the market data feed.");
  }
  warnings.push("Historical daily prices are unavailable; RSI and moving-average signals are omitted.");

  const direction = rawThesis.direction || "LONG";
  const entryPrice = rawThesis.entryPrice && rawThesis.entryPrice > 0 ? rawThesis.entryPrice : quote.ltp;
  const target = rawThesis.target && rawThesis.target > 0
    ? rawThesis.target
    : Math.round(entryPrice * (direction === "LONG" ? 1.08 : 0.92) * 100) / 100;
  const stopLoss = rawThesis.stopLoss && rawThesis.stopLoss > 0
    ? rawThesis.stopLoss
    : Math.round(entryPrice * (direction === "LONG" ? 0.96 : 1.04) * 100) / 100;

  const thesis: TradeThesis = {
    ...rawThesis,
    instrument,
    entryPrice,
    target,
    stopLoss,
    direction,
    positionSize: rawThesis.positionSize || 50000,
    horizon: rawThesis.horizon || "swing",
    rationale: rawThesis.rationale?.trim() ||
      `Investor planning to allocate ₹${(rawThesis.positionSize || 50000).toLocaleString("en-IN")} into ${instrument.name} (${instrument.symbol}). Seeking jury assessment on stock behaviour, timing wisdom, and expected near-future market state.`,
  };

  let niftyChangePct = 0;
  if (process.env.FINNHUB_API_KEY) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=NSE%3ANIFTY50&token=${process.env.FINNHUB_API_KEY}`,
        { next: { revalidate: 120 }, signal: AbortSignal.timeout(8_000) }
      );
      if (response.ok) {
        const data: { dp?: number } = await response.json();
        if (typeof data.dp === "number" && Number.isFinite(data.dp)) niftyChangePct = data.dp;
        else warnings.push("Nifty 50 feed returned no daily change; regime is shown as flat.");
      } else {
        warnings.push("Nifty 50 feed unavailable; regime is shown as flat.");
      }
    } catch {
      warnings.push("Nifty 50 feed unavailable; regime is shown as flat.");
    }
  } else {
    warnings.push("Nifty 50 feed is not configured; regime is shown as flat.");
  }

  const { signals, regime } = computeSignals(quote, thesis, niftyChangePct);
  const riskRewardRatio = Math.abs(target - entryPrice) / Math.max(0.01, Math.abs(entryPrice - stopLoss));

  return {
    assembledAt: new Date().toISOString(),
    thesis,
    quote,
    signals,
    regime,
    riskRewardRatio,
    stopLossPct: (Math.abs(entryPrice - stopLoss) / entryPrice) * 100,
    targetPct: (Math.abs(target - entryPrice) / entryPrice) * 100,
    portfolioImpact: computePortfolioImpact(thesis),
    warnings,
  };
}
