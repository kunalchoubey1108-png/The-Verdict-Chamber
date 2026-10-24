import { describe, expect, it } from "vitest";
import { buildEvidence } from "./evidence";
import type { MoneyDecision } from "@/lib/validation/decision";

const base: MoneyDecision = {
  id: "d-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  title: "Standing desk",
  merchant: "Desk Co",
  category: "hardware",
  amount: 300,
  billing: "one_time",
  reason: "Back pain from my current chair setup",
  monthlyBudget: 1_000,
  subscriptions: [{ name: "Music", category: "streaming", monthlyCost: 10 }],
};

describe("buildEvidence", () => {
  it("computes budget math for a clean one-time purchase with no red flags", () => {
    const e = buildEvidence(base);

    expect(e.dueNow).toBe(300);
    expect(e.monthlyCost).toBe(0);
    expect(e.annualCost).toBe(300);
    expect(e.budgetSharePct).toBe(30);
    expect(e.remainingAfter).toBe(690);
    expect(e.overlaps).toEqual([]);
    expect(e.redFlags).toEqual([]);
  });

  it("flags a yearly plan that overlaps, uses urgency wording and breaks the budget", () => {
    const e = buildEvidence({
      ...base,
      title: "Design tool annual plan — price goes up Friday",
      category: "software",
      amount: 1_188,
      billing: "yearly",
      subscriptions: [{ name: "Sketchpad Pro", category: "software", monthlyCost: 15 }],
    });

    expect(e.monthlyCost).toBe(99);
    expect(e.annualCost).toBe(1_188);
    expect(e.remainingAfter).toBe(1_000 - 15 - 1_188);
    expect(e.overlaps.map((s) => s.name)).toEqual(["Sketchpad Pro"]);
    expect(e.urgencyPhrase?.toLowerCase()).toBe("price goes up");
    expect(e.redFlags).toHaveLength(4);
  });

  it("detects urgency wording in the reason", () => {
    expect(buildEvidence({ ...base, reason: "The offer ends tonight" }).urgencyPhrase).toBe("ends tonight");
  });

  it("annualises monthly subscriptions and never treats 'other' as an overlap", () => {
    const e = buildEvidence({
      ...base,
      category: "other",
      amount: 20,
      billing: "monthly",
      reason: "",
      subscriptions: [{ name: "Misc", category: "other", monthlyCost: 5 }],
    });

    expect(e.monthlyCost).toBe(20);
    expect(e.annualCost).toBe(240);
    expect(e.overlaps).toEqual([]);
    expect(e.redFlags).toEqual(["No reason was given for this payment."]);
  });
});
