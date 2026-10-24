import { describe, expect, it } from "vitest";
import { normalizeVerdict, simulateVerdict, type JudgeOutput } from "./verdict";
import { buildEvidence } from "@/lib/decision/evidence";
import type { MoneyDecision } from "@/lib/validation/decision";

const decision: MoneyDecision = {
  id: "d-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  title: "Design tool annual plan",
  merchant: "Design Co",
  category: "software",
  amount: 1_188,
  billing: "yearly",
  reason: "Client work",
  monthlyBudget: 5_000,
  subscriptions: [],
};

const judge = (overrides: Partial<JudgeOutput>): JudgeOutput => ({
  ruling: "ruling",
  outcome: "PROCEED",
  confidence: 70,
  riskScore: 30,
  approvedAmount: 0,
  modification: "",
  dealBreaker: "x",
  summary: "y",
  keyRisks: [],
  ...overrides,
});

describe("normalizeVerdict money rules", () => {
  it("pays exactly the requested amount on PROCEED, whatever the model said", () => {
    expect(normalizeVerdict(judge({ outcome: "PROCEED", approvedAmount: 5_000 }), decision).approvedAmount).toBe(1_188);
  });

  it("pays nothing on REJECT", () => {
    expect(normalizeVerdict(judge({ outcome: "REJECT", approvedAmount: 99 }), decision).approvedAmount).toBe(0);
  });

  it("caps a MODIFY at the requested amount and rounds to cents", () => {
    expect(normalizeVerdict(judge({ outcome: "MODIFY", approvedAmount: 9_999 }), decision).approvedAmount).toBe(1_188);
    expect(normalizeVerdict(judge({ outcome: "MODIFY", approvedAmount: 98.999 }), decision).approvedAmount).toBe(99);
  });

  it("turns a MODIFY that approves nothing into a REJECT", () => {
    for (const approvedAmount of [0, -5, Number.NaN]) {
      const v = normalizeVerdict(judge({ outcome: "MODIFY", approvedAmount, modification: "m" }), decision);
      expect(v).toMatchObject({ outcome: "REJECT", approvedAmount: 0, modification: "" });
    }
  });

  it("clamps scores to 0-100", () => {
    const v = normalizeVerdict(judge({ confidence: 140, riskScore: Number.NaN }), decision);
    expect(v.confidence).toBe(100);
    expect(v.riskScore).toBe(50);
  });
});

describe("simulateVerdict", () => {
  const run = (d: MoneyDecision) => normalizeVerdict(simulateVerdict(d, buildEvidence(d)), d);

  it("approves a clean purchase in full", () => {
    expect(run(decision)).toMatchObject({ outcome: "PROCEED", approvedAmount: 1_188 });
  });

  it("switches an overlapping yearly prepay to monthly billing", () => {
    const d = { ...decision, subscriptions: [{ name: "Sketchpad", category: "software" as const, monthlyCost: 15 }] };
    expect(run(d)).toMatchObject({ outcome: "MODIFY", approvedAmount: 99 });
  });

  it("rejects a one-time purchase the budget cannot cover", () => {
    expect(run({ ...decision, billing: "one_time", monthlyBudget: 500 })).toMatchObject({
      outcome: "REJECT",
      approvedAmount: 0,
    });
  });
});
