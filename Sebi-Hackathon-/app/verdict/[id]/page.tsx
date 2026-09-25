"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TradeThesis } from "@/lib/types/thesis";
import { loadThesis } from "@/lib/utils/storage";
import { JuryRoom } from "@/components/verdict/JuryRoom";

export default function VerdictRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [thesis, setThesis] = useState<TradeThesis | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const t = loadThesis(id);
    if (t) {
      setThesis(t);
    } else {
      setNotFound(true);
    }
  }, [id]);

  return (
    <main className="min-h-screen bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      {/* Top Ticker Stream Bar */}
      <div className="border-b border-graphite bg-black px-6 py-2 flex items-center justify-between font-mono text-[10px] text-fog uppercase">
        <div className="flex items-center gap-4">
          <span className="text-cb-orange font-bold">● CHAMBER DELIBERATION STREAM</span>
          <span>ARBITRATION PROTOCOL V.2</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cb-green animate-pulse" />
          <span>REAL-TIME JUROR TELEMETRY</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cb-orange text-black font-tech font-bold text-sm flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
              VC
            </div>
            <span className="font-display text-2xl tracking-wide text-paper-white">
              THE VERDICT CHAMBER
            </span>
          </Link>
          <span className="text-graphite">/</span>
          {thesis ? (
            <span className="decal-orange text-[9px]">
              DOCKET: {thesis.instrument.symbol}
            </span>
          ) : (
            <span className="decal-dark text-[9px]">
              DELIBERATION SESSION
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 text-xs font-tech tracking-wider uppercase">
          <Link
            href="/verdict/new"
            className="text-fog hover:text-cb-orange transition-colors"
          >
            [+] NEW INQUIRY
          </Link>
          <Link
            href="/verdict/history"
            className="text-fog hover:text-cb-orange transition-colors"
          >
            JOURNAL
          </Link>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6 py-10">
        {notFound ? (
          <div className="neo-card text-center py-20 space-y-4 max-w-lg mx-auto bg-raw-surface">
            <div className="text-4xl">🔍</div>
            <h2 className="font-display text-3xl text-paper-white">DOCKET RECORD NOT FOUND</h2>
            <p className="text-sm font-sans text-fog leading-relaxed">
              This deliberation record may have expired or was submitted in another browser profile.
            </p>
            <div className="pt-2">
              <Link href="/verdict/new" className="neo-btn-primary inline-flex text-xs">
                SUBMIT NEW ASSESSMENT &rarr;
              </Link>
            </div>
          </div>
        ) : thesis ? (
          <>
            {/* Header info */}
            <header className="mb-8 border-b-2 border-graphite pb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="decal-orange">ACTIVE DOCKET</span>
                <span className="font-mono text-xs text-fog uppercase">
                  {thesis.instrument.exchange}:{thesis.instrument.symbol} &middot; ₹{thesis.positionSize.toLocaleString("en-IN")} CAPITAL COMMITMENT
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl text-paper-white flex flex-wrap items-baseline gap-4">
                <span>{thesis.instrument.name}</span>
                <span className="font-tech text-sm px-3 py-1 bg-cb-green text-white border-2 border-black rounded-md font-bold uppercase">
                  EQUITY PURSUIT
                </span>
              </h1>
            </header>

            <JuryRoom thesis={thesis} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="text-4xl animate-pulse-soft">⚖️</div>
            <div className="text-fog font-tech text-base tracking-widest uppercase">CONVENING THE CHAMBER…</div>
          </div>
        )}
      </div>
    </main>
  );
}
