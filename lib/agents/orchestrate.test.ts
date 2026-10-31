import { afterEach, describe, expect, it, vi } from "vitest";
import { runJury } from "./orchestrate";
import { buildEvidence, type DecisionEvidence } from "@/lib/decision/evidence";
import type { JuryEvent } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";

describe("runJury cancellation", () => {
  it("returns without starting jury work when the client is already disconnected", async () => {
    const controller = new AbortController();
    controller.abort(new Error("client disconnected"));
    const onEvent = vi.fn();

    await expect(
      runJury({} as MoneyDecision, {} as DecisionEvidence, onEvent, controller.signal)
    ).resolves.toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });
});

describe("runJury when live Gemini calls fail", () => {
  const decision: MoneyDecision = {
    id: "d-1",
    createdAt: "2026-10-25T00:00:00.000Z",
    title: "Ergonomic keyboard",
    merchant: "KeyWorks",
    category: "hardware",
    amount: 129,
    billing: "one_time",
    reason: "Wrist pain",
    monthlyBudget: 800,
    subscriptions: [],
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.doUnmock("ai");
    vi.doUnmock("@ai-sdk/google");
  });

  /** Load runJury in live mode with the AI SDK replaced by fakes; the judge call always fails. */
  async function liveJury(counselParts: unknown[]) {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key"); // read at module load
    vi.doMock("@ai-sdk/google", () => ({ google: () => ({}) }));
    vi.doMock("ai", () => ({
      streamText: () => ({ fullStream: (async function* () { yield* counselParts; })() }),
      generateObject: () => Promise.reject(new Error("schema validation failed")),
    }));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    return (await import("./orchestrate")).runJury;
  }

  async function collect(jury: typeof runJury) {
    vi.useFakeTimers();
    const events: JuryEvent[] = [];
    let done = false;
    const result = jury(decision, buildEvidence(decision), (e) => events.push(e)).finally(() => (done = true));
    while (!done) await vi.advanceTimersByTimeAsync(1_000);
    return { verdict: await result, events };
  }

  const doneFlags = (events: JuryEvent[]) =>
    Object.fromEntries(events.filter((e) => e.type === "agent_done").map((e) => [e.agent, e.simulated]));

  it("falls back and labels every agent when the counsel stream reports an error", async () => {
    const jury = await liveJury([{ type: "error", error: new Error("429 quota exceeded") }]);
    const { verdict, events } = await collect(jury);

    expect(events.filter((e) => e.type === "verdict")).toHaveLength(1);
    expect(verdict).toMatchObject({ outcome: "PROCEED", approvedAmount: 129 });
    expect(doneFlags(events)).toEqual({ bull: true, bear: true, risk: true, quant: true, judge: true });
  });

  it("treats an empty counsel response as a failure", async () => {
    const jury = await liveJury([{ type: "finish" }]);
    const { events } = await collect(jury);

    expect(doneFlags(events).bull).toBe(true);
  });

  it("labels only the judge when just the judge fails, and sends its flag before the verdict", async () => {
    const jury = await liveJury([{ type: "text-delta", textDelta: "A real argument." }]);
    const { events } = await collect(jury);

    expect(doneFlags(events)).toEqual({ bull: false, bear: false, risk: false, quant: false, judge: true });
    const judgeDone = events.findIndex((e) => e.type === "agent_done" && e.agent === "judge");
    const verdictAt = events.findIndex((e) => e.type === "verdict");
    expect(judgeDone).toBeGreaterThan(-1);
    expect(judgeDone).toBeLessThan(verdictAt);
  });
});
