"use client";

import type { EvidencePack } from "@/lib/types/evidence";
import { fmtINR, fmtPct } from "@/lib/utils/format";

interface StockCockpitProps {
  evidencePack: EvidencePack;
}

export function StockCockpit({ evidencePack }: StockCockpitProps) {
  const { quote, signals, regime, thesis, riskRewardRatio, warnings } = evidencePack;
  const isUp = quote.changePct >= 0;
  const trapDataUnavailable = signals.trapScore.summary === "Insufficient data.";

  return (
    <section className="rounded-[18px] bg-carbon border-2 border-graphite p-6 flex flex-col space-y-5 relative overflow-hidden transition-colors duration-200 hover:border-cb-orange/40" style={{ boxShadow: '4px 4px 0px 0px #262A34' }}>
      {/* Header Meta & Ticker */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="font-display text-3xl tracking-wider text-white">
              {thesis.instrument.symbol}
            </span>
            <span className="px-2.5 py-1 rounded-[6px] bg-black text-raw-dim font-mono text-[10px] uppercase border-2 border-graphite tracking-wider">
              {thesis.instrument.exchange}
            </span>
            <span className={`${quote.isLive ? "decal-green" : "decal-orange"} px-2 py-0.5 text-[9px]`}>
              {quote.isLive ? "LIVE QUOTE" : "DEMO ESTIMATE"}
            </span>
            <span className="decal-orange px-2 py-0.5 text-[9px]">
              ₹{thesis.positionSize.toLocaleString("en-IN")} ALLOCATED
            </span>
          </div>
          <p className="font-tech text-xs text-raw-dim tracking-wider uppercase truncate">
            {thesis.instrument.name} · {thesis.instrument.sector || "Equities"}
          </p>
        </div>

      </div>

      {/* Price and Target Metric Strip */}
      <div className="flex flex-col gap-4 pt-1 relative z-10 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-white tabular">
              {fmtINR(quote.ltp)}
            </span>
            <span
              className={`font-tech text-xs px-3 py-1 rounded-[6px] font-bold flex items-center gap-1.5 uppercase tracking-wider border-2 border-black ${
                isUp
                  ? "bg-cb-green text-white"
                  : "bg-cb-red text-white"
              }`}
              style={{ boxShadow: '2px 2px 0px 0px #000000' }}
            >
              <span>{isUp ? "▲" : "▼"}</span>
              <span>{fmtPct(quote.changePct)}</span>
            </span>
          </div>
          <p className={`font-mono text-[11px] pt-1.5 flex items-center gap-1.5 uppercase tracking-wider ${quote.isLive ? "text-cb-green" : "text-cb-amber"}`}>
            <span className={`w-2 h-2 rounded-full ${quote.isLive ? "bg-cb-green animate-pulse" : "bg-cb-amber"}`} />
            <span>{quote.isLive ? "Live Market Quote" : "Demo Estimate · Not a Current Quote"}</span>
            <span className="text-raw-dim">·</span>
            <span className="text-cb-amber">{regime.display}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="font-tech text-[10px] text-raw-dim uppercase tracking-widest block">
            Target Ceiling
          </span>
          <span className="font-display text-xl text-cb-amber tabular">
            {fmtINR(thesis.target || quote.ltp * 1.08)}
          </span>
        </div>
      </div>

      <section aria-label="Trade price levels" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          { label: "Reference price", value: fmtINR(thesis.entryPrice || quote.ltp), color: "text-white" },
          { label: "Target", value: fmtINR(thesis.target || quote.ltp * 1.08), color: "text-cb-green" },
          { label: "Stop loss", value: fmtINR(thesis.stopLoss || quote.ltp * 0.96), color: "text-cb-red" },
        ].map(({ label, value, color }) => (
          <div key={label} className="min-w-0 rounded-[10px] border-2 border-graphite bg-black p-3">
            <p className="font-tech text-[10px] text-raw-dim uppercase tracking-wider">{label}</p>
            <p className={`mt-1 break-words font-display text-lg tabular ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      {/* Key Metrics Grid (3 industrial cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col transition-colors hover:border-cb-green/50">
          <span className="font-tech text-[10px] text-raw-dim uppercase tracking-wider">Momentum</span>
          <span className="font-display text-lg text-cb-green pt-0.5">{signals.momentum.direction.toUpperCase()}</span>
          <span className="text-[9px] text-raw-dim font-mono">{signals.momentum.value.toFixed(0)}/100 score</span>
        </div>
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col transition-colors hover:border-cb-blue/50">
          <span className="font-tech text-[10px] text-raw-dim uppercase tracking-wider">Trap Probability</span>
          <span className="font-display text-lg text-cb-blue pt-0.5">
            {trapDataUnavailable ? "Unavailable" : signals.trapScore.value <= -50 ? "Elevated Risk" : signals.trapScore.value < -15 ? "Moderate Risk" : "Minimal Risk"}
          </span>
          <span className="text-[9px] text-raw-dim font-mono">{signals.trapScore.summary}</span>
        </div>
        <div className="bg-black border-2 border-graphite rounded-[10px] p-3 flex flex-col transition-colors hover:border-cb-orange/50">
          <span className="font-tech text-[10px] text-raw-dim uppercase tracking-wider">Asymmetry R:R</span>
          <span className="font-display text-lg text-cb-orange pt-0.5">{riskRewardRatio.toFixed(2)} : 1</span>
          <span className="text-[9px] text-raw-dim font-mono">Edge Multiplier</span>
        </div>
      </div>

      {/* Setup Significance Banner */}
      <div className="p-4 rounded-[12px] bg-black border-2 border-graphite flex items-start gap-3">
        <div className="w-10 h-10 rounded-[8px] bg-cb-orange/15 border border-cb-orange/30 flex items-center justify-center shrink-0 mt-0.5 text-cb-orange font-display text-lg">
          ✓
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-tech text-[10px] text-cb-orange tracking-wider uppercase font-bold">
              Setup Significance
            </span>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-[4px] bg-cb-orange text-black font-bold border border-black uppercase">
              HIGH PRIORITY
            </span>
          </div>
          <p className="text-raw-dim font-sans leading-relaxed">
            Evaluating allocation of <strong className="text-white font-mono">₹{thesis.positionSize.toLocaleString("en-IN")}</strong> towards{" "}
            <strong className="text-white font-mono">{fmtINR(thesis.target || quote.ltp * 1.08)}</strong> resistance. {signals.composite.summary}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2 pt-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs text-cb-amber font-mono bg-cb-amber/10 border-2 border-cb-amber/30 rounded-[10px] p-3 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-cb-amber font-bold">⚠</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
