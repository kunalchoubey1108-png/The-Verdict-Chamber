// Shared test data. Override only the fields a test's assertions depend on.

import type { VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";

export const makeDecision = (overrides: Partial<MoneyDecision> = {}): MoneyDecision => ({
  id: "decision-1",
  createdAt: "2026-10-25T00:00:00.000Z",
  title: "Design app",
  merchant: "Acme Design Co.",
  category: "software",
  amount: 1_188,
  billing: "yearly",
  reason: "Client work",
  monthlyBudget: 1_500,
  subscriptions: [],
  ...overrides,
});

export const makeVerdictCard = (overrides: Partial<VerdictCard> = {}): VerdictCard => ({
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
