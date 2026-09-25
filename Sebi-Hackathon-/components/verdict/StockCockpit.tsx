"use client";

import { useState } from "react";
import type { EvidencePack } from "@/lib/types/evidence";
import { fmtINR, fmtPct } from "@/lib/utils/format";

interface StockCockpitProps {
  evidencePack: EvidencePack;
}

export function StockCockpit({ evidencePack }: StockCockpitProps) {
  const [timeframe, setTimeframe] = useState<"1M" | "3M">("1M");
  const { quote, signals, regime, thesis, riskRewardRatio, warnings } = evidencePack;
  const isUp = quote.changePct >= 0;

  // Calculate curve points for SVG based on 52W and current price
  const range = Math.max(1, quote.week52High - quote.week52Low);
  const currentRatio = Math.max(0, Math.min(1, (quote.ltp - quote.week52Low) / range));
  const currentY = Math.round(75 - currentRatio * 55);

  // Dynamic path based on timeframe selection for visual reactivity
  const sparklineD = timeframe === "1M"
    ? `M 0 75 C 40 70, 70 78, 110 65 C 160 50, 190 60, 240 42 C 280 30, 310 26, 335 ${currentY}`
    : `M 0 82 C 35 78, 65 84, 100 68 C 145 58, 185 64, 230 46 C 275 36, 305 32, 335 ${currentY}`;

  return (
    <section className="rounded-[18px] bg-carbon border-2 border-graphite p-6 flex flex-col space-y-5 relative overflow-hidden transition-all duration-200 hover:border-cb-orange/40" style={{ boxShadow: '4px 4px 0px 0px #262A34' }}>
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
            <span className="decal-green px-2 py-0.5 text-[9px]">
              LIVE TELEMETRY
            </span>
            <span className="decal-orange px-2 py-0.5 text-[9px]">
              ₹{thesis.positionSize.toLocaleString("en-IN")} ALLOCATED
            </span>
          </div>
          <p className="font-tech text-xs text-raw-dim tracking-wider uppercase truncate">
            {thesis.instrument.name} · {thesis.instrument.sector || "Equities"}
          </p>
        </div>

        {/* Timeframe Toggle Tabs */}
        <div className="flex p-0.5 rounded-[8px] bg-black border-2 border-graphite shrink-0" role="tablist">
          <button
            className={`px-3.5 py-1.5 rounded-[6px] font-tech text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              timeframe === "1M"
                ? "bg-cb-orange text-black"
                : "text-raw-dim hover:text-white"
            }`}
            onClick={() => setTimeframe("1M")}
            type="button"
          >
            1M
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-[6px] font-tech text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              timeframe === "3M"
                ? "bg-cb-orange text-black"
                : "text-raw-dim hover:text-white"
            }`}
            onClick={() => setTimeframe("3M")}
            type="button"
          >
            3M
          </button>
        </div>
      </div>

      {/* Price and Target Metric Strip */}
      <div className="flex items-baseline justify-between pt-1 relative z-10">
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
          <p className="font-mono text-[11px] text-cb-green pt-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cb-green animate-pulse" />
            <span>{quote.isLive ? "Live Market Stream" : "Deterministic Telemetry Snapshot"}</span>
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

      {/* SVG Interactive Trajectory Graphic */}
      <div className="w-full relative h-28 pt-1 border-2 border-graphite rounded-[12px] bg-black p-2 overflow-hidden">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 340 90">
          <defs>
            <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "#5B8E69" : "#D64038"} stopOpacity="0.35" />
              <stop offset="65%" stopColor={isUp ? "#5B8E69" : "#D64038"} stopOpacity="0.08" />
              <stop offset="100%" stopColor={isUp ? "#5B8E69" : "#D64038"} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Target Boundary Line */}
          <line
            opacity="0.65"
            stroke="#F2A900"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1="0"
            x2="340"
            y1="18"
            y2="18"
          />
          <text
            fill="#F2A900"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
            textAnchor="end"
            x="338"
            y="14"
          >
            TARGET LEVEL {fmtINR(thesis.target || quote.ltp * 1.08)}
          </text>

          {/* Stop Loss Floor */}
          <line
            opacity="0.5"
            stroke="#D64038"
            strokeDasharray="2 2"
            strokeWidth="1"
            x1="0"
            x2="340"
            y1="78"
            y2="78"
          />
          <text
            fill="#D64038"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
            textAnchor="start"
            x="4"
            y="86"
          >
            STOP FLOOR {fmtINR(thesis.stopLoss || quote.ltp * 0.96)}
          </text>

          {/* Dynamic Area Under Curve */}
          <path
            d={`${sparklineD} L 335 90 L 0 90 Z`}
            fill="url(#chartGrad)"
            className="transition-all duration-500 ease-out"
          />

          {/* Dynamic Trajectory Stroke */}
          <path
            d={sparklineD}
            fill="none"
            stroke={isUp ? "#5B8E69" : "#D64038"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            className="transition-all duration-500 ease-out"
          />

          {/* 52W Range Markers */}
          <circle cx="50" cy="78" fill="#090A0D" r="3" stroke="#3370FF" strokeWidth="1.5" />
          <text fill="#8E93A0" fontFamily="JetBrains Mono" fontSize="7" x="50" y="86">
            52W Low: {fmtINR(quote.week52Low)}
          </text>

          {/* Current Breakout Point Anchor */}
          <circle cx="335" cy={currentY} fill="#E28743" r="4" stroke="#000000" strokeWidth="2" />
          <circle className="animate-ping" cx="335" cy={currentY} fill="#E28743" opacity="0.3" r="7" />
        </svg>
      </div>

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
            {signals.trapScore.value < -30 ? "Minimal Risk" : "Elevated Risk"}
          </span>
          <span className="text-[9px] text-raw-dim font-mono">Volume &amp; Price Alignment</span>
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
