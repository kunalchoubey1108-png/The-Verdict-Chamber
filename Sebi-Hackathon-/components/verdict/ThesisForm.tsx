"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { thesisSchema, type ThesisFormValues } from "@/lib/validation/thesis";
import { POPULAR_INSTRUMENTS, type InstrumentRef } from "@/lib/types/thesis";
import type { TradeThesis } from "@/lib/types/thesis";
import { saveThesis } from "@/lib/utils/storage";

const QUICK_AMOUNTS = [
  { label: "₹10,000", val: 10000 },
  { label: "₹25,000", val: 25000 },
  { label: "₹50,000", val: 50000 },
  { label: "₹1,00,000", val: 100000 },
  { label: "₹2,50,000", val: 250000 },
  { label: "₹5,00,000", val: 500000 },
];

export function ThesisForm() {
  const router = useRouter();
  const [instrumentQuery, setInstrumentQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInst, setSelectedInst] = useState<InstrumentRef | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ThesisFormValues>({
    resolver: zodResolver(thesisSchema),
    defaultValues: {
      positionSize: 50000,
      direction: "LONG",
      horizon: "swing",
    },
  });

  const positionSize = watch("positionSize");

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter instruments with smart match
  const filteredInstruments = POPULAR_INSTRUMENTS.filter(
    (i) =>
      i.symbol.toLowerCase().includes(instrumentQuery.toLowerCase()) ||
      i.name.toLowerCase().includes(instrumentQuery.toLowerCase()) ||
      (i.sector && i.sector.toLowerCase().includes(instrumentQuery.toLowerCase()))
  );

  function selectInstrument(inst: InstrumentRef) {
    setSelectedInst(inst);
    setValue("instrument", inst, { shouldValidate: true });
    setInstrumentQuery(`${inst.symbol} · ${inst.name}`);
    setShowDropdown(false);
  }

  async function onSubmit(data: ThesisFormValues) {
    setSubmitting(true);
    try {
      const thesis: TradeThesis = {
        ...data,
        id: nanoid(10),
        createdAt: new Date().toISOString(),
        direction: "LONG",
        rationale: `Proposed purchase allocation of ₹${data.positionSize.toLocaleString("en-IN")} into ${data.instrument.name} (${data.instrument.symbol}).`,
      };
      saveThesis(thesis);
      router.push(`/verdict/${thesis.id}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      {/* 1. SELECT STOCK */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-2">
          <label className="vc-label m-0 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-copper/20 text-copper flex items-center justify-center font-mono text-[11px] font-bold">1</span>
            <span>Select Target Stock / Asset</span>
          </label>
          <span className="text-[10px] font-mono text-copper bg-copper/10 px-2 py-0.5 rounded-full border border-copper/20">
            NSE &middot; BSE Equities &amp; ETFs
          </span>
        </div>

        <div className="relative group">
          <input
            type="text"
            className="vc-input pl-11 pr-10 font-sans text-sm focus:ring-1 focus:ring-copper/30"
            placeholder="Search ticker or company (e.g. RELIANCE, TCS, HDFCBANK)…"
            value={instrumentQuery}
            onChange={(e) => {
              setInstrumentQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-fog text-[19px] transition-colors group-focus-within:text-copper">
            search
          </span>
          {instrumentQuery && (
            <button
              type="button"
              onClick={() => {
                setInstrumentQuery("");
                setSelectedInst(null);
                setShowDropdown(true);
              }}
              className="absolute right-3.5 top-3.5 text-ash hover:text-paper-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        {errors.instrument?.symbol && (
          <p className="vc-error">{errors.instrument.symbol.message}</p>
        )}

        {/* Autocomplete Dropdown with Smooth Animation */}
        {showDropdown && filteredInstruments.length > 0 && (
          <div className="absolute z-30 w-full mt-2 rounded-xl border border-graphite bg-carbon/95 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-graphite/40 animate-slide-down max-h-72 overflow-y-auto">
            {filteredInstruments.map((inst) => (
              <button
                key={inst.symbol}
                type="button"
                className="w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-surface-bright/70 transition-all group"
                onClick={() => selectInstrument(inst)}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-mono font-bold text-xs text-copper border border-graphite group-hover:border-copper/40 transition-colors shrink-0">
                  {inst.symbol.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-sm text-paper-white flex items-center gap-2">
                    <span>{inst.symbol}</span>
                    <span className="text-[10px] font-normal text-fog px-1.5 py-0.2 rounded border border-graphite/60">
                      {inst.exchange}
                    </span>
                  </div>
                  <div className="text-xs text-fog truncate group-hover:text-silver transition-colors">
                    {inst.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-copper bg-copper/10 border border-copper/20 rounded-full px-2 py-0.5">
                    {inst.sector || inst.assetClass}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Stock Live Card Preview */}
      {selectedInst && (
        <div className="p-4 rounded-xl border border-copper/30 bg-copper/5 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-copper/15 flex items-center justify-center text-copper">
              <span className="material-symbols-outlined text-[22px]">domain</span>
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-paper-white flex items-center gap-2">
                <span>{selectedInst.symbol}</span>
                <span className="text-[10px] font-normal text-fog px-2 py-0.5 rounded-full border border-copper/20 bg-carbon">
                  {selectedInst.exchange}
                </span>
              </div>
              <div className="text-xs text-silver mt-0.5">{selectedInst.name} &middot; <span className="text-copper">{selectedInst.sector}</span></div>
            </div>
          </div>
          <span className="text-xs font-mono text-tertiary flex items-center gap-1.5 shrink-0 bg-tertiary/10 border border-tertiary/25 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            Telemetry Ready
          </span>
        </div>
      )}

      {/* 2. CAPITAL ALLOCATION */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="vc-label m-0 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-copper/20 text-copper flex items-center justify-center font-mono text-[11px] font-bold">2</span>
            <span>Proposed Capital to Commit</span>
          </label>
          <span className="text-[11px] font-mono text-bone font-semibold tabular">
            ₹{(positionSize || 0).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="relative group">
          <input
            type="number"
            step="1000"
            className="vc-input pl-10 pr-4 font-mono text-base font-semibold tracking-wide"
            placeholder="e.g. 50000"
            {...register("positionSize", { valueAsNumber: true })}
          />
          <span className="absolute left-4 top-3 font-mono text-fog font-bold text-sm group-focus-within:text-copper transition-colors">
            ₹
          </span>
        </div>
        {errors.positionSize && (
          <p className="vc-error">{errors.positionSize.message}</p>
        )}

        {/* Quick Amount Preset Chips with smooth scaling */}
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_AMOUNTS.map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setValue("positionSize", item.val, { shouldValidate: true })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono border transition-all duration-200 active:scale-95 ${
                positionSize === item.val
                  ? "bg-copper/20 text-copper border-copper shadow-sm shadow-copper/10 scale-105"
                  : "bg-carbon/70 text-fog border-graphite hover:text-paper-white hover:border-slate hover:bg-carbon"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope of AI Cross-Examination */}
      <div className="p-4.5 rounded-xl border border-graphite/70 bg-carbon/50 space-y-2.5">
        <div className="text-[11px] font-mono font-bold text-copper uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">balance</span>
          Deliberation Protocol
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-surface/60 border border-graphite/40 space-y-1">
            <div className="text-[11px] font-mono text-paper-white font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Stock Behaviour
            </div>
            <p className="text-[11px] text-fog leading-relaxed">
              Order flow pressure, 52W range momentum, and trap detection.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface/60 border border-graphite/40 space-y-1">
            <div className="text-[11px] font-mono text-paper-white font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Purchase Timing
            </div>
            <p className="text-[11px] text-fog leading-relaxed">
              Is deploying capital today wise, or is waiting for a dip optimal?
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface/60 border border-graphite/40 space-y-1">
            <div className="text-[11px] font-mono text-paper-white font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Market State
            </div>
            <p className="text-[11px] text-fog leading-relaxed">
              Nifty 50 macro regime and near-term liquidity headwinds.
            </p>
          </div>
        </div>
      </div>

      {/* Convene Jury CTA Button */}
      <button
        type="submit"
        disabled={submitting}
        className="vc-btn-primary w-full justify-center py-4 text-sm font-semibold uppercase tracking-wider shadow-lg hover:shadow-paper-white/10 active:scale-[0.99] transition-all"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="ml-1 font-mono text-xs">Assembling Jury Panel…</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>Convene AI Jury Assessment</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        )}
      </button>

      <p className="text-[11px] text-fog text-center leading-relaxed font-sans">
        Pre-trade risk intelligence mandate &middot; Does not execute trades or handle investor funds
      </p>
    </form>
  );
}
