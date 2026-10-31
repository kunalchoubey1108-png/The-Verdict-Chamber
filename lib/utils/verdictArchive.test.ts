import { describe, expect, it } from "vitest";
import { createVerdictArchive, VERDICT_ARCHIVE_VERSION } from "./verdictArchive";
import type { FullVerdict } from "@/lib/types/verdict";
import { makeDecision, makeVerdictCard } from "@/lib/test/fixtures";

const record: FullVerdict = {
  id: "verdict-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  decision: makeDecision(),
  deliberation: [],
  verdict: makeVerdictCard(),
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
