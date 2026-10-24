import { z } from "zod";

// ── Money decision contract ───────────────────────────────────────────────────
// One schema validates the form, the API boundary and stored records.

export const CATEGORIES = ["software", "streaming", "learning", "fitness", "hardware", "services", "other"] as const;
export const BILLING = ["one_time", "monthly", "yearly"] as const;

export const BILLING_LABELS: Record<(typeof BILLING)[number], string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly (prepaid)",
};

const usd = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `Enter ${label}` })
    .finite()
    .min(min, `Must be at least $${min}`)
    .max(max, `Capped at $${max.toLocaleString("en-US")}`);

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, "Name the subscription").max(80),
  category: z.enum(CATEGORIES),
  monthlyCost: usd("a monthly cost", 0, 100_000),
});

export const decisionFormSchema = z.object({
  title: z.string().trim().min(3, "Describe what you want to pay for").max(120),
  merchant: z.string().trim().min(1, "Name who gets paid").max(80),
  category: z.enum(CATEGORIES),
  // Sandbox demo cap; the PayPal order can never exceed the requested amount.
  amount: usd("an amount", 1, 10_000),
  billing: z.enum(BILLING),
  reason: z.string().trim().max(1_000),
  monthlyBudget: usd("a monthly budget", 1, 1_000_000),
  subscriptions: z.array(subscriptionSchema).max(20),
});

export const decisionSchema = decisionFormSchema.extend({
  id: z.string().min(1).max(64),
  createdAt: z.string().datetime(),
});

export const juryRequestSchema = z.object({ decision: decisionSchema });

export type Category = (typeof CATEGORIES)[number];
export type Billing = (typeof BILLING)[number];
export type Subscription = z.infer<typeof subscriptionSchema>;
export type DecisionFormValues = z.infer<typeof decisionFormSchema>;
export type MoneyDecision = z.infer<typeof decisionSchema>;
