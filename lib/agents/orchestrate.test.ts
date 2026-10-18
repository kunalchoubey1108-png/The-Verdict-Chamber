import { describe, expect, it, vi } from "vitest";
import { runJury } from "./orchestrate";
import type { EvidencePack } from "@/lib/types/evidence";

describe("runJury cancellation", () => {
  it("returns without starting jury work when the client is already disconnected", async () => {
    const controller = new AbortController();
    controller.abort(new Error("client disconnected"));
    const onEvent = vi.fn();

    await expect(runJury({} as EvidencePack, onEvent, controller.signal)).resolves.toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });
});
