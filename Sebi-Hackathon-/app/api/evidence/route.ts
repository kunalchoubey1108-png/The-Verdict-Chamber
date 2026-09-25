// ── POST /api/evidence ────────────────────────────────────────────────────────
// Accepts an investment inquiry (instrument + positionSize), fetches market data,
// computes default levels based on current quote if omitted, computes signals,
// and returns a structured EvidencePack for the jury.

import { NextRequest, NextResponse } from "next/server";
import type { TradeThesis } from "@/lib/types/thesis";
import type { EvidencePack } from "@/lib/types/evidence";
import { fetchQuote } from "@/lib/signals/fetchQuote";
import { computeSignals } from "@/lib/signals/computeSignals";
import { computePortfolioImpact } from "@/lib/signals/portfolioImpact";

export async function POST(req: NextRequest) {
  try {
    const rawThesis = (await req.json()) as TradeThesis;

    // ── Validate minimal required fields ─────────────────────────────────
    if (!rawThesis.instrument?.finnhubSymbol) {
      return NextResponse.json(
        { error: "Invalid request — instrument selection is required." },
        { status: 400 }
      );
    }

    const warnings: string[] = [];

    // ── Fetch instrument quote ───────────────────────────────────────────
    const quote = await fetchQuote(rawThesis.instrument);
    if (!quote.isLive) {
      warnings.push(
        "Market data is from snapshot feed (Finnhub API key not configured). Add FINNHUB_API_KEY to .env.local for live real-time prices."
      );
    }

    // ── Derive default levels if user only provided stock & investment amount ──
    const entryPrice = rawThesis.entryPrice && rawThesis.entryPrice > 0 ? rawThesis.entryPrice : quote.ltp;
    const direction = rawThesis.direction || "LONG";

    // Dynamic target (+8% for LONG, -8% for SHORT) & stop-loss (-4% for LONG, +4% for SHORT)
    const target = rawThesis.target && rawThesis.target > 0
      ? rawThesis.target
      : direction === "LONG"
      ? Math.round(entryPrice * 1.08 * 100) / 100
      : Math.round(entryPrice * 0.92 * 100) / 100;

    const stopLoss = rawThesis.stopLoss && rawThesis.stopLoss > 0
      ? rawThesis.stopLoss
      : direction === "LONG"
      ? Math.round(entryPrice * 0.96 * 100) / 100
      : Math.round(entryPrice * 1.04 * 100) / 100;

    const thesis: TradeThesis = {
      ...rawThesis,
      entryPrice,
      target,
      stopLoss,
      direction,
      positionSize: rawThesis.positionSize || 50000,
      horizon: rawThesis.horizon || "swing",
      rationale:
        rawThesis.rationale?.trim() ||
        `Investor planning to allocate ₹${(rawThesis.positionSize || 50000).toLocaleString("en-IN")} into ${rawThesis.instrument.name} (${rawThesis.instrument.symbol}). Seeking jury assessment on stock behaviour, timing wisdom, and expected near-future market state.`,
    };

    // ── Fetch Nifty 50 for regime classification ─────────────────────────
    let niftyChangePct = 0;
    try {
      if (process.env.FINNHUB_API_KEY) {
        const niftyRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=NSE%3ANIFTY50&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 120 } } as any
        );
        if (niftyRes.ok) {
          const niftyData = await niftyRes.json();
          niftyChangePct = niftyData.dp ?? 0;
        }
      }
    } catch {
      warnings.push("Nifty 50 feed unavailable — market regime estimated from historical baseline.");
    }

    // ── Compute signals + regime ─────────────────────────────────────────
    const { signals, regime } = computeSignals(quote, thesis, niftyChangePct);

    // ── Compute R:R and level percentages ────────────────────────────────
    const riskRewardRatio =
      Math.abs(target - entryPrice) / Math.max(0.01, Math.abs(entryPrice - stopLoss));

    const stopLossPct = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100;
    const targetPct = (Math.abs(target - entryPrice) / entryPrice) * 100;

    // ── Portfolio impact ─────────────────────────────────────────────────
    const portfolioImpact = computePortfolioImpact(thesis);

    // ── Assemble EvidencePack ────────────────────────────────────────────
    const evidencePack: EvidencePack = {
      assembledAt: new Date().toISOString(),
      thesis,
      quote,
      signals,
      regime,
      riskRewardRatio,
      stopLossPct,
      targetPct,
      portfolioImpact,
      warnings,
    };

    return NextResponse.json(evidencePack);
  } catch (err) {
    console.error("[/api/evidence]", err);
    return NextResponse.json(
      { error: "Failed to assemble evidence pack. Please try again." },
      { status: 500 }
    );
  }
}
