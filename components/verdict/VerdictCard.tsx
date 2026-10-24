"use client";

import type { VerdictCard as VerdictCardType, VerdictOutcome } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";
import { cn } from "@/lib/utils/cn";
import { fmtUSD } from "@/lib/utils/format";

interface VerdictCardProps {
  verdict: VerdictCardType;
  decision: MoneyDecision;
}

export const OUTCOME_STYLE: Record<VerdictOutcome, { badge: string; bar: string; icon: string; label: string }> = {
  PROCEED: { badge: "bg-cb-green text-white", bar: "bg-cb-green", icon: "check_circle", label: "Proceed — pay as requested" },
  MODIFY: { badge: "bg-cb-amber text-black", bar: "bg-cb-amber", icon: "tune", label: "Modify — pay a changed amount" },
  REJECT: { badge: "bg-cb-red text-white", bar: "bg-cb-red", icon: "block", label: "Reject — do not pay" },
};

export function VerdictCard({ verdict, decision }: VerdictCardProps) {
  const { outcome, confidence, riskScore, approvedAmount, modification, dealBreaker, summary, keyRisks } = verdict;
  const style = OUTCOME_STYLE[outcome];

  return (
    <section className="rounded-[18px] bg-carbon border-2 border-graphite p-6 space-y-5 animate-slide-up" style={{ boxShadow: "4px 4px 0px 0px #E28743" }}>
      {/* Header: Verdict Stamp */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-graphite">
        <div className="flex flex-col gap-2">
          <span className="font-tech text-[10px] text-raw-dim uppercase tracking-widest">Verdict // Presiding Judge</span>
          <span
            className={cn("px-4 py-1.5 rounded-[6px] border-2 border-black text-xs font-tech font-bold tracking-wider flex items-center gap-2 uppercase w-fit", style.badge)}
            style={{ boxShadow: "2px 2px 0px 0px #000000" }}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{style.icon}</span>
            {outcome}
          </span>
          <span className="text-xs text-bone">{style.label}</span>
        </div>
        <div className="text-right">
          <span className="block font-mono text-[9px] text-raw-dim uppercase tracking-wider">Risk score</span>
          <span className={cn("font-display text-2xl tabular", riskScore > 65 ? "text-cb-red" : riskScore > 40 ? "text-cb-amber" : "text-cb-green")}>
            {riskScore}/100
          </span>
        </div>
      </div>

      {/* Requested vs approved */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-[10px] border-2 border-graphite bg-black p-3">
          <div className="font-tech text-[9px] uppercase tracking-wider text-raw-dim">Requested</div>
          <div className="mt-1 font-display text-xl text-bone tabular">{fmtUSD(decision.amount)}</div>
        </div>
        <div className="rounded-[10px] border-2 border-graphite bg-black p-3">
          <div className="font-tech text-[9px] uppercase tracking-wider text-raw-dim">Approved to pay</div>
          <div className={cn("mt-1 font-display text-xl tabular", approvedAmount > 0 ? "text-cb-green" : "text-cb-red")}>
            {fmtUSD(approvedAmount)}
          </div>
        </div>
      </div>

      {/* Judge confidence */}
      <div className="space-y-1.5">
        <div className="flex justify-between font-mono text-[9px] text-raw-dim uppercase tracking-wider">
          <span className="font-bold">Judge confidence</span>
          <span>{confidence}%</span>
        </div>
        <div
          className="w-full h-2 bg-black border border-graphite overflow-hidden"
          role="progressbar"
          aria-label="Judge confidence"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={confidence}
        >
          <div className={cn("h-full transition-all duration-700", style.bar)} style={{ width: `${confidence}%` }} />
        </div>
      </div>

      {modification && (
        <div className="p-4 bg-cb-amber/10 border-2 border-cb-amber/40 rounded-[10px] space-y-1.5">
          <div className="font-tech text-[10px] font-bold text-cb-amber tracking-wider uppercase">Required change</div>
          <p className="text-xs text-bone leading-relaxed">{modification}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-2">
          <div className="font-tech text-[10px] font-bold text-cb-orange uppercase tracking-wider">Ruling summary</div>
          <p className="text-xs text-bone leading-relaxed font-sans">{summary}</p>
        </div>
      )}

      {keyRisks.length > 0 && (
        <div className="space-y-2">
          <div className="font-tech text-[10px] font-bold text-cb-red uppercase tracking-wider">Key risks</div>
          <ul className="space-y-1.5">
            {keyRisks.map((risk) => (
              <li key={risk} className="flex items-start gap-2 text-[11px] text-bone">
                <span className="text-cb-orange font-bold" aria-hidden="true">▸</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 bg-black border-2 border-graphite rounded-[10px] space-y-1.5">
        <div className="font-tech text-[10px] font-bold text-cb-orange tracking-wider uppercase">Reconsider if</div>
        <p className="text-xs text-bone leading-relaxed">{dealBreaker}</p>
      </div>

      <div className="text-[10px] text-raw-dim text-center pt-3 border-t-2 border-graphite font-mono uppercase tracking-wider">
        AI decision support, not financial advice · You confirm before any payment
      </div>
    </section>
  );
}
