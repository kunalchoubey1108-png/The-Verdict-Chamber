import { NextResponse } from "next/server";

/*
  GET /api/quotes?symbols=RELIANCE.NS,TCS.NS

  Server-side live-quote proxy over a free source (Yahoo Finance). Keeps the
  zero-cost constraint (no keys, no paid tier) while giving NiveshOS a real,
  scalable data path instead of client-only widgets:
    - runs on the Node server, so the upstream host never sees the browser
    - in-memory TTL cache collapses N users -> 1 upstream call per window
    - input is validated + capped so the endpoint can't be used to fan out
  The static engine still works offline from data.js; this is the live path
  the frontend can opt into.
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 60_000; // one upstream refresh per symbol-set per minute
const MAX_SYMBOLS = 50;
const SYMBOL_RE = /^[A-Za-z0-9.\-^=]{1,20}$/;

const cache = new Map(); // key -> { at, data }

function parseSymbols(raw) {
  if (!raw) return [];
  const seen = new Set();
  for (const s of raw.split(",")) {
    const sym = s.trim().toUpperCase();
    if (sym && SYMBOL_RE.test(sym)) seen.add(sym);
    if (seen.size >= MAX_SYMBOLS) break;
  }
  return [...seen];
}

// Yahoo's v7 /quote endpoint now demands a crumb+cookie. The v8 /chart
// endpoint is still keyless, so fetch one symbol at a time (in parallel) and
// read the meta block. The per-set cache keeps this from fanning out.
async function fetchOne(symbol) {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?range=1d&interval=1d";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (NiveshOS quote proxy)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("upstream " + res.status);
  const json = await res.json();
  const m = json?.chart?.result?.[0]?.meta;
  if (!m) throw new Error("no meta for " + symbol);
  const price = m.regularMarketPrice ?? null;
  const prev = m.chartPreviousClose ?? m.previousClose ?? null;
  const change = price != null && prev != null ? price - prev : null;
  const changePct = change != null && prev ? (change / prev) * 100 : null;
  return {
    symbol: m.symbol ?? symbol,
    name: m.shortName ?? m.symbol ?? symbol,
    price,
    change,
    changePct,
    currency: m.currency ?? "INR",
    time: m.regularMarketTime ?? null,
  };
}

async function fetchQuotes(symbols) {
  const settled = await Promise.allSettled(symbols.map(fetchOne));
  const quotes = settled
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  if (!quotes.length) throw new Error("all symbols failed upstream");
  return quotes;
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("symbols");
  const symbols = parseSymbols(raw);
  if (!symbols.length) {
    return NextResponse.json(
      { error: "provide ?symbols=A.NS,B.NS (max 50)" },
      { status: 400 }
    );
  }

  const key = symbols.join(",");
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) {
    return NextResponse.json(
      { source: "cache", asOf: hit.at, quotes: hit.data },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  }

  try {
    const data = await fetchQuotes(symbols);
    cache.set(key, { at: now, data });
    return NextResponse.json(
      { source: "live", asOf: now, quotes: data },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  } catch (err) {
    if (hit) {
      // upstream blip: serve stale rather than fail
      return NextResponse.json(
        { source: "stale", asOf: hit.at, quotes: hit.data },
        { headers: { "Cache-Control": "public, max-age=10" } }
      );
    }
    return NextResponse.json(
      { error: "upstream unavailable", detail: String(err.message || err) },
      { status: 502 }
    );
  }
}
