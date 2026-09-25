# BUILD_SPEC — "NiveshOS" Investor Super App Prototype

Read `README.md` first for the problem statement and the five merged strategies. This spec is the binding contract between the two build agents. Do not deviate from the DOM contract, data schema, or file ownership without noting it in your final report.

## Product name
**NiveshOS** — tagline: "Every asset. One brain."

## Zero-cost constraint
Static web app. Opens via `file://` double-click in any browser. No build step, no npm, no CDN at runtime (GSAP is vendored in `vendor/`), no external fonts (system font stack), no API calls. All data is mock, defined in `data.js`, simulating Account Aggregator / NSDL / CDSL / CAS feeds. State persists in `localStorage` under keys prefixed `niveshos.`.

## File ownership (hard boundary — do not edit the other agent's files)

| File | Owner |
|---|---|
| `data.js` | Agent A (logic) |
| `app.js` | Agent A (logic) |
| `index.html` | Agent B (UI) |
| `styles.css` | Agent B (UI) |
| `anim.js` | Agent B (UI) |
| `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js` | already present, do not touch |

Script load order in `index.html` (Agent B must emit exactly this, at end of `<body>`):
```html
<script src="vendor/gsap.min.js"></script>
<script src="vendor/ScrollTrigger.min.js"></script>
<script src="data.js"></script>
<script src="app.js"></script>
<script src="anim.js"></script>
```

## Design language (Agent B, but Agent A's charts must match)

Dark-first premium fintech. NOT a generic white bootstrap page. Think Bloomberg-terminal-meets-consumer-fintech: deep near-black surfaces, one restrained accent, glassy elevated cards, generous spacing, confident typography. Light mode also supported via `prefers-color-scheme` + a manual toggle (`data-theme` attribute on `<html>`; dark is default).

### Design tokens (CSS custom properties on `:root`, dark values default)

```css
:root {
  --bg:            #0d0d0d;   /* page plane */
  --surface:       #1a1a19;   /* cards / chart surface */
  --surface-2:     #232322;   /* elevated / hover */
  --ink:           #ffffff;
  --ink-2:         #c3c2b7;
  --ink-muted:     #898781;
  --hairline:      rgba(255,255,255,0.10);
  --grid:          #2c2c2a;
  --accent:        #3987e5;   /* series-1 blue — THE accent, use sparingly */
  --good:          #0ca30c;
  --warn:          #fab219;
  --serious:       #ec835a;
  --critical:      #d03b3b;
  /* categorical chart series, fixed order, never cycled */
  --s1: #3987e5; --s2: #199e70; --s3: #c98500; --s4: #008300;
  --s5: #9085e9; --s6: #e66767; --s7: #d55181; --s8: #d95926;
}
[data-theme="light"] {
  --bg: #f9f9f7; --surface: #fcfcfb; --surface-2: #f0efec;
  --ink: #0b0b0b; --ink-2: #52514e; --ink-muted: #898781;
  --hairline: rgba(11,11,11,0.10); --grid: #e1e0d9;
  --accent: #2a78d6;
  --s1: #2a78d6; --s2: #1baf7a; --s3: #eda100; --s4: #008300;
  --s5: #4a3aa7; --s6: #e34948; --s7: #e87ba4; --s8: #eb6834;
}
```

Font: `system-ui, -apple-system, "Segoe UI", sans-serif`. Hero numbers large (clamp ~2.2–3rem, weight 700). Tabular numerals (`font-variant-numeric: tabular-nums`) on tables and tickers. Border radius 12–16px cards, 8px controls. Hairline borders, subtle shadows only in light mode; in dark mode elevation = lighter surface, not shadow.

### Chart rules (Agent A implements charts as inline SVG in app.js)
- Palette above, fixed slot order. Dark palette passed the validator with CVD in floor band → **every multi-series chart ships direct labels** (text next to marks), plus a legend for ≥2 series. Single series: no legend.
- Thin marks: bars ≤ 24px wide with 2px gaps between adjacent fills, 4px rounded ends away from baseline only; lines 2px; donut stroke ~22px with 2px surface gaps between segments.
- One axis only, never dual-axis. Gridlines `var(--grid)` hairline. Axis text `var(--ink-muted)` 11px.
- Text in charts always ink tokens, never series color.
- Hover layer required: tooltip div (`#chart-tooltip`, provided by Agent B in DOM, styled) — app.js positions/fills it on mark hover; crosshair on line chart.
- Numbers in ₹ Indian format (use `Intl.NumberFormat('en-IN')`, e.g. ₹12,45,300).

## DOM contract (Agent B builds; Agent A queries by these IDs — both must match exactly)

App shell: fixed left sidebar nav (desktop) that collapses to bottom tab bar on mobile (<768px). Main content area swaps panels.

```
<body>
  <div id="app">
    <aside id="sidebar">          brand block ("NiveshOS" + logo mark), nav
      <nav>
        buttons: data-panel="dashboard|analytics|learn|profile|invest|copilot|trust"
        each: <button class="nav-btn" data-panel="..."> with svg icon + label
      </nav>
      <button id="theme-toggle">
      <div id="investor-chip">    avatar initials + "Priya Sharma" + PAN masked
    </aside>
    <main id="main">
      <section class="panel" id="panel-dashboard">
      <section class="panel" id="panel-analytics">
      <section class="panel" id="panel-learn">
      <section class="panel" id="panel-profile">
      <section class="panel" id="panel-invest">
      <section class="panel" id="panel-copilot">
      <section class="panel" id="panel-trust">
    </main>
  </div>
  <div id="chart-tooltip" hidden></div>
  <div id="modal-root" hidden></div>     generic modal shell: .modal-card inside
  <div id="toast-root"></div>
  <div id="onboarding"></div>            first-run AA consent flow overlay
</body>
```

Panel visibility: `.panel` hidden by default; `.panel.active` visible. app.js handles switching (adds/removes `.active`, updates `.nav-btn.active`) and dispatches `window.dispatchEvent(new CustomEvent('panelchange', {detail:{panel}}))` — anim.js listens to run entrance animations. app.js also dispatches `'niveshos:rendered'` (once, after first full render) and `'niveshos:onboarded'` (after consent flow completes).

### Inside each panel, Agent B provides EMPTY containers with these IDs; Agent A renders content into them:

**panel-dashboard**: `#kpi-row` (4 stat tiles: Net Worth, Day P&L, Total Invested, Idle Cash), `#alloc-donut` (asset-class donut + legend), `#value-line` (30-day portfolio line chart + range note), `#accounts-strip` (linked account cards: broker name, depository, value, sync badge), `#holdings-table` (all holdings, columns: Instrument, Type, Account, Qty, Value, Day Δ), `#alerts-feed` (intelligence alerts list).

**panel-analytics**: `#sector-bars` (horizontal sector-exposure bars), `#concentration-card` (top-issuer concentration + status), `#overlap-card` (MF overlap analysis), `#risk-score-card` (portfolio risk gauge 0–100 + label), `#asset-mix-card` (your mix vs suggested mix for your risk profile — two thin stacked bars).

**panel-learn**: `#lesson-grid` (lesson cards) — clicking opens lesson modal (renders into `#modal-root`): sections + 3-question quiz; pass = ≥2 correct → marks lesson complete, unlocks product category, toast + confetti-free (no external libs) micro-celebration handled by anim.js listening for `'niveshos:lesson-complete'` CustomEvent.

**panel-profile**: `#risk-quiz` (6 questions, one visible at a time, progress bar) → result card `#risk-result` (tier: Conservative / Balanced / Aggressive, score, what it unlocks). Retake allowed.

**panel-invest**: `#suitability-banner` (shows current profile tier or "take the quiz" CTA), `#product-grid` (product cards: name, category chip, risk-label block styled like a nutrition label — Risk grade A–E, Liquidity, Complexity, Min invest, Yield/Return, SEBI-registered badge or BLOCKED banner). Card click → detail modal with full label + Invest button. Invest flow (in modal): suitability check → if blocked show reason + path to unlock; if suitable → amount input → "Route order via <user's broker>" simulated 3-step progress (Order created → Sent to broker → Confirmed) → holding appears in dashboard, audit entry logged.

**panel-copilot**: `#chat-log`, `#chat-suggestions` (chips: "Why is my portfolio down today?", "Am I overexposed anywhere?", "Explain REITs simply", "What should I do with idle cash?", "Show my riskiest holding"), `#chat-form` with `#chat-input` + send button. Assistant messages render markdown-lite (bold, lists). Typing indicator while "thinking" (600–900ms fake delay).

**panel-trust**: `#consent-ledger` (AA consents granted: scope, date, expiry, revoke button), `#audit-trail` (chronological log: warnings shown, suitability checks, orders, lesson completions), `#registry-card` (explainer: every product checked against mock SEBI/exchange registry; count verified vs blocked).

### Onboarding (first run only, `localStorage niveshos.onboarded` unset)
Full-screen overlay in `#onboarding`, 3 steps: (1) welcome + what NiveshOS is, (2) simulated AA consent — checkboxes for NSDL demat, CDSL demat, MF folios (CAMS/KFintech), bank balance, each with plain-language scope text, Grant Consent button, (3) animated "fetching from 4 sources" sequence (progress rows per source) → done → app renders. Agent B builds structure/styles; Agent A drives logic + writes consent entries to ledger. Skippable via "use demo data" link (same result).

## Data schema (`data.js` — Agent A. Global `const NIVESH_DATA = {...}`)

- `investor`: {name: "Priya Sharma", pan: "ABCPS****K", riskProfile: null}
- `accounts`: 4 — Zerodha (NSDL), Groww (CDSL), HDFC Securities (NSDL), MF folios via CAMS. Each: id, broker, depository, type, lastSync.
- `holdings`: ~14 across accounts. Equities incl. HDFCBANK + ICICIBANK held at TWO brokers (dupe-merge demo), RELIANCE, TCS, INFY, TATAMOTORS, bank-heavy tilt (~38% financials for concentration alert). 2 mutual funds WITH `underlying` top-5 holdings arrays that overlap ≥60% (overlap demo). 1 corporate bond, 1 gold ETF, idle cash ₹52,000. Each holding: id, accountId, symbol, name, assetClass (equity|mf|bond|reit|invit|etf|cash), sector, qty, avgPrice, ltp, dayChangePct.
- `history`: 30 daily portfolio totals ending today (2026-07-06), realistic wobble, last day −1.4% (drives "why am I down" answer: TATAMOTORS −3.8% + financials dip).
- `products`: 9 catalog entries — Embassy REIT, Mindspace REIT, PowerGrid InvIT, IndiGrid InvIT, 2 corporate bonds (AAA Tata Capital 8.1%, AA- Piramal 9.4%), SGB tranche, NIFTY index fund, T-bill 91d. PLUS 1 scam: "QuickRich Agro Gold Scheme, 24% assured" `registered:false` → always BLOCKED. Each: id, name, category, riskGrade (A–E), liquidity (High/Med/Low), complexity (1–3), minInvest, yieldOrReturn, issuerRating, registered, requiredLesson (lesson id or null), minTier (conservative|balanced|aggressive).
- `lessons`: 5 — REITs, InvITs, Corporate Bonds, SGB, Diversification. Each: id, title, emoji, minutes, sections [{h, p} plain-language, analogy-driven], quiz [3 × {q, options[4], answer}].
- `riskQuiz`: 6 questions with weighted options → score → tier thresholds: ≤10 conservative, 11–17 balanced, ≥18 aggressive.
- `copilotIntents`: keyword→handler mapping table lives in app.js, not data.

## app.js responsibilities (Agent A)
State (load/save localStorage): riskProfile, completedLessons[], purchases[], consents[], auditTrail[], onboarded, theme. Render all panels from data + state. Charts as inline SVG (no lib). Panel router. Onboarding logic. Suitability engine: product allowed iff (registered) AND (requiredLesson completed) AND (tier rank ≥ minTier rank); blocked card states show WHICH gate failed and deep-link to it (switch panel). Copilot: rule-based intent matching (regex/keywords) over ~10 intents, answers COMPUTED from live portfolio (numbers must match dashboard); unknown → helpful fallback listing capabilities. Every consequential action → auditTrail entry. Expose `window.NIVESH = {switchPanel, state, fmt}` for anim.js/debug.

Keep it vanilla, readable, no frameworks, no build. ~Modules via top-level functions per panel. Guard all DOM lookups (null-safe) so a missing container never crashes the app.

## anim.js responsibilities (Agent B) — GSAP, vendored
- Respect `prefers-reduced-motion: reduce` → `gsap.globalTimeline.timeScale(1000)` off / skip entrances, no exceptions.
- App load: sidebar + first panel staggered entrance (opacity/y, 0.5s, power2.out).
- `panelchange` event: animate incoming panel's direct children stagger 0.06s.
- Number count-up on KPI tiles (`.countup` class with `data-value`), 0.8s once visible.
- Chart draw-in: donut segments (stroke-dashoffset), line path draw, bars grow from baseline — trigger on `'niveshos:rendered'` + panelchange; keep under 0.9s, ease power2.inOut. SVG marks carry class `.anim-bar|.anim-line|.anim-donut` (Agent A adds these classes).
- Micro-interactions: nav hover, card hover lift (transform only, GPU-friendly), button press scale 0.97, toast slide-in, modal scale-fade, lesson-complete pulse.
- No scroll-jacking. ScrollTrigger only for panel-internal reveal of below-fold cards.
- Performance: animate transform/opacity only; never top/left/width; will-change sparingly.

## Copilot intents (minimum)
1. why down today → name the two draggers with numbers
2. overexposure → financials % + top issuer %
3. explain REIT / InvIT / bond / SGB (simple analogy, offer lesson link)
4. idle cash → amount + 2 suitable suggestions per tier
5. riskiest holding → highest-vol/dayChange item
6. mf overlap → the two funds + common holdings
7. what can I buy → suitability-filtered list
8. portfolio value / how am I doing → net worth + 30d change
9. is <scam name> safe → NOT registered warning
10. help/fallback → capabilities list
Every answer ends with a one-line "informational, not investment advice" note (SEBI RIA boundary).

## Karpathy guidelines (both agents)
State assumptions in final report. No overengineering: no classes-for-the-sake-of-it, no premature abstraction. Surgical, readable vanilla JS. If spec ambiguous, pick the simpler interpretation and note it. Success = app opens from file://, no console errors, every panel renders, demo moments (README) all work.

## Verification checklist (integrator runs)
1. `node --check` both JS files parse (they're browser-global scripts, still parse-checkable).
2. Open in browser: onboarding → dashboard, all 7 panels, no console errors.
3. Demo moments: dupe-merge visible, overlap + concentration alerts fire, lesson gate blocks then unlocks InvIT, scam blocked, copilot answers match dashboard numbers, audit trail fills, theme toggle + reduced-motion respected.
