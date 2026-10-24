"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { FullVerdict } from "@/lib/types/verdict";
import { AGENTS } from "@/lib/types/verdict";
import { loadVerdictHistory, deleteVerdict } from "@/lib/utils/storage";
import { createVerdictArchive } from "@/lib/utils/verdictArchive";
import { fmtDateTime, fmtUSD } from "@/lib/utils/format";

export default function HistoryPage() {
  const [history, setHistory] = useState<FullVerdict[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    setHistory(loadVerdictHistory());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deleteVerdict(id);
    setHistory((prev) => prev.filter((v) => v.id !== id));
  }

  function handleExport() {
    setExportError("");
    try {
      const archive = createVerdictArchive(history);
      const blobUrl = URL.createObjectURL(new Blob([archive], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `verdictpay-archive-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    } catch {
      setExportError("Could not create the archive. Check browser download permissions and try again.");
    }
  }

  const badgeClass = (outcome: string) =>
    outcome === "PROCEED"
      ? "bg-cb-green text-white border-2 border-black"
      : outcome === "MODIFY"
      ? "bg-cb-orange text-black border-2 border-black"
      : "bg-cb-red text-white border-2 border-black";

  const outcomeIcon = (outcome: string) =>
    outcome === "PROCEED" ? "▲" : outcome === "MODIFY" ? "◆" : "▼";

  return (
    <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      {/* Top Ticker Bar */}
      <div className="border-b border-graphite bg-black px-6 py-2 flex items-center justify-between font-mono text-[10px] text-fog uppercase">
        <div className="flex items-center gap-4">
          <span className="text-cb-orange font-bold">● DECISION AUDIT TRAIL</span>
          <span>STORED IN THIS BROWSER ONLY</span>
        </div>
        <div>RECORD COUNT: {history.length}</div>
      </div>

      {/* Nav */}
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 flex items-center justify-between max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cb-orange text-black font-tech font-bold text-sm flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
              VP
            </div>
            <span className="font-display text-2xl tracking-wide text-paper-white">
              VERDICTPAY
            </span>
          </Link>
          <span className="text-graphite">/</span>
          <span className="decal-dark text-[9px]">
            HISTORY
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-tech tracking-wider uppercase">
          <Link
            href="/verdict/new"
            className="neo-btn-primary text-xs px-5 py-2.5"
          >
            [+] NEW REVIEW
          </Link>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <header className="mb-10 pb-6 border-b-2 border-graphite">
          <div className="flex items-center gap-2 mb-2">
            <span className="decal-orange">AUDIT TRAIL</span>
            <span className="font-mono text-xs text-fog uppercase">EVERY VERDICT, NEWEST FIRST</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl sm:text-7xl text-paper-white uppercase tracking-wide">
                DECISION HISTORY
              </h1>
              <p className="font-sans text-fog text-sm sm:text-base max-w-xl leading-relaxed pt-1">
                Every payment the jury reviewed: the request, the verdict, the approved amount and the full debate.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!loaded || history.length === 0}
              aria-describedby="archive-privacy-note"
              className="neo-btn-primary text-xs px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              DOWNLOAD REPORT ARCHIVE
            </button>
          </div>
          <p id="archive-privacy-note" className="mt-3 text-xs text-fog">
            The JSON archive includes saved analysis and evidence. It is generated in your browser; store and share the file carefully.
          </p>
          {exportError && <p role="alert" className="mt-2 text-xs text-cb-red">{exportError}</p>}
        </header>

        {!loaded ? (
          <div className="text-center py-28 text-fog font-tech text-base tracking-widest uppercase">
            LOADING HISTORY…
          </div>
        ) : history.length === 0 ? (
          <div className="neo-card text-center py-20 space-y-4 max-w-lg mx-auto bg-raw-surface">
            <div className="text-4xl">📋</div>
            <h2 className="font-display text-3xl text-paper-white">NO REVIEWS YET</h2>
            <p className="text-sm font-sans text-fog leading-relaxed">
              No payment reviews found in this browser. Run your first one.
            </p>
            <div className="pt-2">
              <Link href="/verdict/new" className="neo-btn-primary inline-flex text-xs">
                REVIEW A PAYMENT &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Impact, computed only from the reviews saved in this browser */}
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Payments reviewed", value: String(history.length) },
                {
                  label: "Changed or rejected by the jury",
                  value: String(history.filter((v) => v.verdict.outcome !== "PROCEED").length),
                },
                {
                  label: "Requested but not approved",
                  value: fmtUSD(history.reduce((sum, v) => sum + (v.decision.amount - v.verdict.approvedAmount), 0)),
                },
              ].map((stat) => (
                <div key={stat.label} className="neo-card bg-raw-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-fog">{stat.label}</dt>
                  <dd className="mt-1 font-display text-3xl text-paper-white tabular">{stat.value}</dd>
                </div>
              ))}
            </dl>
            {history.map((v) => (
              <div
                key={v.id}
                className="neo-card bg-raw-surface p-6"
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
                        {v.decision.title}
                      </h3>
                      <span className="font-mono text-xs text-fog">{v.decision.merchant}</span>
                      <span className="font-mono text-xs text-fog tabular">
                        Requested: {fmtUSD(v.decision.amount)}
                      </span>
                      <span className="font-mono text-xs text-fog tabular">
                        Approved: <strong className={v.verdict.approvedAmount > 0 ? "text-cb-green" : "text-cb-red"}>{fmtUSD(v.verdict.approvedAmount)}</strong>
                      </span>
                    </div>

                    <div className="mt-3 p-3.5 rounded-lg border-2 border-graphite bg-black/40">
                      <p className="font-sans text-xs text-bone leading-relaxed">{v.verdict.summary}</p>
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
                        Confidence: <strong className="text-paper-white">{v.verdict.confidence}%</strong>
                      </span>
                      <span className="text-fog">
                        Payment:{" "}
                        <strong className={v.payment ? "text-cb-green" : "text-paper-white"}>
                          {v.payment ? `${v.payment.status} ${fmtUSD(v.payment.amount)}` : v.verdict.outcome === "REJECT" ? "none (rejected)" : "not paid"}
                        </strong>
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
                      href={`/verdict/history/${v.id}`}
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
