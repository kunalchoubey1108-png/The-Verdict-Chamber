import { describe, expect, it } from "vitest";
import { classifyRegime } from "./classifyRegime";
import { computeSignals } from "./computeSignals";
import type { InstrumentQuote } from "@/lib/types/evidence";
import type { TradeThesis } from "@/lib/types/thesis";

describe("classifyRegime", () => {
  it.each([
    [-2.6, "risk-off"],
    [-2.5, "trending-down"],
    [-1.1, "trending-down"],
    [-1, "ranging"],
    [1, "ranging"],
    [1.1, "trending-up"],
  ] as const)("maps a %s%% index move to %s", (move, expected) => {
    expect(classifyRegime(move).label).toBe(expected);
  });
});

describe("computeSignals", () => {
  const thesis = {
    instrument: { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", finnhubSymbol: "NSE:RELIANCE", assetClass: "equity", sector: "Energy" },
    positionSize: 10_000,
    direction: "LONG",
    entryPrice: 100,
    target: 108,
    stopLoss: 96,
    horizon: "swing",
  } as TradeThesis;

  const quote: InstrumentQuote = {
    symbol: "RELIANCE", name: "Reliance Industries", ltp: 100, prevClose: 99,
    changePct: 1.01, open: 99, high: 101, low: 98, week52High: 0, week52Low: 0,
    volume: 0, avgVolume10d: 0, asOf: "2026-10-16T00:00:00.000Z", isLive: false,
  };

  it("omits indicators that require unavailable historical price data", () => {
    const { signals } = computeSignals(quote, thesis, 0);

    expect(signals.rsi).toBeUndefined();
    expect(signals.smaTrend).toBeUndefined();
    expect(signals.momentum.summary).toContain("unavailable");
    expect(signals.volumeAnomaly.summary).toContain("unavailable");
    expect(signals.trapScore.summary).toBe("Insufficient data.");
  });

  it("computes a momentum signal from a valid 52-week range", () => {
    const { signals } = computeSignals({ ...quote, week52High: 120, week52Low: 80 }, thesis, 0);

    expect(signals.momentum.value).toBe(0);
    expect(signals.momentum.summary).toContain("mid-range");
  });
});
