"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AGENTS, type FullVerdict } from "@/lib/types/verdict";
import { loadVerdict } from "@/lib/utils/storage";
import { fmtDateTime, fmtINR } from "@/lib/utils/format";
import { VerdictCard } from "@/components/verdict/VerdictCard";

export default function SavedVerdictPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<FullVerdict | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecord(loadVerdict(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <main className="min-h-screen route-enter bg-raw-bg p-10 text-fog">Loading saved docket…</main>;
  }

  if (!record) {
    return (
      <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg p-8 sm:p-14">
        <section className="neo-card mx-auto max-w-xl space-y-4 bg-raw-surface p-8 text-center">
          <h1 className="font-display text-3xl text-paper-white">SAVED DOCKET NOT FOUND</h1>
          <p className="text-sm text-fog">This record may have been deleted or is stored in another browser profile.</p>
          <Link href="/verdict/history" className="neo-btn-primary inline-flex text-xs">BACK TO JOURNAL</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <Link href="/verdict/history" className="font-tech text-xs uppercase tracking-wider text-fog hover:text-cb-orange">
            ← Back to Audit Journal
          </Link>
          <span className="font-mono text-[10px] uppercase text-fog">Saved record · {fmtDateTime(record.createdAt)}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10">
        <header className="border-b-2 border-graphite pb-6">
          <span className="decal-orange">COMPLETED DOCKET</span>
          <h1 className="mt-2 font-display text-4xl uppercase text-paper-white sm:text-6xl">
            {record.thesisSnapshot.instrument}
          </h1>
          <p className="mt-2 font-mono text-xs uppercase text-fog">
            {record.thesisSnapshot.direction} · Entry {fmtINR(record.thesisSnapshot.entryPrice)} · Target {fmtINR(record.thesisSnapshot.target)} · Stop {fmtINR(record.thesisSnapshot.stopLoss)}
          </p>
        </header>

        {record.evidencePack ? (
          <VerdictCard verdict={record.verdict} evidencePack={record.evidencePack} />
        ) : (
          <section className="neo-card space-y-4 bg-raw-surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="decal-orange">{record.verdict.outcome}</span>
              <span className="font-mono text-xs text-fog">Risk {record.verdict.riskScore}/100</span>
              <span className="font-mono text-xs text-fog">Confidence {record.verdict.confidence}%</span>
            </div>
            <p className="text-sm leading-relaxed text-bone">{record.verdict.summary}</p>
            <p className="text-sm text-fog"><strong className="text-cb-orange">Thesis killer:</strong> {record.verdict.thesisKiller}</p>
            <p className="font-mono text-[10px] uppercase text-fog">Evidence details were not saved with this older record.</p>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-graphite pb-3">
            <h2 className="font-display text-2xl uppercase text-paper-white">Deliberation Transcript</h2>
            <span className="font-mono text-[10px] uppercase text-fog">{record.deliberation.length} recorded statements</span>
          </div>
          {record.deliberation.map((message, index) => (
            <article key={`${message.agent}-${index}`} className="neo-card space-y-3 bg-raw-surface p-5">
              <header className="flex items-center justify-between gap-3">
                <h3 className="font-tech text-sm font-bold uppercase text-cb-orange">{AGENTS[message.agent].name}</h3>
                <time className="font-mono text-[10px] text-fog">{fmtDateTime(message.timestamp)}</time>
              </header>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-bone">{message.content}</p>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-3 border-t border-graphite pt-5">
          <Link href="/verdict/history" className="neo-btn-ghost text-xs">RETURN TO JOURNAL</Link>
          <Link href="/verdict/new" className="neo-btn-primary text-xs">START NEW DOCKET →</Link>
        </div>
      </div>
    </main>
  );
}
