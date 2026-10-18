import { afterEach, describe, expect, it, vi } from "vitest";
import { loadVerdict, loadVerdictHistory, saveThesis, saveVerdict } from "./storage";
import type { TradeThesis } from "@/lib/types/thesis";
import type { FullVerdict } from "@/lib/types/verdict";

const thesis = { id: "review-1" } as TradeThesis;
const verdict: FullVerdict = {
  id: "verdict-1",
  thesisId: "review-1",
  createdAt: "2026-10-16T00:00:00.000Z",
  deliberation: [{ agent: "judge", content: "Review complete.", timestamp: "2026-10-16T00:00:00.000Z", status: "done" }],
  verdict: {
    outcome: "WATCH", confidence: 55, riskScore: 40, trapProbability: 20,
    thesisKiller: "Support breaks.", riskRewardRatio: 2, summary: "Wait for confirmation.", keyRisks: [],
  },
  thesisSnapshot: { instrument: "Reliance Industries", direction: "LONG", entryPrice: 100, target: 108, stopLoss: 96 },
};

function setupStorage(throws = false) {
  const values = new Map<string, string>();
  const store = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (throws) throw new Error("Storage quota exceeded");
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
  };
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", store);
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("local storage persistence", () => {
  it("reports when browser storage is unavailable", () => {
    vi.stubGlobal("window", undefined);
    expect(saveThesis(thesis)).toBe(false);
  });

  it("persists verdict and history index", () => {
    const values = setupStorage();

    expect(saveVerdict(verdict)).toBe(true);
    expect(values.has("vc.verdict.verdict-1")).toBe(true);
    expect(JSON.parse(values.get("vc.history") ?? "[]")).toEqual(["verdict-1"]);
    expect(loadVerdict("verdict-1")).toEqual(verdict);
  });

  it("reports quota failures instead of silently claiming success", () => {
    setupStorage(true);

    expect(saveThesis(thesis)).toBe(false);
    expect(saveVerdict(verdict)).toBe(false);
  });

  it("ignores malformed history and verdict records without crashing", () => {
    const values = setupStorage();
    values.set("vc.history", JSON.stringify({ unexpected: true }));
    values.set("vc.verdict.broken", JSON.stringify({ id: "broken" }));

    expect(loadVerdictHistory()).toEqual([]);
    expect(loadVerdict("broken")).toBeNull();
  });
});
