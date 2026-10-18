// ── Finnhub Quote Fetcher ─────────────────────────────────────────────────────
// Fetches real-time NSE/BSE price data from Finnhub.
// Falls back to deterministic mock data if the API key is absent or fails.
// All calls are server-side only (API key is never sent to the browser).

import type { InstrumentQuote } from "@/lib/types/evidence";
import type { InstrumentRef } from "@/lib/types/thesis";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // change %
  h: number;  // high of day
  l: number;  // low of day
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export interface FinnhubMetric {
  metric: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "10DayAverageTradingVolume"?: number;
    marketCapitalization?: number;
  };
}

async function finnhubGet<T>(path: string): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY ?? "";
  if (!apiKey) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}${path}&token=${apiKey}`, {
      next: { revalidate: 60 }, // cache 60s in Next.js data cache
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Fetch a live quote + 52W range from Finnhub */
export async function fetchQuote(
  instrument: InstrumentRef
): Promise<InstrumentQuote> {
  const sym = instrument.finnhubSymbol; // e.g. "NSE:HDFCBANK"

  const [quote, metrics] = await Promise.all([
    finnhubGet<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(sym)}`),
    finnhubGet<FinnhubMetric>(`/stock/metric?symbol=${encodeURIComponent(sym)}&metric=all`),
  ]);

  const now = new Date().toISOString();

  const normalized = normalizeFinnhubQuote(quote, metrics, instrument, now);
  if (!normalized) {
    // Fallback to mock data — still deterministic and coherent
    return buildMockQuote(instrument, now);
  }

  return normalized;
}

export function normalizeFinnhubQuote(
  quote: FinnhubQuote | null,
  metrics: FinnhubMetric | null,
  instrument: InstrumentRef,
  now: string
): InstrumentQuote | null {
  if (!quote || !Number.isFinite(quote.c) || quote.c <= 0) return null;

  const m = metrics?.metric ?? {};
  const prevClose = Number.isFinite(quote.pc) && quote.pc > 0 ? quote.pc : 0;
  const changePct = Number.isFinite(quote.dp)
    ? quote.dp
    : prevClose > 0 ? ((quote.c - prevClose) / prevClose) * 100 : 0;
  const week52High = Number.isFinite(m["52WeekHigh"]) && (m["52WeekHigh"] ?? 0) > 0 ? m["52WeekHigh"]! : 0;
  const week52Low = Number.isFinite(m["52WeekLow"]) && (m["52WeekLow"] ?? 0) > 0 ? m["52WeekLow"]! : 0;
  const hasValid52WeekRange = week52High > week52Low;
  const metricVolume = m["10DayAverageTradingVolume"];
  const averageVolume = Number.isFinite(metricVolume) && (metricVolume ?? 0) > 0
    ? metricVolume! * 1000
    : 0;
  const timestampMs = Number.isFinite(quote.t) && quote.t > 0 ? quote.t * 1000 : 0;
  const asOf = timestampMs > 0 && timestampMs <= 8.64e15
    ? new Date(timestampMs).toISOString()
    : now;

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    ltp: quote.c,
    prevClose,
    changePct,
    open: Number.isFinite(quote.o) && quote.o > 0 ? quote.o : 0,
    high: Number.isFinite(quote.h) && quote.h > 0 ? quote.h : 0,
    low: Number.isFinite(quote.l) && quote.l > 0 ? quote.l : 0,
    week52High: hasValid52WeekRange ? week52High : 0,
    week52Low: hasValid52WeekRange ? week52Low : 0,
    volume: 0, // Finnhub free quote doesn't include volume
    avgVolume10d: averageVolume,
    marketCapCr: Number.isFinite(m.marketCapitalization) && (m.marketCapitalization ?? 0) > 0
      ? m.marketCapitalization! / 1e5 // USD millions → approximate INR crores
      : undefined,
    asOf,
    isLive: true,
  };
}

/** Deterministic mock quote for demo / fallback */
function buildMockQuote(instrument: InstrumentRef, asOf: string): InstrumentQuote {
  // Seed a stable price from the symbol so it's not random on every render
  const seed = instrument.symbol
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = 500 + (seed % 2000); // 500–2500 range
  const changePct = ((seed % 11) - 5) * 0.4; // -2% to +2%
  const ltp = parseFloat((base * (1 + changePct / 100)).toFixed(2));

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    ltp,
    prevClose: base,
    changePct,
    open: base * 0.998,
    high: ltp * 1.01,
    low: ltp * 0.99,
    week52High: 0,
    week52Low: 0,
    volume: 0,
    avgVolume10d: 0,
    asOf,
    isLive: false,
  };
}
