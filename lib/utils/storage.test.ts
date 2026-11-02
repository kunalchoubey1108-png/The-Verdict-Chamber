import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDecision, loadVerdict, loadVerdictHistory, saveDecision, saveVerdict } from "./storage";
import type { FullVerdict } from "@/lib/types/verdict";
import { makeDecision, makeVerdictCard } from "@/lib/test/fixtures";

const decision = makeDecision();

const verdict: FullVerdict = {
  id: "verdict-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  decision,
  deliberation: [{ agent: "judge", content: "Review complete.", timestamp: "2026-10-25T00:00:00.000Z", status: "done" }],
  verdict: makeVerdictCard(),
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
    expect(values.has("arbiter.verdict.verdict-1")).toBe(true);
    expect(JSON.parse(values.get("arbiter.history") ?? "[]")).toEqual(["verdict-1"]);
    expect(loadVerdict("verdict-1")).toEqual(verdict);
  });

  it("reports quota failures instead of silently claiming success", () => {
    setupStorage(true);

    expect(saveDecision(decision)).toBe(false);
    expect(saveVerdict(verdict)).toBe(false);
  });

  it("ignores malformed history and verdict records without crashing", () => {
    const values = setupStorage();
    values.set("arbiter.history", JSON.stringify({ unexpected: true }));
    values.set("arbiter.verdict.broken", JSON.stringify({ id: "broken" }));

    expect(loadVerdictHistory()).toEqual([]);
    expect(loadVerdict("broken")).toBeNull();
  });
});
