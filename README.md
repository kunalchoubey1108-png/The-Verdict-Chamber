# The Verdict Chamber — Hackathon Edition (working title: VerdictPay)

> **You are on the `hackathon` branch.** This branch holds the hackathon version of the project. The original, untouched Verdict Chamber lives on the [`main` branch](https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main).

## The original project: Verdict Chamber

The Verdict Chamber is a pre-trade risk intelligence app. Submit an investment thesis and the app assembles available market evidence, then streams a structured review from a five-role jury: Bull, Bear, Risk, Quant, and Judge. When Gemini is not configured, the jury uses a deterministic simulated response. This is decision-support software for educational purposes, not personalized investment advice.

The canonical application is the Next.js app in this repository. The older NiveshOS static prototype and its original build contract are retained as legacy context; they are not the instructions for running this app.

## The hackathon version

This branch is the starting point for the hackathon submission. It may evolve Verdict Chamber into a new product, provisionally called **VerdictPay**, while `main` stays frozen as the reference version.

**Purpose:** _TODO — one or two sentences on the problem VerdictPay solves and the hackathon theme/track it targets._

### What changed for the hackathon

Keep this list current as work lands on this branch:

- Branched from `main` at commit `3b308e2` (the original Verdict Chamber).
- Hardened `.gitignore` for secrets and credentials (private keys, certificates, credential JSON files, `.vercel/`, logs, coverage).
- Rewrote this README to document both versions.
- _TODO — add VerdictPay features, changed routes, new integrations, and new environment variables here._

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
| `FINNHUB_API_KEY` | No | Finnhub quote integration; fallback evidence is used when unavailable. Get one at https://finnhub.io/register. |
| `GEMINI_MODEL` | No | Gemini model override; defaults to `gemini-1.5-flash`. |

Keep keys server-side; never expose them as `NEXT_PUBLIC_` variables. Never commit `.env.local` (it is ignored by `.gitignore`). If a credential is exposed, revoke it with its provider and replace it in local and deployment settings.

## Deploy to Vercel

1. Import this repository into Vercel and select the `hackathon` branch as the production branch for the hackathon deployment (or use a preview deployment of that branch).
2. Use the Next.js framework preset and Node.js 22.12 or newer.
3. Add the environment variables above in the Vercel project settings.
4. Deploy. `vercel.json` selects the Mumbai (`bom1`) region.

The jury route has a conservative 60-second function duration cap. If longer Gemini responses are needed, adjust `maxDuration` in `app/api/jury/route.ts` to a value supported by the project's Vercel runtime and plan.

## Main routes

- `/` — product entry point
- `/verdict/new` — submit a thesis
- `/verdict/[id]` — view the jury deliberation and verdict
- `/verdict/history` — review saved verdicts
- `POST /api/evidence` — assemble evidence for a thesis
- `POST /api/jury` — stream jury events as server-sent events
- `GET /api/quotes` — quote endpoint

Verdict history is stored in the current browser only. Use **Download Report Archive** on the history page to save a versioned JSON copy. The archive may include thesis details, evidence, and jury arguments; it is generated locally and should be handled like private financial information.

The NiveshOS section uses local demo profiles. It does not connect to Account Aggregators, brokers, or a live registry, and all order handoffs are simulations. Its **Import CAS** tool reads supported statement files in the browser; no statement is uploaded.

## Project structure

- `app/` — Next.js App Router pages, layouts, and API routes
- `components/verdict/` — thesis, evidence, jury, and verdict UI
- `lib/agents/` — jury prompts and orchestration
- `lib/signals/` — quote retrieval and evidence calculations
- `lib/types/` and `lib/validation/` — shared contracts and input validation
- `tools/` — market snapshot utilities

`README.ai` contains additional contributor guidance. `BUILD_SPEC.md` describes the retained NiveshOS prototype and is labeled as legacy documentation.

## Accessing the original version

The original Verdict Chamber is preserved unchanged on `main`:

- Browse: https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main
- Locally:

```sh
git switch main
```

Switch back to the hackathon version with `git switch hackathon`.
