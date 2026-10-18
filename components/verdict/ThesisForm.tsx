"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { thesisSchema, type ThesisFormValues } from "@/lib/validation/thesis";
import { POPULAR_INSTRUMENTS, type InstrumentRef } from "@/lib/types/thesis";
import type { TradeThesis } from "@/lib/types/thesis";
import { consumePortfolioHandoff, saveThesis } from "@/lib/utils/storage";

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
  const [storageError, setStorageError] = useState<string | null>(null);
  const [selectedInst, setSelectedInst] = useState<InstrumentRef | null>(null);
  const [portfolioSnapshot, setPortfolioSnapshot] = useState<TradeThesis["portfolioSnapshot"]>();
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

  useEffect(() => {
    const handoff = consumePortfolioHandoff();
    if (!handoff) return;
    const alias: Record<string, string> = { TMPV: "TATAMOTORS" };
    const requestedSymbol = alias[handoff.symbol] ?? handoff.symbol;
    const instrument = POPULAR_INSTRUMENTS.find(
      (candidate) => candidate.symbol.toUpperCase() === requestedSymbol.toUpperCase()
    );
    if (instrument) {
      setSelectedInst(instrument);
      setValue("instrument", instrument, { shouldValidate: true });
      setInstrumentQuery(`${instrument.symbol} · ${instrument.name}`);
    } else {
      setInstrumentQuery(handoff.symbol);
    }
    setValue("positionSize", handoff.positionSize, { shouldValidate: true });
    setPortfolioSnapshot(handoff.portfolioSnapshot);
  }, [setValue]);

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
        portfolioSnapshot,
        rationale: `Proposed purchase allocation of ₹${data.positionSize.toLocaleString("en-IN")} into ${data.instrument.name} (${data.instrument.symbol}).`,
      };
      if (!saveThesis(thesis)) {
        setStorageError("This browser could not save your review. Enable site storage and try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/verdict/${thesis.id}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {storageError && <p className="vc-error" role="alert">{storageError}</p>}
      {/* 1. SELECT STOCK */}
      <section className="relative" ref={dropdownRef} aria-labelledby="instrument-section-title">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4 border-b-2 border-graphite pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cb-orange mb-1">01 // Instrument</div>
            <h2 id="instrument-section-title" className="font-tech text-lg uppercase tracking-wide text-paper-white">Select a stock or ETF</h2>
          </div>
          <span className="decal-dark text-[9px]">NSE · BSE · EQUITIES &amp; ETFs</span>
        </div>

        <div className="relative border-2 border-graphite bg-black focus-within:border-cb-orange transition-colors">
          <label htmlFor="instrument-search" className="sr-only">Search stocks and ETFs</label>
          <input
            id="instrument-search"
            type="text"
            className="w-full bg-transparent text-paper-white font-mono text-sm px-12 py-4 placeholder:text-fog/70 focus:outline-none"
            placeholder="SEARCH BY TICKER OR COMPANY NAME…"
            value={instrumentQuery}
            onChange={(e) => {
              setInstrumentQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
            aria-describedby="instrument-help"
          />
          <span aria-hidden="true" className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-cb-orange text-[19px]">
            search
          </span>
          {instrumentQuery && (
            <button
              type="button"
              onClick={() => {
                setInstrumentQuery("");
                setSelectedInst(null);
                setShowDropdown(true);
                const input = document.getElementById('instrument-search');
                input?.focus();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-fog hover:text-cb-orange transition-colors p-1"
              aria-label="Clear instrument selection"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        {errors.instrument?.symbol && (
          <p className="vc-error">{errors.instrument.symbol.message}</p>
        )}

        <p id="instrument-help" className="mt-2 font-mono text-[10px] text-fog uppercase tracking-wide">Search the available market universe by ticker, company, or sector.</p>
        {showDropdown && filteredInstruments.length > 0 && (
          <div className="mt-2 border-2 border-graphite bg-raw-bg divide-y divide-graphite max-h-64 overflow-y-auto">
            {filteredInstruments.map((inst) => (
              <button
                key={inst.symbol}
                type="button"
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-cb-orange/10 focus-visible:bg-cb-orange/10 focus-visible:outline-none transition-colors group"
                onClick={() => selectInstrument(inst)}
              >
                <div className="w-10 h-10 bg-cb-orange text-black border-2 border-black shadow-brutal flex items-center justify-center font-display text-lg shrink-0">
                  {inst.symbol.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-sm text-paper-white flex items-center gap-2 flex-wrap">
                    <span>{inst.symbol}</span>
                    <span className="decal-dark text-[9px]">
                      {inst.exchange}
                    </span>
                  </div>
                  <div className="text-xs text-fog truncate mt-0.5">
                    {inst.name}
                  </div>
                </div>
                <span className="hidden sm:block font-mono text-[9px] uppercase tracking-wider text-cb-orange text-right max-w-28">{inst.sector || inst.assetClass}</span>
                <span aria-hidden="true" className="font-mono text-cb-orange">↗</span>
              </button>
            ))}
          </div>
        )}
        {showDropdown && filteredInstruments.length === 0 && instrumentQuery.trim() && (
          <p className="mt-2 border border-cb-red/60 bg-cb-red/10 p-3 font-mono text-xs text-paper-white" role="status">NO MATCH FOUND // Try a ticker, company name, or sector.</p>
        )}

      {/* Selected instrument docket */}
      {selectedInst && (
        <div className="mt-4 border-2 border-cb-orange bg-black p-4 sm:p-5 shadow-brutal animate-fade-scale" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-cb-orange text-black border-2 border-black flex items-center justify-center font-display text-xl shadow-brutal">
                {selectedInst.symbol.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-mono font-bold text-lg text-paper-white flex items-center gap-2">
                  <span>{selectedInst.symbol}</span>
                  <span className="decal-dark text-[9px]">{selectedInst.exchange}</span>
                </div>
                <div className="text-xs text-fog mt-0.5">{selectedInst.name}</div>
              </div>
            </div>
            <span className="decal-green text-[9px]">{selectedInst.assetClass}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-wider">
            <div><span className="block text-fog mb-1">Sector</span><span className="text-cb-orange">{selectedInst.sector || "Exchange traded"}</span></div>
            <div><span className="block text-fog mb-1">Review status</span><span className="text-cb-green">READY FOR JURY</span></div>
          </div>
        </div>
      )}
      </section>

      {/* 2. CAPITAL ALLOCATION */}
      <section aria-labelledby="allocation-section-title">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4 border-b-2 border-graphite pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cb-orange mb-1">02 // Exposure</div>
            <h2 id="allocation-section-title" className="font-tech text-lg uppercase tracking-wide text-paper-white">Set your capital allocation</h2>
          </div>
          <div className="text-right"><span className="block font-mono text-[9px] uppercase tracking-widest text-fog">Proposed commitment</span><span className="font-mono font-bold text-xl text-cb-orange tabular">₹{(positionSize || 0).toLocaleString("en-IN")}</span></div>
        </div>

        <div className="relative border-2 border-graphite bg-black focus-within:border-cb-orange transition-colors">
          <input
            type="number"
            aria-label="Proposed capital amount in rupees"
            step="1000"
            className="w-full bg-transparent text-paper-white font-mono text-2xl font-bold tabular px-12 py-4 placeholder:text-fog/60 focus:outline-none"
            placeholder="50000"
            {...register("positionSize", { valueAsNumber: true })}
          />
          <span aria-hidden="true" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cb-orange font-display text-2xl">
            ₹
          </span>
        </div>
        {errors.positionSize && (
          <p className="vc-error">{errors.positionSize.message}</p>
        )}

        <div className="mt-3 font-mono text-[9px] uppercase tracking-widest text-fog">Select a commitment</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {QUICK_AMOUNTS.map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setValue("positionSize", item.val, { shouldValidate: true })}
              aria-pressed={positionSize === item.val}
              className={`px-3 py-3 text-xs font-mono font-bold border-2 uppercase tracking-wide transition-colors ${
                positionSize === item.val
                  ? "bg-cb-orange text-black border-black shadow-brutal"
                  : "bg-raw-surface text-fog border-graphite hover:text-paper-white hover:border-cb-orange"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

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

<button
  type="submit"
  disabled={submitting}
  className="vc-btn-primary w-full py-4 text-sm font-semibold uppercase tracking-wider shadow-lg hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:scale-95 transition-[color,background-color,border-color,box-shadow,scale,transform] disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? (
    <span className="flex items-center gap-2">
      {/* SVG spinner */}
      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
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
