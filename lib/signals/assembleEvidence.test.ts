import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assembleEvidence } from "./assembleEvidence";
import { fetchQuote } from "./fetchQuote";
import { POPULAR_INSTRUMENTS, type TradeThesis } from "@/lib/types/thesis";
import type { InstrumentQuote } from "@/lib/types/evidence";

vi.mock("./fetchQuote", () => ({ fetchQuote: vi.fn() }));

const instrument = POPULAR_INSTRUMENTS.find((item) => item.symbol === "TCS")!;
const quote: InstrumentQuote = {
  symbol: instrument.symbol, name: instrument.name, ltp: 100, prevClose: 99,
  changePct: 1.01, open: 99, high: 101, low: 98, week52High: 0, week52Low: 0,
  volume: 0, avgVolume10d: 0, asOf: "2026-10-16T00:00:00.000Z", isLive: false,
};
const thesis: TradeThesis = {
  id: "thesis-1", createdAt: "2026-10-16T00:00:00.000Z", instrument,
  positionSize: 10_000, direction: "LONG", horizon: "swing",
};

describe("assembleEvidence", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.stubEnv("FINNHUB_API_KEY", "");
    vi.mocked(fetchQuote).mockResolvedValue(quote);
  });

  it("derives trade levels and marks unavailable market data", async () => {
    const pack = await assembleEvidence(thesis);

    expect(pack.thesis.entryPrice).toBe(100);
    expect(pack.thesis.target).toBe(108);
    expect(pack.thesis.stopLoss).toBe(96);
    expect(pack.riskRewardRatio).toBe(2);
    expect(pack.warnings.join(" ")).toContain("not a current market quote");
    expect(pack.warnings.join(" ")).toContain("Volume data is unavailable");
    expect(pack.signals.rsi).toBeUndefined();
  });

  it("rejects instruments outside the supported catalogue", async () => {
    const unsupported = {
      ...thesis,
      instrument: { ...instrument, symbol: "FAKE", finnhubSymbol: "NSE:FAKE" },
    };

    await expect(assembleEvidence(unsupported)).rejects.toThrow("Unsupported instrument");
    expect(fetchQuote).not.toHaveBeenCalled();
  });
});
