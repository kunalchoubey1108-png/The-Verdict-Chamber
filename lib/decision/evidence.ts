// ── Decision evidence ─────────────────────────────────────────────────────────
// Deterministic facts computed only from what the user entered. No AI, no
// network: the jury argues over these numbers, it never invents them.

import type { MoneyDecision, Subscription } from "@/lib/validation/decision";
import { fmtUSD } from "@/lib/utils/format";

export interface DecisionEvidence {
  /** Charged at checkout today */
  dueNow: number;
  /** Recurring cost per month; 0 for one-time payments */
  monthlyCost: number;
  /** Cash out over the first 12 months */
  annualCost: number;
  /** dueNow as % of the monthly budget */
  budgetSharePct: number;
  /** Existing subscriptions per month */
  committedMonthly: number;
  /** Budget left this month after existing subscriptions and this charge */
  remainingAfter: number;
  /** Existing subscriptions in the same category */
  overlaps: Subscription[];
  /** Pressure wording found in the title or reason, if any */
  urgencyPhrase: string | null;
  /** Plain-English warnings for the jury and the UI */
  redFlags: string[];
}

const URGENCY =
  /\b(limited[- ]time|today only|last chance|act now|(?:expires?|ends) (?:today|tonight|soon)|ending soon|only \d+ left|flash sale|before it'?s gone|price goes up)\b/i;

export function buildEvidence(d: MoneyDecision): DecisionEvidence {
  const dueNow = d.amount;
  const monthlyCost = d.billing === "monthly" ? d.amount : d.billing === "yearly" ? d.amount / 12 : 0;
  const annualCost = d.billing === "monthly" ? d.amount * 12 : d.amount;
  const budgetSharePct = (dueNow / d.monthlyBudget) * 100;
  const committedMonthly = d.subscriptions.reduce((sum, s) => sum + s.monthlyCost, 0);
  const remainingAfter = d.monthlyBudget - committedMonthly - dueNow;
  const overlaps = d.category === "other" ? [] : d.subscriptions.filter((s) => s.category === d.category);
  const urgencyPhrase = `${d.title} ${d.reason}`.match(URGENCY)?.[0] ?? null;

  const redFlags: string[] = [];
  if (remainingAfter < 0) {
    redFlags.push(`Charging ${fmtUSD(dueNow)} now leaves the monthly budget ${fmtUSD(-remainingAfter)} short.`);
  } else if (budgetSharePct >= 50) {
    redFlags.push(`One charge takes ${Math.round(budgetSharePct)}% of the monthly budget.`);
  }
  if (overlaps.length > 0) {
    redFlags.push(`Overlaps with existing ${d.category} spend: ${overlaps.map((s) => s.name).join(", ")}.`);
  }
  if (urgencyPhrase) {
    redFlags.push(`Urgency wording ("${urgencyPhrase}") is a common pressure tactic.`);
  }
  if (d.billing === "yearly") {
    redFlags.push(`Prepays 12 months (${fmtUSD(dueNow)}) up front; check the refund policy before committing.`);
  }
  if (!d.reason) {
    redFlags.push("No reason was given for this payment.");
  }

  return {
    dueNow,
    monthlyCost,
    annualCost,
    budgetSharePct,
    committedMonthly,
    remainingAfter,
    overlaps,
    urgencyPhrase,
    redFlags,
  };
}
