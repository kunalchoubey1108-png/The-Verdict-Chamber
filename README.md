# The Verdict Chamber

The Verdict Chamber is a pre-trade risk intelligence app. Submit an investment thesis and the app assembles available market evidence, then streams a structured review from a five-role jury: Bull, Bear, Risk, Quant, and Judge. When Gemini is not configured, the jury uses a deterministic simulated response. This is decision-support software for educational purposes, not personalized investment advice.

The canonical application is the Next.js app in this repository. The older NiveshOS static prototype and its original build contract are retained as legacy context; they are not the instructions for running this app.

## Requirements

- Node.js 22.12 or newer
- npm

## Run locally

```sh
npm ci
cp .env.local.example .env.local
# Add API keys to .env.local if live integrations are wanted.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without API keys, the app can still run with its simulated jury and fallback evidence. Set `GOOGLE_GENERATIVE_AI_API_KEY` to enable Gemini and `FINNHUB_API_KEY` for Finnhub quote data. Both are optional for local development. `GEMINI_API_KEY` is also accepted as an alternate Gemini key name. See `.env.local.example` for the complete list.

## Checks and production run

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the most recent production build.

## Deploy to Vercel

1. Import this repository into Vercel and set the project root to `The-Verdict-Chamber` if importing the parent repository.
2. Use the Next.js framework preset and Node.js 22.12 or newer.
3. Add `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`) and `FINNHUB_API_KEY` in the Vercel project environment settings for the environments that need them. Keep these server-side; never add them as `NEXT_PUBLIC_` variables.
4. Deploy. `vercel.json` selects the Mumbai (`bom1`) region.

The jury route has a conservative 60-second function duration cap. If longer Gemini responses are needed, adjust `maxDuration` in `app/api/jury/route.ts` to a value supported by the project’s Vercel runtime and plan.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Gemini API key for model-generated jury arguments. `GEMINI_API_KEY` is an accepted alias. |
| `FINNHUB_API_KEY` | No | Finnhub quote integration; fallback evidence is used when unavailable. |
| `GEMINI_MODEL` | No | Gemini model override; defaults to `gemini-1.5-flash`. |

Never commit `.env.local`. If a credential is exposed, revoke it with its provider and replace it in local and deployment settings.

## Main routes

- `/` — product entry point
- `/verdict/new` — submit a thesis
- `/verdict/[id]` — view the jury deliberation and verdict
- `/verdict/history` — review saved verdicts
- `POST /api/evidence` — assemble evidence for a thesis
- `POST /api/jury` — stream jury events as server-sent events
- `GET /api/quotes` — quote endpoint

Verdict history is stored in the current browser only. Use **Download Report Archive** on the history page to save a versioned JSON copy. The archive may include thesis details, evidence, and jury arguments; it is generated locally and should be handled like private financial information. There is no cloud account sync or import flow.

The NiveshOS section uses local demo profiles. It does not connect to Account Aggregators, brokers, or a live registry, and all order handoffs are simulations. Its **Import CAS** tool reads supported statement files in the browser; no statement is uploaded. CSV files need a header row with a name, symbol, or ISIN plus quantity and market value columns (for example `Name,Symbol,ISIN,Asset Class,Quantity,Market Value`). Imports are limited to 10 MB per file, 2 MB of extracted text, and 1,000 holding rows. Review and confirm rows before they are saved to browser storage. The parser is best-effort for text PDFs; scanned or password-protected PDFs are not supported.

## Project structure

- `app/` — Next.js App Router pages, layouts, and API routes
- `components/verdict/` — thesis, evidence, jury, and verdict UI
- `lib/agents/` — jury prompts and orchestration
- `lib/signals/` — quote retrieval and evidence calculations
- `lib/types/` and `lib/validation/` — shared contracts and input validation
- `tools/` — market snapshot utilities

`README.ai` contains additional contributor guidance. `BUILD_SPEC.md` describes the retained NiveshOS prototype and is labeled as legacy documentation.
