import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signApproval, verifyApproval } from "./approval";
import type { VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";

const decision: MoneyDecision = {
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
};

const verdict: VerdictCard = {
  outcome: "MODIFY",
  confidence: 68,
  riskScore: 55,
  approvedAmount: 99,
  modification: "Monthly billing",
  dealBreaker: "x",
  summary: "y",
  keyRisks: [],
};

const NOW = 1_800_000_000_000;

beforeEach(() => vi.stubEnv("VERDICT_SIGNING_SECRET", "a".repeat(64)));
afterEach(() => vi.unstubAllEnvs());

describe("payment approvals", () => {
  it("round-trips the approved amount, not the requested one", () => {
    const token = signApproval(decision, verdict, NOW)!;
    expect(verifyApproval(token, NOW + 1_000)).toMatchObject({ decisionId: "decision-1", amount: 99, outcome: "MODIFY" });
  });

  it("rejects a token whose amount was edited", () => {
    const [payload, sig] = signApproval(decision, verdict, NOW)!.split(".");
    const forged = JSON.parse(Buffer.from(payload, "base64url").toString());
    forged.amount = 1_188;
    const forgedPayload = Buffer.from(JSON.stringify(forged)).toString("base64url");
    expect(verifyApproval(`${forgedPayload}.${sig}`, NOW)).toBeNull();
  });

  it("rejects expired tokens and tokens signed with another secret", () => {
    const token = signApproval(decision, verdict, NOW)!;
    expect(verifyApproval(token, NOW + 31 * 60 * 1000)).toBeNull();
    vi.stubEnv("VERDICT_SIGNING_SECRET", "b".repeat(64));
    expect(verifyApproval(token, NOW)).toBeNull();
  });

  it("issues nothing for REJECT or when the secret is missing or a placeholder", () => {
    expect(signApproval(decision, { ...verdict, outcome: "REJECT", approvedAmount: 0 }, NOW)).toBeNull();
    vi.stubEnv("VERDICT_SIGNING_SECRET", "replace_with_random_hex_string");
    expect(signApproval(decision, verdict, NOW)).toBeNull();
    vi.stubEnv("VERDICT_SIGNING_SECRET", "");
    expect(signApproval(decision, verdict, NOW)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyApproval("not-a-token")).toBeNull();
    expect(verifyApproval("a.b.c")).toBeNull();
  });
});
