# ⚖️ The Verdict Chamber — Pre-Trade Risk Intelligence
### WE STRESS-TEST BEFORE YOU COMMIT CAPITAL.

**The Verdict Chamber** is a pre-trade risk arbitration platform for Indian retail investors, built for **SEBI Hackathon Problem Statement 3: Super App for Unified Multi-Asset Investing and Awareness**.

Pick any NSE stock + intended allocation → five adversarial AI agents cross-examine it and deliver a **TRADE / WATCH / AVOID** verdict with confidence, risk score, trap probability, and a single **Thesis Killer** invalidation condition.

Built on top of **NiveshOS — "Every asset. One brain."** — a unified portfolio intelligence super-app that consolidates holdings across brokers, depositories & asset classes.

---

## What it does

**A. The Verdict Chamber (Next.js app) — adversarial jury**
- 5-agent sequential jury: **Bull Counsel → Bear Counsel → Risk Officer → Quant Analyst → Presiding Judge**
- Powered by **Google Gemini 1.5-flash** via Vercel AI SDK, streamed live as SSE (`agent_start / agent_chunk / agent_done / verdict`)
- Works with **no API key** — deterministic simulation engine + graceful fallback so demo never breaks
- 6-factor deterministic signal engine: Momentum, Volume Anomaly, Volatility, Risk:Reward, Trap Score, News Sentiment → weighted Composite (momentum×0.25, R:R×0.30, trap×0.15, volume×0.15, volatility×0.10, sentiment×0.05)
- Nifty 50 regime classifier: Trending Up / Down / Ranging / Risk-Off
- **Digital Twin portfolio impact:** new position %, sector concentration delta, correlation warning, VaR delta
- Live NSE/BSE quotes via **Finnhub** (server-side, 60s cache) with deterministic mock fallback
- 100% auditable: full transcript + verdict card saved to localStorage Audit Journal (`/verdict/history`)
- Zero executions — pure pre-trade decision intelligence, SEBI RIA-safe disclaimers on every answer

**B. NiveshOS (embedded portfolio super-app) — unified intelligence**
- Aggregation across 4 mock rails: Zerodha (NSDL), Groww (CDSL), HDFC Securities (NSDL), MF folios (CAMS/KFintech)
- Institutional analytics for retail: Net Worth / Day P&L tiles, asset-class donut, 30-day value line, sector exposure bars, issuer concentration alerts, MF overlap analysis, risk gauge 0-100
- Suitability engine: `allowed iff (SEBI-registered) AND (lesson completed) AND (tier >= minTier)` — blocked cards show which gate failed with deep-link
- 5 interactive lessons (REITs, InvITs, Corporate Bonds, SGB, Diversification) with 3-question quizzes that unlock products
- 10-product catalog + 1 scam (`QuickRich Agro Gold 24% assured` — always BLOCKED), risk nutrition labels (Grade A-E, liquidity, complexity)
- Rule-based copilot (10 intents), AA consent ledger (DPDP-aligned), immutable audit trail, verified-vs-blocked registry
- Real market data, zero cost: Yahoo Finance snapshot (build-time) + AMFI NAVs live in-browser + TradingView widget
- 6 distinct demo personas (Priya, Rajesh, Ananya, Farhan, Sunita, Vikram — ₹0.3L to ₹15.6L), per-user localStorage namespacing

## Stack
Next.js 15 · React 19 · TypeScript · Tailwind CSS · Vercel AI SDK (`ai` + `@ai-sdk/google`) · Zod + React Hook Form · Finnhub · NiveshOS vanilla JS (data.js/app.js/anim.js + vendored GSAP, works offline via `file://`)

## Run locally
```bash
cp .env.local.example .env.local
# fill GOOGLE_GENERATIVE_AI_API_KEY + FINNHUB_API_KEY (optional — demo mode works without)
npm install
npm run dev
Open / for landing + Digital Twin, /verdict/new for docket, /verdict/history for audit journal.
AI-generated analysis for informational / pre-trade decision support only. Not investment advice. Consult a SEBI-registered investment adviser.

### 3. Topics/tags (copy-paste)

sebi-hackathon, fintech, nse-bse, multi-agent-ai, gemini-ai, pre-trade-risk, portfolio-analytics, reit-invit-bonds, nextjs, investor-awareness# The-Verdict-Chamber
# The-Verdict-Chamber
