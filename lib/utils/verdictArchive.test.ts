import { describe, expect, it } from "vitest";
import { createVerdictArchive, VERDICT_ARCHIVE_VERSION } from "./verdictArchive";
import type { FullVerdict } from "@/lib/types/verdict";

const record: FullVerdict = {
  id: "verdict-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  decision: {
    id: "decision-1",
    createdAt: "2026-10-25T00:00:00.000Z",
    title: "Standing desk",
    merchant: "Desk Co",
    category: "hardware",
    amount: 300,
    billing: "one_time",
    reason: "Back pain",
    monthlyBudget: 1_000,
    subscriptions: [],
  },
  deliberation: [],
  verdict: {
    outcome: "PROCEED",
    confidence: 72,
    riskScore: 15,
    approvedAmount: 300,
    modification: "",
    dealBreaker: "Unused after a month.",
    summary: "Fits the budget.",
    keyRisks: [],
  },
};

describe("verdict archive export", () => {
  it("creates a versioned archive containing all provided records", () => {
    const archive = JSON.parse(createVerdictArchive([record], "2026-10-26T00:00:00.000Z"));

    expect(archive).toEqual({
      format: "verdictpay-archive",
      version: VERDICT_ARCHIVE_VERSION,
      exportedAt: "2026-10-26T00:00:00.000Z",
      records: [record],
    });
  });

  it("exports an empty archive without changing the input records", () => {
    const records: FullVerdict[] = [];
    const archive = JSON.parse(createVerdictArchive(records, "2026-10-26T00:00:00.000Z"));

    expect(archive.records).toEqual([]);
    expect(records).toEqual([]);
  });
});
