"use client";

import type { VerdictCard as VerdictCardType } from "@/lib/types/verdict";
import { cn } from "@/lib/utils/cn";
import { fmtINR } from "@/lib/utils/format";
import type { EvidencePack } from "@/lib/types/evidence";

interface VerdictCardProps {
  verdict: VerdictCardType;
  evidencePack: EvidencePack;
  compact?: boolean;
}

export function VerdictCard({ verdict, evidencePack, compact }: VerdictCardProps) {
  const { outcome, confidence, riskScore, trapProbability, thesisKiller, riskRewardRatio, summary, watchConditions, keyRisks } = verdict;
  const { thesis } = evidencePack;

  const badgeClass =
    outcome === "TRADE"
      ? "bg-cb-green text-white border-2 border-black"
      : outcome === "WATCH"
      ? "bg-cb-amber text-black border-2 border-black"
      : "bg-cb-red text-white border-2 border-black";

  const outcomeIcon =
    outcome === "TRADE" ? "check_circle" : outcome === "WATCH" ? "visibility" : "block";

  if (compact) {
    return (
      <div className="flex items-center gap-3 font-mono text-xs">
        <span className={cn("px-3 py-1 rounded-[6px] font-bold uppercase tracking-wider flex items-center gap-1", badgeClass)}>
          <span className="material-symbols-outlined text-[14px]">{outcomeIcon}</span>
          {outcome}
        </span>
        <span className="text-raw-dim">Risk {riskScore}/100</span>
        <span className="text-raw-dim truncate max-w-xs">{thesisKiller}</span>
      </div>
    );
  }

  // Consensus breakdown estimation for visual bar
  const bullPct = outcome === "TRADE" ? 72 : outcome === "WATCH" ? 54 : 18;
  const neutralPct = outcome === "WATCH" ? 28 : 16;
  const bearPct = 100 - bullPct - neutralPct;

  return (
    <section className="rounded-[18px] bg-carbon border-2 border-graphite p-6 space-y-5 animate-slide-up" style={{ boxShadow: '4px 4px 0px 0px #E28743' }}>
      {/* Header: Verdict Stamp */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-graphite">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-tech text-[10px] text-raw-dim uppercase tracking-widest">
              VERDICT // CHAMBER DECREE
            </span>
          </div>
          <span className={cn("px-4 py-1.5 rounded-[6px] text-xs font-tech font-bold tracking-wider flex items-center gap-2 uppercase w-fit", badgeClass)}
            style={{ boxShadow: '2px 2px 0px 0px #000000' }}>
            <span className="material-symbols-outlined text-[16px]">{outcomeIcon}</span>
            {outcome} — {thesis.direction === "LONG" ? "CONDITIONAL LONG" : "CONDITIONAL SHORT"}
          </span>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="font-mono text-[9px] text-raw-dim uppercase tracking-wider">Consensus</span>
          <span className="font-display text-2xl text-cb-green tabular leading-none">{confidence}%</span>
        </div>
      </div>

      {/* Consensus Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between font-mono text-[9px] text-raw-dim uppercase tracking-wider">
          <span className="text-cb-green font-bold">BULL ({bullPct}%)</span>
          <span className="text-cb-amber font-bold">NEUTRAL ({neutralPct}%)</span>
          <span className="text-cb-red font-bold">BEAR ({bearPct}%)</span>
        </div>
        <div className="w-full h-2 bg-black border border-graphite overflow-hidden flex">
          <div className="h-full bg-cb-green transition-all duration-700" style={{ width: `${bullPct}%` }} />
          <div className="h-full bg-cb-amber transition-all duration-700" style={{ width: `${neutralPct}%` }} />
          <div className="h-full bg-cb-red transition-all duration-700" style={{ width: `${bearPct}%` }} />
        </div>
      </div>

      {/* Quick Metric Row (3 Column Metrics) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col items-center text-center">
          <span className="font-tech text-[9px] text-raw-dim uppercase tracking-wider">Conviction</span>
          <span className="font-display text-xl text-cb-green leading-tight pt-1">{confidence}%</span>
        </div>
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col items-center text-center">
          <span className="font-tech text-[9px] text-raw-dim uppercase tracking-wider">Risk Score</span>
          <span className={cn(
            "font-display text-xl leading-tight pt-1",
            riskScore > 65 ? "text-cb-red" : riskScore > 40 ? "text-cb-amber" : "text-cb-green"
          )}>
            {riskScore}/100
          </span>
        </div>
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col items-center text-center">
          <span className="font-tech text-[9px] text-raw-dim uppercase tracking-wider">Trap Prob</span>
          <span className={cn(
            "font-display text-xl leading-tight pt-1",
            trapProbability > 50 ? "text-cb-red" : "text-cb-amber"
          )}>
            {trapProbability}%
          </span>
        </div>
      </div>

      {/* Asymmetry Ratio Strip */}
      <div className="flex items-center justify-between p-3 bg-black border-2 border-graphite rounded-[10px]">
        <span className="text-xs font-tech text-raw-dim uppercase tracking-wider flex items-center gap-2">
          <span className="text-cb-orange">⚖</span>
          Asymmetry Edge
        </span>
        <span className={cn(
          "font-display text-lg tabular",
          riskRewardRatio >= 2 ? "text-cb-green" : riskRewardRatio >= 1 ? "text-cb-orange" : "text-cb-red"
        )}>
          {riskRewardRatio.toFixed(2)} : 1
        </span>
      </div>

      {/* THESIS KILLER Condition Banner */}
      <div className="p-4 bg-cb-red/10 border-2 border-cb-red/40 rounded-[10px] flex items-start gap-3">
        <span className="text-cb-red text-lg shrink-0 mt-0.5">⚠</span>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-tech text-[10px] font-bold text-cb-red tracking-wider uppercase">
              THESIS KILLER TRIGGER
            </span>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-[4px] bg-cb-red text-white font-bold border border-black uppercase">
              STRICT VETO
            </span>
          </div>
          <p className="font-sans text-xs text-bone leading-relaxed">
            &quot;{thesisKiller}&quot;
          </p>
        </div>
      </div>

      {/* Judge&apos;s Synthesis */}
      {summary && (
        <div className="space-y-2">
          <div className="font-tech text-[10px] font-bold text-cb-orange uppercase tracking-wider flex items-center gap-1.5">
            ⚖️ PRESIDING RULING SUMMARY
          </div>
          <p className="text-xs text-bone leading-relaxed font-sans">{summary}</p>
        </div>
      )}

      {/* Conditions for TRADE / Key Risks */}
      {outcome === "WATCH" && watchConditions && watchConditions.length > 0 && (
        <div className="space-y-2 text-xs">
          <div className="font-tech text-[10px] font-bold text-cb-amber uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-cb-amber">→</span> REQUIRED ENTRY TRIGGERS
          </div>
          <ul className="space-y-1.5">
            {watchConditions.map((c, i) => (
              <li key={i} className="text-raw-dim flex items-start gap-2 text-[11px]">
                <span className="text-cb-orange font-bold mt-0.5">▸</span>
                <span className="text-bone">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Target Recap */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono pt-1">
        {[
          { label: "Ref Price", value: fmtINR(thesis.entryPrice || evidencePack.quote.ltp), color: "text-bone" },
          { label: "Est. Target", value: fmtINR(thesis.target || evidencePack.quote.ltp * 1.08), color: "text-cb-green" },
          { label: "Floor Level", value: fmtINR(thesis.stopLoss || evidencePack.quote.ltp * 0.96), color: "text-cb-red" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-[8px] border-2 border-graphite bg-black py-2.5 px-1">
            <div className="text-raw-dim text-[9px] uppercase tracking-wider font-tech">{label}</div>
            <div className={cn("font-bold tabular mt-1 text-xs", color)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="text-[10px] text-raw-dim text-center pt-3 border-t-2 border-graphite font-mono uppercase tracking-wider">
        Pre-trade risk intelligence mandate · SEBI decision support · CBRPNK v2.6
      </div>
    </section>
  );
}
