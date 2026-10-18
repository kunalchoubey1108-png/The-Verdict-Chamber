/* ==========================================================================
   NiveshOS — tools/build-real-data.mjs
   Pulls REAL market data from free/open sources and bakes a dated snapshot
   into ../real-quotes.js (window.REAL_QUOTES). Re-run any time to refresh.

     node tools/build-real-data.mjs

   Sources (all free, no key):
     • Yahoo Finance chart API  — live NSE prices for equities / REITs /
       InvITs / gold ETF. (No CORS → snapshot only, fetched here in Node.)
     • mfapi.in                 — free JSON wrapper over AMFI mutual-fund NAVs;
       CORS-enabled, so the app can also refresh these live in the browser.
     • AMFI is the ultimate source of the NAVs (portal.amfiindia.com).
   ========================================================================== */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "..", "real-quotes.js");
const UA = { headers: { "User-Agent": "Mozilla/5.0" } };

// Yahoo NSE symbols we hold or list. name is a fallback label.
const YAHOO = [
  ["HDFCBANK",   "HDFCBANK.NS",   "HDFC Bank Ltd"],
  ["ICICIBANK",  "ICICIBANK.NS",  "ICICI Bank Ltd"],
  ["RELIANCE",   "RELIANCE.NS",   "Reliance Industries"],
  ["TCS",        "TCS.NS",        "Tata Consultancy Svcs"],
  ["INFY",       "INFY.NS",       "Infosys Ltd"],
  ["TMPV",       "TMPV.NS",       "Tata Motors Passenger Vehicles"],
  ["BHARTIARTL", "BHARTIARTL.NS", "Bharti Airtel Ltd"],
  ["GOLDBEES",   "GOLDBEES.NS",   "Nippon India Gold ETF"],
  ["EMBASSY",    "EMBASSY.NS",    "Embassy Office Parks REIT"],
  ["MINDSPACE",  "MINDSPACE.NS",  "Mindspace Business Parks REIT"],
  ["PGINVIT",    "PGINVIT.NS",    "PowerGrid InvIT"],
  ["INDIGRID",   "INDIGRID.NS",   "IndiGrid InvIT"]
];

// AMFI scheme codes (via mfapi.in) for the funds / index fund we reference.
const MF = [
  [120465, "AXISBLUE", "Axis Large Cap Fund — Direct Growth"],
  [118825, "MIRAELC",  "Mirae Asset Large Cap — Direct Growth"],
  [120716, "UTINIF50", "UTI Nifty 50 Index — Direct Growth"]
];

async function yahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${symbol} HTTP ${r.status}`);
  const m = (await r.json())?.chart?.result?.[0]?.meta;
  if (!m || m.regularMarketPrice == null) throw new Error(`${symbol} no price`);
  const prev = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
  const ltp = round2(m.regularMarketPrice);
  const chg = prev ? round2((ltp - prev) / prev * 100) : 0;
  return { ltp, dayChangePct: chg, name: m.longName || m.shortName };
}

async function mfapi(code) {
  const r = await fetch(`https://api.mfapi.in/mf/${code}/latest`, UA);
  if (!r.ok) throw new Error(`MF ${code} HTTP ${r.status}`);
  const j = await r.json();
  const d = j?.data?.[0];
  if (!d) throw new Error(`MF ${code} no nav`);
  return { nav: round2(+d.nav), date: d.date, name: j?.meta?.scheme_name };
}

const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  const quotes = {};
  for (const [sym, ysym, fallback] of YAHOO) {
    try {
      const q = await yahoo(ysym);
      quotes[sym] = { ltp: q.ltp, dayChangePct: q.dayChangePct, name: q.name || fallback, source: "Yahoo Finance (NSE)" };
      console.log(`  ✓ ${sym.padEnd(11)} ₹${q.ltp}  (${q.dayChangePct > 0 ? "+" : ""}${q.dayChangePct}%)`);
    } catch (e) { console.warn(`  ✗ ${sym}: ${e.message}`); }
  }
  const navs = {};
  for (const [code, sym, fallback] of MF) {
    try {
      const q = await mfapi(code);
      navs[code] = { symbol: sym, nav: q.nav, date: q.date, name: q.name || fallback, source: "AMFI via mfapi.in" };
      console.log(`  ✓ ${String(code).padEnd(11)} NAV ₹${q.nav}  ${q.date}  ${sym}`);
    } catch (e) { console.warn(`  ✗ ${code}: ${e.message}`); }
  }

  const payload = {
    asOf: new Date().toISOString().slice(0, 10),
    sources: [
      "Equity / REIT / InvIT / ETF prices: Yahoo Finance (NSE), fetched at build time.",
      "Mutual-fund & index NAVs: AMFI (Association of Mutual Funds in India) via api.mfapi.in — CORS-enabled, also refreshable live in-app.",
      "All instruments are real, SEBI-registered, exchange-listed securities."
    ],
    quotes,
    navs
  };

  const banner =
    "/* ==========================================================================\n" +
    "   NiveshOS — real-quotes.js  (GENERATED — do not hand-edit)\n" +
    "   Real market snapshot from open data. Rebuild: node tools/build-real-data.mjs\n" +
    "   asOf " + payload.asOf + "\n" +
    "   ========================================================================== */\n";
  const body =
    banner +
    "window.REAL_QUOTES = " + JSON.stringify(payload, null, 2) + ";\n";
  await writeFile(OUT, body, "utf8");
  console.log(`\nWrote ${OUT}\n  ${Object.keys(quotes).length} equity/REIT/InvIT/ETF quotes, ${Object.keys(navs).length} NAVs, asOf ${payload.asOf}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
