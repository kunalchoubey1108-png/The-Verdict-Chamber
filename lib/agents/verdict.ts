// ── Judge verdict: schema, money rules, offline fallback ──────────────────────

import { z } from "zod";
import type { DecisionEvidence } from "@/lib/decision/evidence";
import type { VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";
import { fmtUSD } from "@/lib/utils/format";

/** Structured output requested from the judge model. */
export const judgeSchema = z.object({
  ruling: z.string().describe("Markdown ruling under 250 words that cites the evidence numbers"),
  outcome: z.enum(["PROCEED", "MODIFY", "REJECT"]),
  confidence: z.number().describe("Judge confidence from 0 to 100"),
  riskScore: z.number().describe("Financial risk of the payment from 0 (safe) to 100 (hazardous)"),
  approvedAmount: z
    .number()
    .describe("USD to charge now: the full amount for PROCEED, a lower amount for MODIFY, 0 for REJECT"),
  modification: z.string().describe("For MODIFY only: the exact change, e.g. 'Switch to monthly billing'. Empty otherwise."),
  dealBreaker: z.string().describe("One sentence: the condition under which this decision would be wrong"),
  summary: z.string().describe("Two or three plain-English sentences"),
  keyRisks: z.array(z.string()).describe("Up to three key risks"),
});

export type JudgeOutput = z.infer<typeof judgeSchema>;

const score = (n: number) => (Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : 50);
const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Enforce the money rules regardless of what the model returned: the approved
 * amount is never above what the user asked to pay, and REJECT pays nothing.
 * Text is capped to the lengths stored records allow.
 */
export function normalizeVerdict(raw: JudgeOutput, d: MoneyDecision): VerdictCard {
  let outcome = raw.outcome;
  let approvedAmount =
    outcome === "PROCEED" ? d.amount : outcome === "REJECT" ? 0 : cents(Math.min(Math.max(raw.approvedAmount, 0), d.amount));
  // A modification that approves nothing (or a non-number) is a rejection.
  if (outcome === "MODIFY" && !(approvedAmount > 0)) {
    outcome = "REJECT";
    approvedAmount = 0;
  }
  return {
    outcome,
    confidence: score(raw.confidence),
    riskScore: score(raw.riskScore),
    approvedAmount,
    modification: outcome === "MODIFY" ? raw.modification.slice(0, 500) : "",
    dealBreaker: raw.dealBreaker.slice(0, 500),
    summary: raw.summary.slice(0, 2_000),
    keyRisks: raw.keyRisks.slice(0, 5).map((r) => r.slice(0, 300)),
  };
}

/** Deterministic judge used when Gemini is not configured or fails. */
export function simulateVerdict(d: MoneyDecision, e: DecisionEvidence): JudgeOutput {
  const overBudget = e.remainingAfter < 0;
  const overlapNames = e.overlaps.map((s) => s.name).join(", ");

  let outcome: JudgeOutput["outcome"] = "PROCEED";
  let approvedAmount = d.amount;
  let modification = "";

  if (overBudget && d.billing !== "yearly") {
    outcome = "REJECT";
  } else if (e.urgencyPhrase && (e.overlaps.length > 0 || e.budgetSharePct >= 25)) {
    outcome = "REJECT";
  } else if (d.billing === "yearly" && (overBudget || e.overlaps.length > 0 || e.budgetSharePct >= 50)) {
    outcome = "MODIFY";
    approvedAmount = cents(d.amount / 12);
    modification = `Start on monthly billing (about ${fmtUSD(approvedAmount)}/month) instead of prepaying ${fmtUSD(d.amount)} for the year, so you can cancel if it goes unused.`;
  } else if (e.overlaps.length > 0) {
    outcome = "MODIFY";
    modification = `Cancel ${overlapNames} first so you are not paying twice for ${d.category}.`;
  }
  if (outcome === "REJECT") approvedAmount = 0;

  const riskScore =
    Math.min(e.budgetSharePct, 100) * 0.5 + e.overlaps.length * 15 + (e.urgencyPhrase ? 20 : 0) + (overBudget ? 25 : 0);
  const confidence = outcome === "PROCEED" ? 72 : outcome === "MODIFY" ? 68 : 78;

  const dealBreaker =
    outcome === "REJECT"
      ? `This rejection is wrong only if ${d.title} replaces an existing cost or is required to earn income this month.`
      : outcome === "MODIFY"
        ? `Reconsider if the modified plan is unavailable or the overlapping service cannot be cancelled.`
        : `Reconsider if ${d.title} is not used at least weekly within the first month.`;

  const summary =
    outcome === "PROCEED"
      ? `${d.title} fits the budget with ${fmtUSD(e.remainingAfter)} left this month and no overlapping spend. The panel approves paying ${fmtUSD(d.amount)}.`
      : outcome === "MODIFY"
        ? `The purchase is reasonable but not in its current form. ${modification}`
        : `The panel rejects this payment. ${e.redFlags[0] ?? "The numbers do not support it."}`;

  const ruling = [
    `### Ruling: ${outcome}`,
    "",
    `Having heard all four counsel on **${d.title}** from **${d.merchant}** (${fmtUSD(d.amount)}, ${d.billing.replace("_", "-")}):`,
    "",
    `- **Budget:** ${fmtUSD(e.dueNow)} due now is ${Math.round(e.budgetSharePct)}% of the ${fmtUSD(d.monthlyBudget)} monthly budget; ${fmtUSD(e.remainingAfter)} would remain after existing subscriptions.`,
    `- **First-year cost:** ${fmtUSD(e.annualCost)}.`,
    e.overlaps.length > 0 ? `- **Overlap:** already paying for ${overlapNames}.` : "- **Overlap:** none found.",
    e.urgencyPhrase ? `- **Pressure:** the request uses "${e.urgencyPhrase}".` : "",
    "",
    summary,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");

  return {
    ruling,
    outcome,
    confidence,
    riskScore,
    approvedAmount,
    modification,
    dealBreaker,
    summary,
    keyRisks: e.redFlags.length > 0 ? e.redFlags.slice(0, 3) : ["No major red flags in the numbers provided."],
  };
}
