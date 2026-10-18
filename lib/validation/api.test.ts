import { describe, expect, it } from "vitest";
import { evidenceRequestSchema, juryRequestSchema } from "./api";

const validThesis = {
  id: "review-123",
  createdAt: "2026-10-16T00:00:00.000Z",
  instrument: {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    exchange: "NSE",
    finnhubSymbol: "NSE:RELIANCE",
    assetClass: "equity",
    sector: "Energy",
  },
  positionSize: 25_000,
  direction: "LONG",
  horizon: "swing",
};

describe("API request schemas", () => {
  it("accepts a valid thesis for evidence assembly", () => {
    expect(evidenceRequestSchema.safeParse(validThesis).success).toBe(true);
  });

  it("rejects malformed allocation values", () => {
    expect(evidenceRequestSchema.safeParse({ ...validThesis, positionSize: -10 }).success).toBe(false);
    expect(evidenceRequestSchema.safeParse({ ...validThesis, positionSize: Number.NaN }).success).toBe(false);
  });

  it("requires a thesis for jury deliberation instead of client-authored market evidence", () => {
    expect(juryRequestSchema.safeParse({ thesis: validThesis }).success).toBe(true);
    expect(juryRequestSchema.safeParse({ evidencePack: { thesis: validThesis } }).success).toBe(false);
  });

  it("caps imported portfolio snapshot size", () => {
    const holding = {
      symbol: "ABC", name: "ABC Ltd", assetClass: "equity", qty: 1, ltp: 10, avgPrice: 9,
    };
    const oversized = Array.from({ length: 201 }, () => holding);

    expect(evidenceRequestSchema.safeParse({ ...validThesis, portfolioSnapshot: oversized }).success).toBe(false);
  });
});
