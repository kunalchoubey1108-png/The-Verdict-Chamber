import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDecision, loadVerdict, loadVerdictHistory, saveDecision, saveVerdict } from "./storage";
import type { FullVerdict } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";

const decision: MoneyDecision = {
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
};

const verdict: FullVerdict = {
  id: "verdict-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  decision,
  deliberation: [{ agent: "judge", content: "Review complete.", timestamp: "2026-10-25T00:00:00.000Z", status: "done" }],
  verdict: {
    outcome: "MODIFY", confidence: 68, riskScore: 40, approvedAmount: 150,
    modification: "Buy the smaller model.", dealBreaker: "Desk is returned.", summary: "Cheaper option.", keyRisks: [],
  },
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
    expect(saveDecision(decision)).toBe(false);
  });

  it("round-trips a decision", () => {
    setupStorage();

    expect(saveDecision(decision)).toBe(true);
    expect(loadDecision("decision-1")).toEqual(decision);
  });

  it("persists verdict and history index", () => {
    const values = setupStorage();

    expect(saveVerdict(verdict)).toBe(true);
    expect(values.has("vp.verdict.verdict-1")).toBe(true);
    expect(JSON.parse(values.get("vp.history") ?? "[]")).toEqual(["verdict-1"]);
    expect(loadVerdict("verdict-1")).toEqual(verdict);
  });

  it("reports quota failures instead of silently claiming success", () => {
    setupStorage(true);

    expect(saveDecision(decision)).toBe(false);
    expect(saveVerdict(verdict)).toBe(false);
  });

  it("ignores malformed history and verdict records without crashing", () => {
    const values = setupStorage();
    values.set("vp.history", JSON.stringify({ unexpected: true }));
    values.set("vp.verdict.broken", JSON.stringify({ id: "broken" }));

    expect(loadVerdictHistory()).toEqual([]);
    expect(loadVerdict("broken")).toBeNull();
  });
});
