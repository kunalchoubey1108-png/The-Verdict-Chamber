import Link from "next/link";
import Script from "next/script";
import { APP_MARKUP } from "./appMarkup";

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-raw-bg text-bone flex flex-col grid-bg selection:bg-cb-orange selection:text-black">
        {/* TOP TECHNICAL TICKER RIBBON */}
        <div className="ticker-wrap border-b border-graphite bg-black flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-6 font-mono text-[11px] text-fog animate-ticker">
            <span className="flex items-center gap-1 text-cb-orange font-bold">
              <span>●</span> VERDICT CHAMBER // SYS_VER_2.4.0
            </span>
            <span>DATA FEED: NSE/BSE REAL-TIME SYNCHRONIZED</span>
            <span>ARBITRATION PROTOCOL: ADVERSARIAL MULTI-AGENT</span>
            <span>DISCLAIMER: PRE-TRADE AUDIT ONLY</span>
            <span className="text-cb-green font-bold">ALL 5 LLM JURORS ONLINE</span>
          </div>
        </div>

        {/* BRUTALIST INDUSTRIAL NAVIGATION BAR */}
        <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 sticky top-0 z-30">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cb-orange text-black font-tech font-black text-xl flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
                VC
              </div>
              <div className="flex flex-col">
                <span className="font-display tracking-wider text-2xl text-paper-white leading-none">
                  THE VERDICT CHAMBER
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-cb-orange font-semibold">
                  PRE-TRADE RISK ARBITRATION
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-tech text-xs tracking-wider uppercase">
              <Link
                href="/verdict/history"
                className="text-fog hover:text-cb-orange transition-colors flex items-center gap-1.5"
              >
                <span>[01] AUDIT JOURNAL</span>
              </Link>
              <a
                href="#portfolio"
                className="text-fog hover:text-cb-orange transition-colors flex items-center gap-1.5"
              >
                <span>[02] DIGITAL TWIN</span>
              </a>
              <Link
                href="/verdict/new"
                className="neo-btn-primary text-xs px-5 py-2.5"
              >
                <span>LAUNCH DOCKET</span>
                <span className="font-mono text-sm">&rarr;</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO SECTION WITH INDUSTRIAL POSTER ARCHITECTURE */}
        <section className="flex-1 max-w-[1280px] mx-auto px-6 py-16 sm:py-24 w-full">
          {/* Top Decal Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b-2 border-graphite">
            <div className="flex items-center gap-2">
              <span className="decal-orange">SYS.570-B</span>
              <span className="decal-dark">STOCK &middot; ALLOCATION &middot; FATE</span>
            </div>
            <div className="font-mono text-xs text-fog uppercase tracking-widest">
              DPM SYSTM &copy;2026 // NSE EQUITIES DELIBERATION
            </div>
          </div>

          {/* Main Giant Headline: BRUTALIST POSTER STYLE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-10 items-start">
            <div className="lg:col-span-8 space-y-6">
              <h1 className="font-display text-6xl sm:text-8xl md:text-9xl leading-[0.88] text-paper-white tracking-tight uppercase">
                WE STRESS-TEST <br />
                <span className="text-cb-orange">BEFORE YOU</span> <br />
                COMMIT CAPITAL.
              </h1>

              <p className="font-sans text-fog text-base sm:text-lg max-w-xl leading-relaxed pt-2">
                Select any stock and your intended allocation. Five adversarial AI agents cross-examine its behaviour, determine whether buying today is wise, and forecast near-term market turbulence.
              </p>

              {/* Direct Action Hub */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/verdict/new"
                  className="neo-btn-primary text-base px-8 py-4"
                >
                  <span>START PRE-TRADE DOCKET</span>
                  <span className="font-mono text-lg font-bold">&rarr;</span>
                </Link>
                <Link
                  href="/verdict/history"
                  className="neo-btn-ghost text-sm px-7 py-4"
                >
                  VIEW PAST VERDICTS
                </Link>
              </div>
            </div>

            {/* Industrial Decal Card (Inspired by Image 1: CBRPNK Amber Tag) */}
            <div className="lg:col-span-4">
              <div className="neo-tag-orange space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="font-tech text-2xl font-black tracking-tight">CBRPNK&reg;</span>
                  <span className="font-display text-3xl font-black">&nearr;</span>
                </div>

                {/* ADSR & Spec Grid */}
                <div className="border border-black p-3 bg-white/10 rounded font-mono text-[11px] space-y-2">
                  <div className="flex justify-between border-b border-black/30 pb-1">
                    <span className="uppercase font-bold">UA 570-B</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[9px] uppercase font-bold opacity-75">ROUNDS REMAINING</div>
                      <div className="font-bold text-base">571</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold opacity-75">TIME PER JUROR</div>
                      <div className="font-bold text-base">2.47s</div>
                    </div>
                  </div>
                </div>

                <p className="font-sans text-xs leading-relaxed text-black/90 font-medium">
                  The legacy of speculation remains strong. Our multi-agent panel opens the door to cold analytical reality before market open.
                </p>

                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest pt-2 border-t border-black">
                  <span>#EOA15E &middot; SEBI COMPLIANT</span>
                  <span>CORP. &reg;</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 MODULAR SYSTEM TILES (Grid Inspiration from Image 2 & 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 pt-12 border-t-2 border-graphite">
            {[
              {
                num: "01",
                title: "STOCK BEHAVIOUR",
                badge: "MOMENTUM",
                color: "text-cb-orange",
                desc: "Order-flow depth, 52-week position, volume spike anomalies, and distribution patterns.",
              },
              {
                num: "02",
                title: "PURCHASE WISDOM",
                badge: "TIMING",
                color: "text-cb-amber",
                desc: "Quant and risk officers deliberate whether deploying your capital now is wise or premature.",
              },
              {
                num: "03",
                title: "NEAR-TERM MARKET",
                badge: "REGIME",
                color: "text-cb-green",
                desc: "Broader Nifty 50 macro trajectory, sectoral rotation, and systemic liquidity health.",
              },
              {
                num: "04",
                title: "THESIS KILLER",
                badge: "STRICT VETO",
                color: "text-cb-red",
                desc: "The singular, decisive falsification trigger that invalidates the trade immediately.",
              },
            ].map((tile) => (
              <div
                key={tile.num}
                className="neo-card flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-graphite pb-2">
                    <span className="font-display text-4xl text-paper-white group-hover:text-cb-orange transition-colors">
                      {tile.num}
                    </span>
                    <span className="decal-dark text-[9px]">
                      {tile.badge}
                    </span>
                  </div>
                  <h3 className="font-tech text-base font-bold text-paper-white mb-2 tracking-wide">
                    {tile.title}
                  </h3>
                  <p className="font-sans text-xs text-fog leading-relaxed">
                    {tile.desc}
                  </p>
                </div>
                <div className="pt-4 font-mono text-[10px] text-ash flex items-center justify-between">
                  <span>MODULE // {tile.num}</span>
                  <span className="text-cb-orange font-bold">&rarr;</span>
                </div>
              </div>
            ))}
          </div>

          {/* LARGE BOTTOM STAT CALLOUT STRIP */}
          <div className="mt-16 border-2 border-graphite bg-raw-surface p-8 rounded-[18px] grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="border-b md:border-b-0 md:border-r border-graphite pb-6 md:pb-0 md:pr-6">
              <div className="font-display text-5xl text-paper-white">0 EXECUTIONS</div>
              <p className="font-mono text-xs text-fog uppercase mt-1">
                Zero brokerage tie-ins &middot; Pure objective pre-trade decision intelligence.
              </p>
            </div>
            <div className="border-b md:border-b-0 md:border-r border-graphite pb-6 md:pb-0 md:pr-6">
              <div className="font-display text-5xl text-cb-orange">5 ADVERSARIES</div>
              <p className="font-mono text-xs text-fog uppercase mt-1">
                Bull, Bear, Risk, Quant, and Judge scrutinizing every single rupee.
              </p>
            </div>
            <div>
              <div className="font-display text-5xl text-cb-green">100% AUDITABLE</div>
              <p className="font-mono text-xs text-fog uppercase mt-1">
                Full chronological transcript saved locally in your personal ledger.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── NiveshOS Portfolio Section ───────────────────────────────────── */}
      <div id="portfolio" className="border-t-2 border-black bg-raw-bg">
        <div dangerouslySetInnerHTML={{ __html: APP_MARKUP }} />
        <Script id="gsap" src="/vendor/gsap.min.js" strategy="afterInteractive" />
        <Script id="scrolltrigger" src="/vendor/ScrollTrigger.min.js" strategy="afterInteractive" />
        <Script id="real-quotes" src="/real-quotes.js" strategy="afterInteractive" />
        <Script id="nivesh-data" src="/data.js" strategy="afterInteractive" />
        <Script id="nivesh-app" src="/app.js" strategy="afterInteractive" />
        <Script id="nivesh-anim" src="/anim.js" strategy="afterInteractive" />
      </div>
    </>
  );
}
