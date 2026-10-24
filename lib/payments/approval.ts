// ── Signed payment approvals ──────────────────────────────────────────────────
// Verdicts live in the browser, so the server signs what the jury approved and
// only creates a PayPal order from a valid signature. A client cannot raise the
// amount, change the payee description, or pay for a rejected decision.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";

export interface Approval {
  decisionId: string;
  /** USD, already capped by normalizeVerdict */
  amount: number;
  outcome: "PROCEED" | "MODIFY";
  title: string;
  merchant: string;
  /** Unix ms */
  expiresAt: number;
}

const TTL_MS = 30 * 60 * 1000;
const PLACEHOLDER = "replace_with_random_hex_string";

function secret(): string | null {
  const s = process.env.VERDICT_SIGNING_SECRET;
  return s && s !== PLACEHOLDER && s.length >= 32 ? s : null;
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

/** Returns a token, or null when payments are disabled or the verdict pays nothing. */
export function signApproval(d: MoneyDecision, v: VerdictCard, now = Date.now()): string | null {
  const key = secret();
  if (!key || v.outcome === "REJECT" || !(v.approvedAmount > 0)) return null;
  const approval: Approval = {
    decisionId: d.id,
    amount: v.approvedAmount,
    outcome: v.outcome,
    title: d.title,
    merchant: d.merchant,
    expiresAt: now + TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(approval)).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** Returns the approval when the signature is valid and unexpired, otherwise null. */
export function verifyApproval(token: string, now = Date.now()): Approval | null {
  const key = secret();
  const [payload, signature, extra] = token.split(".");
  if (!key || !payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const approval = JSON.parse(Buffer.from(payload, "base64url").toString()) as Approval;
    if (!(approval.amount > 0) || approval.amount > 10_000 || approval.expiresAt < now) return null;
    return approval;
  } catch {
    return null;
  }
}
