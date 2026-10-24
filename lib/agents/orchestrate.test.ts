import { describe, expect, it, vi } from "vitest";
import { runJury } from "./orchestrate";
import type { DecisionEvidence } from "@/lib/decision/evidence";
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
