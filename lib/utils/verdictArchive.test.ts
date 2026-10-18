import { describe, expect, it } from "vitest";
import { createVerdictArchive, VERDICT_ARCHIVE_VERSION } from "./verdictArchive";
import type { FullVerdict } from "@/lib/types/verdict";

const record: FullVerdict = {
  id: "verdict-1",
  thesisId: "thesis-1",
  createdAt: "2026-10-16T00:00:00.000Z",
  deliberation: [],
  verdict: {
    outcome: "WATCH",
    confidence: 55,
    riskScore: 40,
    trapProbability: 20,
    thesisKiller: "Support breaks.",
    riskRewardRatio: 2,
    summary: "Wait for confirmation.",
    keyRisks: [],
  },
  thesisSnapshot: {
    instrument: "Reliance Industries",
    direction: "LONG",
    entryPrice: 100,
    target: 108,
    stopLoss: 96,
  },
};

describe("verdict archive export", () => {
  it("creates a versioned archive containing all provided records", () => {
    const archive = JSON.parse(createVerdictArchive([record], "2026-10-17T00:00:00.000Z"));

    expect(archive).toEqual({
      format: "the-verdict-chamber-archive",
      version: VERDICT_ARCHIVE_VERSION,
      exportedAt: "2026-10-17T00:00:00.000Z",
      records: [record],
    });
  });

  it("exports an empty archive without changing the input records", () => {
    const records: FullVerdict[] = [];
    const archive = JSON.parse(createVerdictArchive(records, "2026-10-17T00:00:00.000Z"));

    expect(archive.records).toEqual([]);
    expect(records).toEqual([]);
  });
});
