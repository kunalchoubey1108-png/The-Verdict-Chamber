import Link from "next/link";
import { DecisionForm } from "@/components/verdict/DecisionForm";

export const metadata = {
  title: "Review a Payment — VerdictPay",
  description: "Describe a purchase, subscription or invoice and let a five-agent AI jury review it before you pay.",
};

export default function NewDecisionPage() {
  return (
    <main className="min-h-screen route-enter bg-raw-bg text-bone grid-bg selection:bg-cb-orange selection:text-black">
      {/* Nav */}
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 flex items-center justify-between max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cb-orange text-black font-tech font-bold text-sm flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
              VP
            </div>
            <span className="font-display text-2xl tracking-wide text-paper-white">VERDICTPAY</span>
          </Link>
          <span className="text-graphite">/</span>
          <span className="decal-orange text-[9px]">NEW REVIEW</span>
        </div>
        <Link href="/verdict/history" className="text-xs font-tech tracking-wider uppercase text-fog hover:text-cb-orange transition-colors">
          DECISION HISTORY
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 className="font-display text-5xl sm:text-6xl text-paper-white tracking-wide uppercase">Review a Payment</h1>
          <p className="font-sans text-fog text-sm sm:text-base leading-relaxed pt-1">
            Describe what you are about to pay for. Five AI jurors argue it out, then the judge rules: proceed, modify or reject.
          </p>
        </header>

        <div className="neo-card bg-raw-surface p-6 sm:p-8">
          <DecisionForm />
        </div>
      </div>
    </main>
  );
}
