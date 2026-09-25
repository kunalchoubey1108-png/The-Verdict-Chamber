# SEBI Hackathon — Problem Statement 3: Super App for Unified Multi-Asset Investing and Awareness for Retail Investors

## Prototype: NiveshOS — "Every asset. One brain."

A zero-cost working prototype lives in this folder. **To run: double-click `index.html`** (opens in any browser, no server or installs needed). It opens on a **local login screen** — pick any of the six demo profiles (credentials shown on the card) or type them in. `index.html?demo=1` auto-signs-in as Priya and skips to the dashboard; `index.html?user=<id>` auto-signs-in as a specific profile. Reset by clearing the site's localStorage (or use a private window). Architecture and build contract are in `BUILD_SPEC.md`.

### Local login & demo users
The login is **local-only** (client-side, no backend, no network auth) — it exists to demo per-user portfolios, not to secure anything; credentials live in `data.js` and are trivially bypassable. Each user has a **distinct, internally-consistent portfolio**, and all state (onboarding, risk profile, purchases, consent ledger, audit trail) is namespaced per user in localStorage. Sign out from the sidebar.

| User | Login | Persona | Net worth |
|---|---|---|---|
| Priya Sharma | `priya` / `priya123` | Balanced saver, bank-heavy (concentration + overlap alerts) | ~₹8.1L |
| Rajesh Kumar | `rajesh` / `rajesh123` | Conservative retiree — bonds, SGB, gold, index fund | ~₹3.9L |
| Ananya Iyer | `ananya` / `ananya123` | First-job investor — aggressive, tech-concentrated | ~₹0.9L |
| Mohammed Farhan | `farhan` / `farhan123` | Income investor — REITs, InvITs & bonds | ~₹3.2L |
| Sunita Devi | `sunita` / `sunita123` | Beginner — one index fund + cash, unprofiled | ~₹0.3L |
| Vikram Reddy | `vikram` / `vikram123` | HNI — large book across every asset class | ~₹15.6L |

Files: `index.html` + `styles.css` + `anim.js` (UI, GSAP animations) · `data.js` + `app.js` (portfolio data, charts, suitability engine, rule-based copilot) · `real-quotes.js` + `tools/build-real-data.mjs` (real market snapshot from open data) · `vendor/` (GSAP, vendored — works offline).

## Real, open-source market data

The instruments are all real, SEBI-registered, exchange-listed securities, and their prices/NAVs come from free, open sources — no paid API, no key:

- **Equity / REIT / InvIT / gold-ETF prices** — Yahoo Finance chart API (`query1.finance.yahoo.com`), real NSE last-traded prices. Fetched at build time (Yahoo blocks browser CORS), so these are a dated snapshot.
- **Mutual-fund & index NAVs** — AMFI (Association of Mutual Funds in India), the official daily NAV source, via `api.mfapi.in` — a free JSON wrapper that is **CORS-enabled**, so the app also refreshes these **live in the browser** (the "↻ Refresh NAVs" button on the dashboard).
- **Live market chart** — a free **TradingView** Advanced-Chart widget embedded on the dashboard, real-time and interactive, switchable across every equity/ETF holding (NSE symbols). It's TradingView's own widget (loads from their CDN, needs internet, carries their required attribution) and is deliberately separate from the portfolio engine — the dated equity snapshot still drives the analytics.

**How it works:** `node tools/build-real-data.mjs` pulls a fresh snapshot into `real-quotes.js` (`window.REAL_QUOTES`), which `data.js` merges over its baked fallbacks at load. Prices/NAVs become real; the demo investor's holdings, quantities and day-moves stay curated so the concentration story (HDFC Bank ~21% top issuer, Financials ~40% of market value) and offline mode both remain coherent. If `real-quotes.js` is missing, the app falls back to the last baked snapshot and still runs fully offline — zero external cost preserved.

Real instruments in the demo: HDFC Bank, ICICI Bank, Reliance, TCS, Infosys, Tata Motors PV, Bharti Airtel, Nippon India Gold ETF (NSE); Axis Large Cap, Mirae Asset Large Cap, UTI Nifty 50 Index (AMFI); Embassy & Mindspace REITs, PowerGrid & IndiGrid InvITs.

## Problem

India's retail investors face two compounding barriers that limit effective participation in the securities markets.

**First**, despite holding investments across multiple demat and trading accounts with different brokers, investors lack a single consolidated view of their total holdings, exposure, and risk. This fragmentation across depositories, brokers, and asset classes creates inefficiencies in portfolio monitoring and impairs informed decision-making. While building blocks such as the Account Aggregator framework and the SEBI-NSDL-CDSL Unified Investor Platform exist, no integrated, analytics-rich solution currently provides a seamless, cross-asset portfolio intelligence experience for retail investors.

**Second**, retail participation remains heavily skewed towards equities, with limited awareness of and access to alternate investment instruments such as REITs, InvITs, corporate bonds, and other fixed-income products. This concentration is compounded by the lag between financial product innovation and investor comprehension — new instruments are regularly introduced, but investor understanding often lags, creating risks of mis-selling, unsuitable investment decisions, and shallow capital market participation. No integrated digital platform currently enables a retail investor to discover, understand, assess suitability for, and invest across multiple asset classes through a single interface.

Together, these gaps result in a fragmented, opaque, and inequitable investing experience where sophisticated portfolio intelligence and multi-asset access remain the preserve of institutional investors and high-net-worth individuals, while retail investors navigate a disjointed ecosystem.

## Desired Outcome

Participants are invited to design and build an **investor super app** — a secure, unified investment platform that consolidates an investor's holdings across depositories, brokers, and asset classes into a single intelligent dashboard, while simultaneously expanding their awareness of and access to alternate instruments such as REITs, InvITs, corporate bonds, and emerging financial products.

The solution should bring together portfolio aggregation, risk and exposure analytics, and transaction intelligence on one hand, with interactive product education, risk profiling, suitability assessment, and seamless multi-asset investment access on the other — creating an end-to-end investing experience that is currently available only to institutional and high-net-worth investors, but reimagined for every retail participant in India's securities markets.

---

## Five Candidate Solution Strategies

### Strategy 1 — "Portfolio Brain": Aggregation-First Intelligence Platform
Lead with consolidation. Integrate Account Aggregator (AA) framework + NSDL/CDSL CAS (Consolidated Account Statement) parsing + broker APIs to build one unified holdings graph across equities, MFs, bonds, REITs/InvITs, ETFs. On top of that graph, layer institutional-grade analytics for retail: exposure heatmaps (sector/asset-class/issuer concentration), risk metrics (VaR, beta, drawdown, overlap analysis across MFs), goal tracking, and tax intelligence (LTCG/STCG harvesting hints). Education and multi-asset access come later as modules. **Differentiator:** deepest analytics on real consolidated data; wins on the "cross-asset portfolio intelligence" half of the statement.

### Strategy 2 — "Guided Journey": Education-and-Suitability-First Robo Layer
Lead with the awareness gap. Core is a risk-profiling and suitability engine (SEBI-aligned questionnaires + behavioral signals from actual portfolio data) that drives a personalized learning-to-investing funnel: interactive explainers for REITs, InvITs, corporate bonds, SGBs; simulated "paper portfolios" to try instruments risk-free; suitability gates before any real transaction (mis-selling protection by design). Aggregation exists but serves the personalization engine. **Differentiator:** directly attacks mis-selling and comprehension lag; strong regulatory story (investor protection first).

### Strategy 3 — "Open Rails": API-Orchestration Marketplace Super App
Build the app as a thin, elegant orchestration layer over existing rails: AA for data, RTAs/depositories for holdings, exchange APIs (NSE goBID, BSE Direct, RFQ platform for bonds) and OBPP-registered platforms for transactions, KRA/CKYC for onboarding. The super app never becomes a broker — it routes orders to the user's existing brokers/platforms via smart deep-links or embedded flows. Marketplace model lets any SEBI-registered product plug in. **Differentiator:** most realistic to ship and regulator-friendly; scalability story — "UPI for investing."

### Strategy 4 — "AI Copilot": Conversational Investment Intelligence
Center the experience on an AI copilot (LLM-driven, vernacular multi-language) that sits on top of consolidated portfolio data. Users ask: "Why did my portfolio drop today?", "Am I overexposed to banks?", "Explain this InvIT like I'm new", "What bond matches my 3-year goal?" Copilot handles explanation, risk narration, suitability conversation, nudges (concentration alerts, idle-cash alerts), and guided transaction handoff. Guardrails: advice boundaries per SEBI RIA rules — information + education, not unregulated advice. **Differentiator:** accessibility and inclusion (voice + vernacular reaches Bharat, not just metros); demo-friendly wow factor.

### Strategy 5 — "Trust Fabric": Compliance-Native Investor Protection Platform
Lead with trust infrastructure. Every product listed carries a standardized machine-readable "risk label" (like nutrition labels): issuer quality, liquidity score, complexity grade, suitability tier. Verified-only universe (scrapes SEBI/exchange registries to block unregistered schemes), fraud/dark-pattern alerts, consent-ledger for data sharing (DPDP-aligned), immutable audit trail of every suitability check and disclosure shown. Aggregation + investing features built inside this trust envelope. **Differentiator:** strongest alignment with SEBI's mandate; positions app as public-good infrastructure, judges from regulator will resonate.

### Hybrid Version(for later discussion)
Strategy 1 (aggregation core) + Strategy 4 (AI copilot UX) + suitability gates from Strategy 2, with Strategy 3's open-rails architecture underneath. Strategies map to modules, not mutually exclusive apps.
