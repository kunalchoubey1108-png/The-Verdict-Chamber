import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchQuote, normalizeFinnhubQuote, type FinnhubQuote } from "./fetchQuote";
import { POPULAR_INSTRUMENTS } from "@/lib/types/thesis";

const instrument = POPULAR_INSTRUMENTS.find((item) => item.symbol === "TCS")!;
const fallbackTime = "2026-10-16T00:00:00.000Z";

describe("normalizeFinnhubQuote", () => {
  it("rejects missing or non-positive current prices", () => {
    expect(normalizeFinnhubQuote(null, null, instrument, fallbackTime)).toBeNull();
    const invalidPrice = { c: Number.NaN, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 1, t: 0 } satisfies FinnhubQuote;
    const negativePrice = { ...invalidPrice, c: -1 };
    expect(normalizeFinnhubQuote(invalidPrice, null, instrument, fallbackTime)).toBeNull();
    expect(normalizeFinnhubQuote(negativePrice, null, instrument, fallbackTime)).toBeNull();
  });

  it("falls back safely when optional metrics and quote fields are invalid", () => {
    const normalized = normalizeFinnhubQuote({
      c: 100, d: 1, pc: 99, dp: Number.POSITIVE_INFINITY, o: Number.NaN,
      h: 0, l: -1, t: Number.POSITIVE_INFINITY,
    } satisfies FinnhubQuote, {
      metric: {
        "52WeekHigh": 80,
        "52WeekLow": 90,
        "10DayAverageTradingVolume": Number.NaN,
      },
    }, instrument, fallbackTime);

    expect(normalized).toMatchObject({
      ltp: 100,
      changePct: expect.closeTo(((100 - 99) / 99) * 100, 5),
      open: 0,
      high: 0,
      low: 0,
      week52High: 0,
      week52Low: 0,
      avgVolume10d: 0,
      asOf: fallbackTime,
    });
  });

  it("uses only a valid 52-week range and a bounded source timestamp", () => {
    const normalized = normalizeFinnhubQuote({
      c: 100, d: 0, pc: 100, dp: 0, o: 100, h: 101, l: 99, t: 1_797_465_600,
    } satisfies FinnhubQuote, {
      metric: { "52WeekHigh": 120, "52WeekLow": 80, "10DayAverageTradingVolume": 2 },
    }, instrument, fallbackTime);

    expect(normalized?.week52High).toBe(120);
    expect(normalized?.week52Low).toBe(80);
    expect(normalized?.avgVolume10d).toBe(2_000);
    expect(normalized?.asOf).not.toBe(fallbackTime);
  });
});

describe("fetchQuote failures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("times out upstream requests and degrades to demo data when the feed fails", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
    const fetchMock = vi.fn().mockRejectedValue(new Error("upstream timed out"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchQuote(instrument);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(result.isLive).toBe(false);
  });
});
