import Link from "next/link";

export default function VerdictHome() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="border-b border-hairline px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl">⚖️</span>
          <span className="font-bold text-ink tracking-tight">The Verdict Chamber</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/verdict/history" className="text-ink-muted hover:text-ink transition-colors">
            History
          </Link>
          <Link href="/" className="text-ink-muted hover:text-ink transition-colors">
            Portfolio
          </Link>
        </div>
      </nav>

      {/* Redirect note */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="text-5xl mb-6">⚖️</div>
        <h1 className="text-3xl font-black text-ink mb-3">The Verdict Chamber</h1>
        <p className="text-ink-muted mb-8 max-w-md">
          Submit a trade thesis. The multi-agent AI jury breaks it apart before capital is at risk.
        </p>
        <Link href="/verdict/new" className="vc-btn-primary text-base px-8 py-3">
          Submit a Trade Thesis →
        </Link>
      </div>
    </main>
  );
}
