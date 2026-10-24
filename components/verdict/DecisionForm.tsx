"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import {
  BILLING,
  BILLING_LABELS,
  CATEGORIES,
  decisionFormSchema,
  type DecisionFormValues,
} from "@/lib/validation/decision";
import { saveDecision } from "@/lib/utils/storage";

// Demo scenarios for judges: each one exercises a different verdict path.
const EXAMPLES: { label: string; values: DecisionFormValues }[] = [
  {
    label: "Annual design app",
    values: {
      title: "Design app Pro — annual plan",
      merchant: "Acme Design Co.",
      category: "software",
      amount: 1188,
      billing: "yearly",
      reason: "Need prototyping for client mockups; my current tool lacks it.",
      monthlyBudget: 1500,
      subscriptions: [
        { name: "Sketchpad Pro", category: "software", monthlyCost: 15 },
        { name: "Music streaming", category: "streaming", monthlyCost: 11 },
      ],
    },
  },
  {
    label: "Flash-sale course",
    values: {
      title: "Trading masterclass — limited-time 70% off",
      merchant: "Fast Wealth Academy",
      category: "learning",
      amount: 400,
      billing: "one_time",
      reason: "An ad said this offer ends tonight.",
      monthlyBudget: 600,
      subscriptions: [{ name: "Online course platform", category: "learning", monthlyCost: 30 }],
    },
  },
  {
    label: "Ergonomic keyboard",
    values: {
      title: "Ergonomic split keyboard",
      merchant: "KeyWorks Store",
      category: "hardware",
      amount: 129,
      billing: "one_time",
      reason: "Wrist pain after long coding sessions.",
      monthlyBudget: 800,
      subscriptions: [{ name: "Music streaming", category: "streaming", monthlyCost: 11 }],
    },
  },
];

const inputClass =
  "w-full border-2 border-graphite bg-black px-4 py-3 font-mono text-sm text-paper-white placeholder:text-fog/60 focus:border-cb-orange focus:outline-none";
const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-fog";

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-4 border-b-2 border-graphite pb-3">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cb-orange">{step}</div>
      <h2 className="font-tech text-lg uppercase tracking-wide text-paper-white">{title}</h2>
    </div>
  );
}

export function DecisionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: {
      title: "",
      merchant: "",
      category: "software",
      billing: "one_time",
      reason: "",
      subscriptions: [],
    },
  });
  const subscriptions = useFieldArray({ control, name: "subscriptions" });

  function onSubmit(data: DecisionFormValues) {
    setSubmitting(true);
    const decision = { ...data, id: nanoid(10), createdAt: new Date().toISOString() };
    if (!saveDecision(decision)) {
      setStorageError("This browser could not save your decision. Enable site storage and try again.");
      setSubmitting(false);
      return;
    }
    router.push(`/verdict/${decision.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {storageError && <p className="vc-error" role="alert">{storageError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fog">Try an example:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => reset(example.values)}
            className="border-2 border-graphite bg-raw-surface px-3 py-1.5 font-mono text-[11px] uppercase text-fog transition-colors hover:border-cb-orange hover:text-paper-white"
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* 1. THE PAYMENT */}
      <section aria-labelledby="payment-title">
        <SectionTitle step="01 // Payment" title="What do you want to pay for?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelClass}>What is it</label>
            <input id="title" className={inputClass} placeholder="e.g. Design app Pro — annual plan" {...register("title")} />
            {errors.title && <p className="vc-error">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="merchant" className={labelClass}>Who gets paid</label>
            <input id="merchant" className={inputClass} placeholder="Merchant or payee" {...register("merchant")} />
            {errors.merchant && <p className="vc-error">{errors.merchant.message}</p>}
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select id="category" className={inputClass} {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className={labelClass}>Amount (USD)</label>
            <input id="amount" type="number" step="0.01" inputMode="decimal" className={inputClass} placeholder="129.00" {...register("amount", { valueAsNumber: true })} />
            {errors.amount && <p className="vc-error">{errors.amount.message}</p>}
          </div>
          <fieldset>
            <legend className={labelClass}>Billing</legend>
            <div className="grid grid-cols-3 gap-2">
              {BILLING.map((b) => (
                <label key={b} className="flex cursor-pointer items-center justify-center border-2 border-graphite bg-black px-2 py-3 text-center font-mono text-[11px] uppercase text-fog has-[:checked]:border-cb-orange has-[:checked]:text-paper-white">
                  <input type="radio" value={b} className="sr-only" {...register("billing")} />
                  {BILLING_LABELS[b]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label htmlFor="reason" className={labelClass}>Why (optional, but the jury will notice)</label>
            <textarea id="reason" rows={2} className={inputClass} placeholder="What problem does this solve?" {...register("reason")} />
            {errors.reason && <p className="vc-error">{errors.reason.message}</p>}
          </div>
        </div>
      </section>

      {/* 2. BUDGET CONTEXT */}
      <section aria-labelledby="budget-title">
        <SectionTitle step="02 // Context" title="Your budget and existing spend" />
        <div className="space-y-4">
          <div className="max-w-xs">
            <label htmlFor="monthlyBudget" className={labelClass}>Monthly discretionary budget (USD)</label>
            <input id="monthlyBudget" type="number" step="1" inputMode="decimal" className={inputClass} placeholder="800" {...register("monthlyBudget", { valueAsNumber: true })} />
            {errors.monthlyBudget && <p className="vc-error">{errors.monthlyBudget.message}</p>}
          </div>

          <div className="space-y-2">
            <div className={labelClass}>Current subscriptions</div>
            {subscriptions.fields.length === 0 && (
              <p className="font-mono text-xs text-fog">None added. Add the ones you pay for so the jury can spot overlap.</p>
            )}
            {subscriptions.fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <input aria-label={`Subscription ${i + 1} name`} className={`${inputClass} col-span-2 sm:col-span-1`} placeholder="Name" {...register(`subscriptions.${i}.name`)} />
                <select aria-label={`Subscription ${i + 1} category`} className={inputClass} {...register(`subscriptions.${i}.category`)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input aria-label={`Subscription ${i + 1} monthly cost in USD`} type="number" step="0.01" className={inputClass} placeholder="$/mo" {...register(`subscriptions.${i}.monthlyCost`, { valueAsNumber: true })} />
                <button type="button" onClick={() => subscriptions.remove(i)} className="px-3 font-mono text-xs text-fog hover:text-cb-red" aria-label={`Remove subscription ${i + 1}`}>
                  ✕
                </button>
                {errors.subscriptions?.[i] && (
                  <p className="vc-error col-span-full">
                    {errors.subscriptions[i]?.name?.message ?? errors.subscriptions[i]?.monthlyCost?.message}
                  </p>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => subscriptions.append({ name: "", category: "software", monthlyCost: 0 })}
              disabled={subscriptions.fields.length >= 20}
              className="neo-btn-ghost text-xs disabled:opacity-50"
            >
              + Add subscription
            </button>
          </div>
        </div>
      </section>

      <button type="submit" disabled={submitting} className="neo-btn-primary w-full justify-center py-4 text-sm disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Convening the jury…" : "Convene the AI jury →"}
      </button>

      <p className="text-center font-sans text-[11px] leading-relaxed text-fog">
        Nothing is paid at this step. You confirm any payment after the verdict.
      </p>
    </form>
  );
}
