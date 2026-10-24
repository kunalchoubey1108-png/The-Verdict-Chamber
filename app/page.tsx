import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "DESCRIBE THE PAYMENT",
    desc: "What it is, who gets paid, how it bills, and your monthly budget and current subscriptions.",
  },
  {
    num: "02",
    title: "FIVE AGENTS DEBATE",
    desc: "Advocate, Skeptic, Budget Officer and Analyst argue over the computed evidence, in order.",
  },
  {
    num: "03",
    title: "THE JUDGE RULES",
    desc: "Proceed, modify or reject, with the approved amount, key risks and when to reconsider.",
  },
  {
    num: "04",
    title: "YOU CONFIRM, PAYPAL PAYS",
    desc: "Nothing moves until you confirm. Only the approved amount can be charged.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen route-enter bg-raw-bg text-bone flex flex-col grid-bg selection:bg-cb-orange selection:text-black">
      <nav className="border-b-2 border-graphite bg-raw-surface px-6 sm:px-12 py-4 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cb-orange text-black font-tech font-black text-lg flex items-center justify-center border-2 border-black rounded-sm shadow-brutal">
              VP
            </div>
            <div className="flex flex-col">
              <span className="font-display tracking-wider text-2xl text-paper-white leading-none">VERDICTPAY</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-cb-orange font-semibold">
                AN AI JURY FOR EVERY PAYMENT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 font-tech text-xs tracking-wider uppercase">
            <Link href="/verdict/history" className="hidden sm:inline text-fog hover:text-cb-orange transition-colors">
              HISTORY
            </Link>
            <Link href="/verdict/new" className="neo-btn-primary text-xs px-5 py-2.5">
              REVIEW A PAYMENT →
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex-1 max-w-[1280px] mx-auto px-6 py-16 sm:py-24 w-full">
        <div className="max-w-3xl space-y-6">
          <h1 className="font-display text-6xl sm:text-8xl leading-[0.9] text-paper-white tracking-tight uppercase">
            Argue it out <br />
            <span className="text-cb-orange">before</span> you pay.
          </h1>
          <p className="font-sans text-fog text-base sm:text-lg max-w-xl leading-relaxed">
            VerdictPay puts an adversarial AI jury between you and the checkout button. Five agents debate every
            purchase, subscription or invoice, and only the amount the jury and you approve can be paid.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link href="/verdict/new" className="neo-btn-primary text-base px-8 py-4">
              START A REVIEW →
            </Link>
            <Link href="/verdict/history" className="neo-btn-ghost text-sm px-7 py-4">
              VIEW PAST VERDICTS
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 pt-12 border-t-2 border-graphite">
          {STEPS.map((step) => (
            <div key={step.num} className="neo-card">
              <div className="mb-3 border-b border-graphite pb-2 font-display text-4xl text-paper-white">{step.num}</div>
              <h2 className="font-tech text-base font-bold text-paper-white mb-2 tracking-wide">{step.title}</h2>
              <p className="font-sans text-xs text-fog leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-wider text-fog">
          AI decision support, not financial advice · Payments run in PayPal sandbox mode
        </p>
      </section>
    </div>
  );
}
