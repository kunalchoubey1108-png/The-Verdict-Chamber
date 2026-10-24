# VerdictPay — Hackathon Edition of The Verdict Chamber

> **You are on the `hackathon` branch.** This branch holds the hackathon version of the project. The original, untouched Verdict Chamber lives on the [`main` branch](https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main).

## The original project: Verdict Chamber

The Verdict Chamber is a pre-trade risk intelligence app. Submit an investment thesis and the app assembles available market evidence, then streams a structured review from a five-role jury: Bull, Bear, Risk, Quant, and Judge. When Gemini is not configured, the jury uses a deterministic simulated response. This is decision-support software for educational purposes, not personalized investment advice.

## The hackathon version: VerdictPay

Built for the **Build What's Next with PayPal and AI** hackathon. VerdictPay keeps the original's adversarial jury but points it at money decisions instead of stock theses: describe a purchase, subscription or invoice, five AI agents debate it, and the judge rules **PROCEED**, **MODIFY** (pay a changed, lower-or-equal amount) or **REJECT**. PayPal then executes only what the jury and the user approve.

### What changed for the hackathon

Keep this list current as work lands on this branch:

- Branched from `main` at commit `3b308e2` (the original Verdict Chamber).
- Hardened `.gitignore` for secrets and credentials (private keys, certificates, credential JSON files, `.vercel/`, logs, coverage).
- Rewrote this README to document both versions.
- Added an MIT `LICENSE`.
- Switched the default Gemini model from the retired `gemini-1.5-flash` to `gemini-3.8-flash`.
- Added PayPal sandbox and verdict-signing placeholders to `.env.local.example`.
- Replaced the stock-thesis flow with money decisions: a decision form with demo examples, deterministic evidence (budget share, first-year cost, subscription overlap, urgency wording), new juror roles (Advocate, Skeptic, Budget Officer, Analyst, Judge) and PROCEED / MODIFY / REJECT verdicts.
- The judge now returns structured output (schema-validated) instead of JSON scraped from text, and server-side money rules cap the approved amount at the requested amount.
- The jury always delivers a verdict: if Gemini is missing or a call fails, a deterministic simulation stands in.
- Removed the stock-only code (quotes, market signals, Finnhub) and the legacy NiveshOS prototype. Both remain on `main`.
- _Upcoming: PayPal Sandbox checkout gated by the verdict (phase 2)._

To see every change relative to the original:

```sh
git diff main...hackathon
```

## Requirements

- Node.js 22.12 or newer
- npm

## Install, configure, and run

```sh
git clone https://github.com/kunalchoubey1108-png/The-Verdict-Chamber.git
cd The-Verdict-Chamber
git switch hackathon
npm ci
cp .env.local.example .env.local
# Add API keys to .env.local if live integrations are wanted.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without API keys, the app still runs with its simulated jury and fallback evidence.

### Checks and production run

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the most recent production build.

## Environment variables

Set these in `.env.local` (local) or in your hosting provider's environment settings. All are optional; the app falls back to simulated/fallback data when they are missing.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Gemini API key for model-generated jury arguments. `GEMINI_API_KEY` is an accepted alias. Get one at https://aistudio.google.com/app/apikey. |
| `GEMINI_MODEL` | No | Gemini model override; defaults to `gemini-3.8-flash`. |
| `PAYPAL_CLIENT_ID` | For payments | PayPal **sandbox** REST app client ID. Create one at https://developer.paypal.com/dashboard/applications/sandbox. |
| `PAYPAL_CLIENT_SECRET` | For payments | PayPal **sandbox** REST app secret. Server-side only. |
| `VERDICT_SIGNING_SECRET` | For payments | Random string (`openssl rand -hex 32`) used to sign jury verdicts so a payment can only be created for an approved amount. |

The PayPal and signing variables are placeholders for the upcoming PayPal integration and are not read by the app yet.

Keep keys server-side; never expose them as `NEXT_PUBLIC_` variables. Never commit `.env.local` (it is ignored by `.gitignore`). If a credential is exposed, revoke it with its provider and replace it in local and deployment settings.

## Deploy to Vercel

1. Import this repository into Vercel and select the `hackathon` branch as the production branch for the hackathon deployment (or use a preview deployment of that branch).
2. Use the Next.js framework preset and Node.js 22.12 or newer.
3. Add the environment variables above in the Vercel project settings.
4. Deploy. `vercel.json` selects the Mumbai (`bom1`) region.

The jury route has a conservative 60-second function duration cap. If longer Gemini responses are needed, adjust `maxDuration` in `app/api/jury/route.ts` to a value supported by the project's Vercel runtime and plan.

## Main routes

- `/` — product entry point
- `/verdict/new` — describe a payment (or load a demo example)
- `/verdict/[id]` — watch the jury deliberate and see the verdict
- `/verdict/history` — review saved verdicts
- `POST /api/jury` — validate a decision, recompute evidence server-side, and stream jury events as server-sent events

Decision history is stored in the current browser only. Use **Download Report Archive** on the history page to save a versioned JSON copy; it contains the decisions and jury arguments and should be handled like private financial information.

## Project structure

- `app/` — Next.js App Router pages, layouts, and the jury API route
- `components/verdict/` — decision form, evidence panel, jury room, verdict card
- `lib/decision/` — deterministic evidence computed from the decision
- `lib/agents/` — jury prompts, orchestration, and verdict rules (schema, money caps, offline fallback)
- `lib/types/` and `lib/validation/` — shared contracts and input validation

## Accessing the original version

The original Verdict Chamber is preserved unchanged on `main`:

- Browse: https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main
- Locally:

```sh
git switch main
```

Switch back to the hackathon version with `git switch hackathon`.
