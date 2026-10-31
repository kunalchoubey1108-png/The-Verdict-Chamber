import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signApproval, verifyApproval } from "./approval";
import { approvalExpired } from "./approvalExpiry";
import { makeDecision, makeVerdictCard } from "@/lib/test/fixtures";

const decision = makeDecision();

const verdict = makeVerdictCard();

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

describe("approvalExpired (browser-side display check)", () => {
  it("reads the expiry from a real token, including a non-ASCII title", () => {
    const token = signApproval({ ...decision, title: "Design app Pro — annual plan" }, verdict, NOW)!;
    expect(approvalExpired(token, NOW + 1_000)).toBe(false);
    expect(approvalExpired(token, NOW + 31 * 60 * 1000)).toBe(true);
  });

  it("treats no token as not expired and an unreadable token as expired", () => {
    expect(approvalExpired(null)).toBe(false);
    expect(approvalExpired("garbage")).toBe(true);
  });
});
