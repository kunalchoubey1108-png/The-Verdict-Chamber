import Link from "next/link";
import { ThesisForm } from "@/components/verdict/ThesisForm";

export const metadata = {
  title: "Evaluate Purchase — The Verdict Chamber",
  description: "Select a stock and allocation amount to evaluate purchase wisdom and near-future market state.",
};

export default function NewThesisPage() {
  return (
    <main className="min-h-screen bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      {/* Top Technical Bar */}
      <div className="border-b border-graphite bg-black px-6 py-2 flex items-center justify-between font-mono text-[10px] text-fog uppercase">
        <div className="flex items-center gap-4">
          <span className="text-cb-orange font-bold">● DOCKET // INPUT_MODULE</span>
          <span>ARBITRATION PROTOCOL: V.2</span>
        </div>
        <div className="hidden sm:block">STATUS: READY FOR TELEMETRY</div>
      </div>

      {/* Nav */}
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 flex items-center justify-between max-w-[1280px] mx-auto w-full">
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
          <span className="decal-orange text-[9px]">
            PURCHASE ARBITRATION
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-tech tracking-wider uppercase">
          <Link
            href="/verdict/history"
            className="text-fog hover:text-cb-orange transition-colors"
          >
            [01] AUDIT JOURNAL
          </Link>
          <Link
            href="/"
            className="text-fog hover:text-cb-orange transition-colors"
          >
            [02] DIGITAL TWIN
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="decal-green">TS26 CERTIFIED</span>
            <span className="font-mono text-xs text-fog">PRE-TRADE MANDATE</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-paper-white tracking-wide uppercase">
            EVALUATE STOCK PURCHASE
          </h1>
          <p className="font-sans text-fog text-sm sm:text-base leading-relaxed pt-1">
            Specify the asset and intended capital. The 5-agent jury will dissect the stock's order flow, judge whether buying now is wise, and forecast near-term market turbulence.
          </p>
        </header>

        {/* Form Container with Industrial Border */}
        <div className="neo-card bg-raw-surface p-6 sm:p-8">
          <ThesisForm />
        </div>

        {/* 3 Deliberation Pillars: Industrial Tag Decals */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="neo-tag-green p-4 space-y-1">
            <div className="font-tech text-xs font-bold uppercase tracking-wider">01 // STOCK BEHAVIOUR</div>
            <p className="font-sans text-[11px] leading-relaxed opacity-90">
              Scrutinizes volume exhaustion, 52W range extremes, and traps.
            </p>
          </div>
          <div className="neo-tag-orange p-4 space-y-1">
            <div className="font-tech text-xs font-bold uppercase tracking-wider">02 // PURCHASE WISDOM</div>
            <p className="font-sans text-[11px] leading-relaxed text-black/90">
              Evaluates if allocating this capital right now is wise or premature.
            </p>
          </div>
          <div className="neo-tag-light p-4 space-y-1">
            <div className="font-tech text-xs font-bold uppercase tracking-wider">03 // MARKET STATE</div>
            <p className="font-sans text-[11px] leading-relaxed text-black/90">
              Nifty 50 macro trajectory and near-term liquidity headwinds.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
