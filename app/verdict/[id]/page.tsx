"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MoneyDecision } from "@/lib/validation/decision";
import { BILLING_LABELS } from "@/lib/validation/decision";
import { loadDecision } from "@/lib/utils/storage";
import { fmtUSD } from "@/lib/utils/format";
import { JuryRoom } from "@/components/verdict/JuryRoom";

export default function ReviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<MoneyDecision | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const d = loadDecision(id);
    if (d) setDecision(d);
    else setNotFound(true);
  }, [id]);

  return (
    <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cb-orange text-black font-tech font-bold text-sm flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
              VP
            </div>
            <span className="font-display text-2xl tracking-wide text-paper-white">VERDICTPAY</span>
          </Link>
          <span className="text-graphite">/</span>
          <span className="decal-orange text-[9px]">REVIEW IN SESSION</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-tech tracking-wider uppercase">
          <Link href="/verdict/new" className="text-fog hover:text-cb-orange transition-colors">[+] NEW REVIEW</Link>
          <Link href="/verdict/history" className="text-fog hover:text-cb-orange transition-colors">HISTORY</Link>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6 py-10">
        {notFound ? (
          <div className="neo-card text-center py-20 space-y-4 max-w-lg mx-auto bg-raw-surface">
            <h2 className="font-display text-3xl text-paper-white">DECISION NOT FOUND</h2>
            <p className="text-sm font-sans text-fog leading-relaxed">
              Decisions are stored in this browser only. This one may have been submitted in another browser profile.
            </p>
            <Link href="/verdict/new" className="neo-btn-primary inline-flex text-xs">START A NEW REVIEW &rarr;</Link>
          </div>
        ) : decision ? (
          <>
            <header className="mb-8 border-b-2 border-graphite pb-6">
              <div className="mb-2 font-mono text-xs uppercase text-fog">
                {decision.merchant} &middot; {fmtUSD(decision.amount)} &middot; {BILLING_LABELS[decision.billing]}
              </div>
              <h1 className="font-display text-4xl sm:text-6xl text-paper-white">{decision.title}</h1>
            </header>

            <JuryRoom decision={decision} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="text-4xl animate-pulse-soft">⚖️</div>
            <div className="text-fog font-tech text-base tracking-widest uppercase">CONVENING THE PANEL…</div>
          </div>
        )}
      </div>
    </main>
  );
}
