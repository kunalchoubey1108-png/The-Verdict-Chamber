"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { FullVerdict } from "@/lib/types/verdict";
import { AGENTS } from "@/lib/types/verdict";
import { loadVerdictHistory, deleteVerdict } from "@/lib/utils/storage";
import { fmtDateTime, fmtINR } from "@/lib/utils/format";

export default function HistoryPage() {
  const [history, setHistory] = useState<FullVerdict[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(loadVerdictHistory());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deleteVerdict(id);
    setHistory((prev) => prev.filter((v) => v.id !== id));
  }

  const badgeClass = (outcome: string) =>
    outcome === "TRADE"
      ? "bg-cb-green text-white border-2 border-black"
      : outcome === "WATCH"
      ? "bg-cb-orange text-black border-2 border-black"
      : "bg-cb-red text-white border-2 border-black";

  const outcomeIcon = (outcome: string) =>
    outcome === "TRADE" ? "▲" : outcome === "WATCH" ? "◆" : "▼";

  return (
    <main className="min-h-screen bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      {/* Top Ticker Bar */}
      <div className="border-b border-graphite bg-black px-6 py-2 flex items-center justify-between font-mono text-[10px] text-fog uppercase">
        <div className="flex items-center gap-4">
          <span className="text-cb-orange font-bold">● HISTORICAL AUDIT LEDGER</span>
          <span>PERSISTENCE: LOCAL STORAGE ENCLAVE</span>
        </div>
        <div>RECORD COUNT: {history.length}</div>
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
          <span className="decal-dark text-[9px]">
            ARBITRATION ARCHIVE
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-tech tracking-wider uppercase">
          <Link
            href="/verdict/new"
            className="neo-btn-primary text-xs px-5 py-2.5"
          >
            [+] NEW INQUIRY
          </Link>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <header className="mb-10 pb-6 border-b-2 border-graphite">
          <div className="flex items-center gap-2 mb-2">
            <span className="decal-orange">CHRONOLOGICAL DOCKET</span>
            <span className="font-mono text-xs text-fog uppercase">IMMUTABLE PRE-TRADE AUDIT TRAIL</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-paper-white uppercase tracking-wide">
            DELIBERATION JOURNAL
          </h1>
          <p className="font-sans text-fog text-sm sm:text-base max-w-xl leading-relaxed pt-1">
            Complete record of past stock purchase evaluations, adversarial juror debates, risk scores, and binding Thesis Killer veto triggers.
          </p>
        </header>

        {!loaded ? (
          <div className="text-center py-28 text-fog font-tech text-base tracking-widest uppercase">
            ACCESSING ENCRYPTED LEDGER…
          </div>
        ) : history.length === 0 ? (
          <div className="neo-card text-center py-20 space-y-4 max-w-lg mx-auto bg-raw-surface">
            <div className="text-4xl">📋</div>
            <h2 className="font-display text-3xl text-paper-white">NO DOCKETS RECORDED</h2>
            <p className="text-sm font-sans text-fog leading-relaxed">
              No previous pre-trade deliberations found in this profile. Convene your first AI jury.
            </p>
            <div className="pt-2">
              <Link href="/verdict/new" className="neo-btn-primary inline-flex text-xs">
                SUBMIT FIRST STOCK &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((v) => (
              <div
                key={v.id}
                className="neo-card bg-raw-surface p-6 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Verdict Badge */}
                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 font-tech font-bold text-xs uppercase tracking-wider rounded-md ${badgeClass(v.verdict.outcome)}`}>
                      <span>{outcomeIcon(v.verdict.outcome)}</span>
                      <span>{v.verdict.outcome}</span>
                    </span>
                  </div>

                  {/* Main Data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="font-display text-3xl text-paper-white tracking-wide">
                        {v.thesisSnapshot.instrument}
                      </h3>
                      <span className="font-mono text-xs text-cb-orange font-bold px-2 py-0.5 rounded bg-cb-orange/15 border border-cb-orange/30">
                        {v.thesisSnapshot.direction}
                      </span>
                      <span className="font-mono text-xs text-fog tabular">
                        Ref Price: {fmtINR(v.thesisSnapshot.entryPrice)}
                      </span>
                      <span className="font-mono text-xs text-fog tabular">
                        Ceiling: {fmtINR(v.thesisSnapshot.target)}
                      </span>
                      <span className="font-mono text-xs text-fog tabular">
                        Floor: {fmtINR(v.thesisSnapshot.stopLoss)}
                      </span>
                    </div>

                    {/* Thesis Killer Box */}
                    <div className="mt-3 p-3.5 rounded-lg border-2 border-graphite bg-black/40">
                      <p className="font-sans text-xs text-bone leading-relaxed">
                        <strong className="text-cb-orange font-mono uppercase font-bold mr-2">
                          [THESIS KILLER]:
                        </strong>
                        "{v.verdict.thesisKiller}"
                      </p>
                    </div>

                    {/* Metrics Bar */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-graphite font-mono text-xs">
                      <span className="text-fog">
                        Risk Score:{" "}
                        <strong className={v.verdict.riskScore > 65 ? "text-cb-red" : "text-cb-green"}>
                          {v.verdict.riskScore}/100
                        </strong>
                      </span>
                      <span className="text-fog">
                        Asymmetry Edge: <strong className="text-paper-white">{v.verdict.riskRewardRatio.toFixed(2)}:1</strong>
                      </span>
                      <span className="text-fog">
                        Consensus: <strong className="text-paper-white">{v.verdict.confidence}%</strong>
                      </span>
                      <div className="flex -space-x-1 ml-auto">
                        {v.deliberation.map((m) => (
                          <span
                            key={m.agent}
                            className="text-xs p-1 rounded bg-carbon border border-graphite"
                            title={AGENTS[m.agent].name}
                          >
                            {AGENTS[m.agent].icon}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-fog">
                        {fmtDateTime(v.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-auto">
                    <Link
                      href={`/verdict/${v.thesisId}`}
                      className="neo-btn-primary text-xs px-4 py-2 text-center"
                    >
                      REVIEW
                    </Link>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="font-mono text-xs text-fog hover:text-cb-red transition-colors px-3 py-1.5"
                    >
                      PURGE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
