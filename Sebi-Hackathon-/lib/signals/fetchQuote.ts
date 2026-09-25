// ── Finnhub Quote Fetcher ─────────────────────────────────────────────────────
// Fetches real-time NSE/BSE price data from Finnhub.
// Falls back to deterministic mock data if the API key is absent or fails.
// All calls are server-side only (API key is never sent to the browser).

import type { InstrumentQuote } from "@/lib/types/evidence";
import type { InstrumentRef } from "@/lib/types/thesis";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY ?? "";

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // change %
  h: number;  // high of day
  l: number;  // low of day
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

interface FinnhubMetric {
  metric: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "10DayAverageTradingVolume"?: number;
    marketCapitalization?: number;
  };
}

async function finnhubGet<T>(path: string): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}${path}&token=${API_KEY}`, {
      next: { revalidate: 60 }, // cache 60s in Next.js data cache
    } as any);
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

  if (!quote || !quote.c) {
    // Fallback to mock data — still deterministic and coherent
    return buildMockQuote(instrument, now);
  }

  const m = metrics?.metric ?? {};

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    ltp: quote.c,
    prevClose: quote.pc,
    changePct: quote.dp ?? ((quote.c - quote.pc) / quote.pc) * 100,
    open: quote.o,
    high: quote.h,
    low: quote.l,
    week52High: m["52WeekHigh"] ?? quote.c * 1.25,
    week52Low: m["52WeekLow"] ?? quote.c * 0.75,
    volume: 0, // Finnhub free quote doesn't include volume
    avgVolume10d: m["10DayAverageTradingVolume"]
      ? m["10DayAverageTradingVolume"] * 1000
      : 0,
    marketCapCr: m.marketCapitalization
      ? m.marketCapitalization / 1e5 // USD millions → approximate INR crores
      : undefined,
    asOf: now,
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
    week52High: base * 1.28,
    week52Low: base * 0.72,
    volume: 1_500_000 + seed * 1000,
    avgVolume10d: 1_800_000,
    asOf,
    isLive: false,
  };
}
