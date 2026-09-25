"use client";

import type { EvidencePack, SignalDirection } from "@/lib/types/evidence";
import { cn } from "@/lib/utils/cn";
import { fmtINR, fmtPct } from "@/lib/utils/format";

interface EvidenceSummaryProps {
  evidencePack: EvidencePack;
}

function SignalPill({
  label,
  direction,
  extra,
}: {
  label: string;
  direction: SignalDirection | string;
  extra?: string;
}) {
  const chipClass =
    direction === "bullish" || direction === "trending-up"
      ? "signal-bullish"
      : direction === "bearish" || direction === "trending-down"
      ? "signal-bearish"
      : direction === "risk-off"
      ? "signal-warn"
      : "signal-neutral";

  const dot =
    direction === "bullish" || direction === "trending-up"
      ? "▲"
      : direction === "bearish" || direction === "trending-down"
      ? "▼"
      : "●";

  return (
    <span className={chipClass}>
      <span className="opacity-70 text-[9px]">{dot}</span>
      <span>{label}</span>
      {extra && <span className="opacity-60 ml-1 font-mono">{extra}</span>}
    </span>
  );
}

export function EvidenceSummary({ evidencePack }: EvidenceSummaryProps) {
  const { quote, signals, regime, thesis, riskRewardRatio, warnings } = evidencePack;
  const isUp = quote.changePct >= 0;

  return (
    <div className="space-y-3 font-sans">
      {/* Main Evidence Bar */}
      <div className="evidence-bar bg-onyx border-graphite justify-between">
        {/* Quote & Trend */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-normal text-paper-white tabular">
              {fmtINR(quote.ltp)}
            </span>
            <span
              className={cn(
                "text-xs font-semibold tabular font-sans",
                isUp ? "text-good" : "text-critical"
              )}
            >
              {fmtPct(quote.changePct)}
            </span>
          </div>
          {!quote.isLive && (
            <span className="text-[10px] uppercase tracking-wider text-fog border border-graphite rounded-full px-2 py-0.5">
              Snapshot Feed
            </span>
          )}
        </div>

        {/* Signal Chips (Pills) */}
        <div className="flex flex-wrap items-center gap-2">
          <SignalPill
            label={`Momentum: ${signals.momentum.direction}`}
            direction={signals.momentum.direction}
          />
          <SignalPill
            label={`Volume: ${signals.volumeAnomaly.direction}`}
            direction={signals.volumeAnomaly.direction}
          />
          <SignalPill
            label={`Trap: ${signals.trapScore.value < -30 ? "Minimal" : signals.trapScore.value < 0 ? "Moderate" : "Elevated"}`}
            direction={signals.trapScore.value < -30 ? "bullish" : signals.trapScore.value < 0 ? "neutral" : "bearish"}
          />
          <SignalPill
            label={`Regime: ${regime.display}`}
            direction={regime.label}
          />
          <span className="signal-chip text-copper border-copper/30">
            Composite: {signals.composite.value.toFixed(0)}/100
          </span>
        </div>

        {/* Asymmetry Metrics */}
        <div className="text-xs text-fog flex items-center gap-2">
          <span className="uppercase tracking-wider text-[11px]">Edge:</span>
          <span className={cn(
            "font-serif text-base font-normal tabular",
            riskRewardRatio >= 2 ? "text-good" : riskRewardRatio >= 1 ? "text-copper" : "text-critical"
          )}>
            {riskRewardRatio.toFixed(2)}:1
          </span>
        </div>
      </div>

      {/* 52W Range Track with Gilded Accent */}
      <div className="flex items-center gap-3 text-xs text-fog px-1">
        <span className="tabular text-steel">{fmtINR(quote.week52Low)}</span>
        <div className="flex-1 h-1 rounded-full bg-graphite relative overflow-hidden">
          <div
            className="absolute top-0 bottom-0 left-0 bg-slate rounded-full"
            style={{
              width: `${Math.max(5, Math.min(100, ((quote.ltp - quote.week52Low) / Math.max(1, quote.week52High - quote.week52Low)) * 100))}%`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-copper rounded-full -translate-x-1/2"
            style={{
              left: `${Math.max(0, Math.min(100, ((quote.ltp - quote.week52Low) / Math.max(1, quote.week52High - quote.week52Low)) * 100))}%`,
            }}
          />
        </div>
        <span className="tabular text-steel">{fmtINR(quote.week52High)}</span>
        <span className="text-[10px] uppercase tracking-wider text-ash">52W Position</span>
      </div>

      {/* Data Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs text-copper bg-carbon border border-copper/20 rounded-[8px] px-4 py-2.5"
            >
              <span className="text-copper">⚠</span>
              <span className="text-silver leading-relaxed">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
