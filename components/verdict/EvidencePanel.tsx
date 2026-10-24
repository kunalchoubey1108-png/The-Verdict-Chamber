import type { DecisionEvidence } from "@/lib/decision/evidence";
import { BILLING_LABELS, type MoneyDecision } from "@/lib/validation/decision";
import { fmtUSD } from "@/lib/utils/format";

interface EvidencePanelProps {
  decision: MoneyDecision;
  evidence: DecisionEvidence;
}

/** The computed facts every juror argues over. */
export function EvidencePanel({ decision, evidence: e }: EvidencePanelProps) {
  const stats = [
    { label: "Due now", value: fmtUSD(e.dueNow) },
    { label: "First 12 months", value: fmtUSD(e.annualCost) },
    { label: "Share of monthly budget", value: `${Math.round(e.budgetSharePct)}%`, alert: e.budgetSharePct >= 50 },
    { label: "Left after paying", value: fmtUSD(e.remainingAfter), alert: e.remainingAfter < 0 },
  ];

  return (
    <section className="neo-card space-y-5 bg-raw-surface p-6" aria-label="Decision evidence">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-graphite pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cb-orange">Evidence // computed from your inputs</div>
          <div className="font-tech text-sm uppercase text-paper-white">
            {decision.merchant} · {decision.category} · {BILLING_LABELS[decision.billing]}
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase text-fog">
          Budget {fmtUSD(decision.monthlyBudget)}/mo · Subscriptions {fmtUSD(e.committedMonthly)}/mo
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-2 border-graphite bg-black p-3">
            <dt className="font-mono text-[9px] uppercase tracking-wider text-fog">{s.label}</dt>
            <dd className={`mt-1 font-display text-2xl tabular ${s.alert ? "text-cb-red" : "text-paper-white"}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-fog">Red flags</div>
        {e.redFlags.length > 0 ? (
          <ul className="space-y-1.5">
            {e.redFlags.map((flag) => (
              <li key={flag} className="flex gap-2 text-sm text-bone">
                <span className="text-cb-red" aria-hidden="true">▲</span>
                {flag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-cb-green">None detected in the numbers provided.</p>
        )}
      </div>
    </section>
  );
}
