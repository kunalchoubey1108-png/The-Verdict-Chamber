"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AGENTS, type FullVerdict } from "@/lib/types/verdict";
import { BILLING_LABELS } from "@/lib/validation/decision";
import { buildEvidence } from "@/lib/decision/evidence";
import { loadVerdict } from "@/lib/utils/storage";
import { fmtDateTime, fmtUSD } from "@/lib/utils/format";
import { VerdictCard } from "@/components/verdict/VerdictCard";
import { EvidencePanel } from "@/components/verdict/EvidencePanel";
import { PaymentReceipt } from "@/components/verdict/PaymentPanel";

export default function SavedVerdictPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<FullVerdict | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecord(loadVerdict(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <main className="min-h-screen route-enter bg-raw-bg p-10 text-fog">Loading saved review…</main>;
  }

  if (!record) {
    return (
      <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg p-8 sm:p-14">
        <section className="neo-card mx-auto max-w-xl space-y-4 bg-raw-surface p-8 text-center">
          <h1 className="font-display text-3xl text-paper-white">SAVED REVIEW NOT FOUND</h1>
          <p className="text-sm text-fog">This record may have been deleted or is stored in another browser profile.</p>
          <Link href="/verdict/history" className="neo-btn-primary inline-flex text-xs">BACK TO HISTORY</Link>
        </section>
      </main>
    );
  }

  const { decision } = record;

  return (
    <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <Link href="/verdict/history" className="font-tech text-xs uppercase tracking-wider text-fog hover:text-cb-orange">
            ← Back to Decision History
          </Link>
          <span className="font-mono text-[10px] uppercase text-fog">Saved record · {fmtDateTime(record.createdAt)}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10">
        <header className="border-b-2 border-graphite pb-6">
          <span className="decal-orange">COMPLETED REVIEW</span>
          <h1 className="mt-2 font-display text-4xl uppercase text-paper-white sm:text-6xl">{decision.title}</h1>
          <p className="mt-2 font-mono text-xs uppercase text-fog">
            {decision.merchant} · {fmtUSD(decision.amount)} · {BILLING_LABELS[decision.billing]}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,370px)] items-start">
          <EvidencePanel decision={decision} evidence={buildEvidence(decision)} />
          <div className="space-y-4">
            <VerdictCard verdict={record.verdict} decision={decision} />
            {record.payment ? (
              <PaymentReceipt payment={record.payment} />
            ) : (
              <p className="rounded-[12px] border-2 border-graphite bg-carbon p-4 font-mono text-xs uppercase text-fog">
                {record.verdict.outcome === "REJECT" ? `${fmtUSD(decision.amount)} not spent` : "No payment recorded"}
              </p>
            )}
          </div>
        </div>

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
          <Link href="/verdict/history" className="neo-btn-ghost text-xs">RETURN TO HISTORY</Link>
          <Link href="/verdict/new" className="neo-btn-primary text-xs">REVIEW ANOTHER PAYMENT →</Link>
        </div>
      </div>
    </main>
  );
}
