import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { runJury } from "@/lib/agents/orchestrate";
import { verifyApproval } from "@/lib/payments/approval";
import type { JuryEvent, VerdictCard } from "@/lib/types/verdict";

// The jury itself is tested elsewhere; here we test the route's wiring.
vi.mock("@/lib/agents/orchestrate", () => ({ runJury: vi.fn() }));

const decision = {
  id: "decision-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  title: "  Design app  ",
  merchant: "Acme Design Co.",
  category: "software",
  amount: 1_188,
  billing: "yearly",
  reason: "Client work",
  monthlyBudget: 1_500,
  subscriptions: [],
};

const verdict = (overrides: Partial<VerdictCard>): VerdictCard => ({
  outcome: "MODIFY",
  confidence: 68,
  riskScore: 55,
  approvedAmount: 99,
  modification: "Monthly billing",
  dealBreaker: "x",
  summary: "y",
  keyRisks: [],
  ...overrides,
});

function juryEmits(v: VerdictCard) {
  vi.mocked(runJury).mockImplementation(async (_d, _e, onEvent) => {
    onEvent({ type: "agent_start", agent: "judge" });
    onEvent({ type: "verdict", verdict: v });
    onEvent({ type: "agent_done", agent: "judge", simulated: true });
    return v;
  });
}

async function postJury(body: unknown) {
  const res = await POST(
    new NextRequest("http://localhost/api/jury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  const lines = (await res.text()).split("\n\n").filter(Boolean).map((l) => l.replace(/^data: /, ""));
  return { res, lines, events: lines.filter((l) => l !== "[DONE]").map((l) => JSON.parse(l) as JuryEvent) };
}

beforeEach(() => vi.stubEnv("VERDICT_SIGNING_SECRET", "a".repeat(64)));
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/jury", () => {
  it("signs the verdict for the approved amount and the server-parsed decision, then ends with [DONE]", async () => {
    juryEmits(verdict({ outcome: "MODIFY", approvedAmount: 99 }));
    const { res, lines, events } = await postJury({ decision });

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const verdicts = events.filter((e) => e.type === "verdict");
    expect(verdicts).toHaveLength(1);
    expect(verifyApproval(verdicts[0].approvalToken!)).toMatchObject({
      decisionId: "decision-1",
      amount: 99,
      outcome: "MODIFY",
      title: "Design app", // trimmed by the schema: proves the parsed decision was signed, not the raw body
    });
    expect(events.find((e) => e.type === "agent_start")).not.toHaveProperty("approvalToken");
    expect(lines.at(-1)).toBe("[DONE]");
  });

  it("issues no approval for a REJECT verdict", async () => {
    juryEmits(verdict({ outcome: "REJECT", approvedAmount: 0, modification: "" }));
    const { events } = await postJury({ decision });

    expect(events.find((e) => e.type === "verdict")?.approvalToken).toBeNull();
  });

  it("rejects an invalid decision with 400 without starting the jury", async () => {
    const { res } = await postJury({ decision: { ...decision, amount: -5 } });

    expect(res.status).toBe(400);
    expect(runJury).not.toHaveBeenCalled();
  });
});
