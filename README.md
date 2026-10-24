# VerdictPay — an AI jury for every payment

> **Hackathon branch.** VerdictPay is the entry for **Build What's Next with PayPal and AI**, built on top of The Verdict Chamber. The original project is preserved unchanged on the [`main` branch](https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main).

VerdictPay puts an adversarial AI jury between you and the checkout button. Describe a purchase, subscription or invoice. Four AI counsel argue it out over computed evidence, a judge rules **PROCEED**, **MODIFY** or **REJECT**, and PayPal then charges only the amount the jury approved, and only after you confirm.

AI decision support, not financial advice. Payments run in the PayPal **sandbox**.

## How it works

1. **Describe the payment.** What it is, who gets paid, the amount in USD, how it bills (one-time, monthly, yearly), why, your monthly budget and current subscriptions. Three built-in examples cover each verdict.
2. **Evidence, not vibes.** The server computes facts from your inputs: amount due now, first-year cost, share of monthly budget, money left afterwards, overlap with existing subscriptions, urgency wording ("limited-time", "ends tonight") and missing reasons. The AI argues over these numbers; it never makes them up.
3. **Five agents, in order.** Advocate (case for), Skeptic (case against), Budget Officer (affordability and lock-in), Analyst (the numbers), then the Presiding Judge, who sees every prior argument.
4. **A structured verdict.** The judge returns schema-validated output: outcome, approved amount, required change (for MODIFY), key risks, confidence, risk score and a "reconsider if" condition. Server-side rules enforce the money logic regardless of what the model says: PROCEED pays the requested amount, MODIFY never pays more than requested, REJECT pays nothing.
5. **You confirm, PayPal pays.** The server signs the approval. You tick an explicit confirmation, the PayPal button appears, and the server creates a PayPal order for exactly the signed amount and captures it after you approve in the PayPal popup. REJECT shows no button.
6. **Audit trail.** Every review is saved in the browser with the decision, evidence, full debate, verdict and PayPal order and capture IDs. History shows how many payments the jury changed or rejected and how many dollars were requested but not approved.

## How PayPal and AI are used

| | What | How |
| --- | --- | --- |
| **AI** | Google Gemini (`gemini-3.8-flash` by default) through the Vercel AI SDK (`ai`, `@ai-sdk/google`) | Four counsel stream arguments with `streamText`; the judge returns a typed verdict with `generateObject` and a Zod schema. Prompts tell every agent to cite the computed evidence and to treat user-typed text as untrusted data. |
| **PayPal** | PayPal REST **Orders v2** API (OAuth client credentials, create order, capture order) and the **PayPal JavaScript SDK** buttons, sandbox environment | The verdict decides whether an order can exist and for how much. `POST /api/paypal/orders` creates an order only from a valid server-signed approval; `POST /api/paypal/orders/[id]/capture` captures it after buyer approval. Both send `PayPal-Request-Id` so retries and double clicks do not create duplicate orders or captures. |

### Why the payment is safe to automate

- Verdicts live in the browser, so the server **signs** each approval (HMAC-SHA256, 30-minute expiry) with the decision id, approved amount, outcome, title and payee. A client cannot raise the amount, change the description, or pay for a rejected decision.
- The PayPal client secret never reaches the browser; only the client ID (public by design) does.
- The user must tick a confirmation stating the exact amount and payee before checkout opens.
- If Gemini is missing or a call fails, a deterministic demo jury stands in and the UI says so ("Demo jury" banner, `DEMO JUROR` chips), so a demo never silently pretends to be live AI.

## Architecture

```
Browser (Next.js client)                 Server (Next.js route handlers)                  External
─────────────────────────                ───────────────────────────────                  ────────
/verdict/new   DecisionForm
               └─ saves decision (localStorage)
/verdict/[id]  JuryRoom ── POST /api/jury ──► validate (Zod) → buildEvidence()
                                              runJury: Advocate → Skeptic → Budget → Analyst ─► Gemini (streamText)
                                                       Judge ──────────────────────────────────► Gemini (generateObject)
                                              normalizeVerdict()  (money rules)
               ◄── SSE: arguments, verdict + signApproval() token
               PaymentPanel: user confirms
               PayPal JS SDK Buttons
                 createOrder ─► POST /api/paypal/orders ──► verifyApproval() → Orders v2 create ─► PayPal sandbox
                 onApprove   ─► POST /api/paypal/orders/[id]/capture ─► Orders v2 capture ──────► PayPal sandbox
               receipt saved with verdict (localStorage)
/verdict/history  audit trail + impact summary
```

## Run it locally

Requirements: Node.js 22.12 or newer and npm.

```sh
git clone https://github.com/kunalchoubey1108-png/The-Verdict-Chamber.git
cd The-Verdict-Chamber
git switch hackathon
npm ci
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start a review**, then one of the **Try an example** buttons.

With no keys at all the full flow still runs: the demo jury argues and rules, and the payment step records a clearly labelled simulated payment. Add the keys below for live AI and real sandbox payments.

### Environment variables

| Variable | Needed for | Purpose |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Live AI | Gemini API key ([get one](https://aistudio.google.com/app/apikey)). `GEMINI_API_KEY` is accepted as an alias. |
| `GEMINI_MODEL` | Optional | Model override; defaults to `gemini-3.8-flash`. |
| `PAYPAL_CLIENT_ID` | Real payments | PayPal **sandbox** REST app client ID ([create an app](https://developer.paypal.com/dashboard/applications/sandbox)). Sent to the browser for the PayPal button. |
| `PAYPAL_CLIENT_SECRET` | Real payments | PayPal sandbox REST app secret. Server-side only. |
| `VERDICT_SIGNING_SECRET` | Real payments | Random string of at least 32 characters, e.g. `openssl rand -hex 32`. Signs jury approvals; without it, payments are disabled when PayPal is configured. |

Never commit `.env.local` (it is in `.gitignore`). Only use sandbox credentials.

### Make a real sandbox payment

1. Create a sandbox REST app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox) and put its client ID and secret in `.env.local`.
2. Set `VERDICT_SIGNING_SECRET` and restart `npm run dev`.
3. In the dashboard under **Sandbox → Accounts**, note the generated *Personal* (buyer) account.
4. Run the **Annual design app** example (the jury modifies it to monthly billing), tick the confirmation, click the PayPal button and log in with the sandbox buyer account.
5. The receipt shows the PayPal order and capture IDs, and the payment appears in the sandbox merchant account.

### Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Demo walkthrough

The outcomes below are what the built-in demo jury returns; a live Gemini jury reads the same evidence but may rule differently.

1. **Annual design app** ($1,188/year, overlaps an existing tool, 79% of the budget) → **MODIFY**: start monthly at $99. Confirm and pay $99 with PayPal.
2. **Flash-sale course** ($400, "limited-time", overlaps a course platform) → **REJECT**: no PayPal button, $400 not spent.
3. **Ergonomic keyboard** ($129, fits the budget, no overlap) → **PROCEED**: pay $129.
4. Open **History** to see the audit trail, PayPal IDs and the impact summary.

The full judge-facing script is in [`docs/demo-script.md`](docs/demo-script.md).

## Routes

- `/` — landing page
- `/verdict/new` — describe a payment (or load an example)
- `/verdict/[id]` — live deliberation, verdict and payment
- `/verdict/history` and `/verdict/history/[id]` — saved reviews, receipts and impact summary
- `POST /api/jury` — validates a decision, recomputes evidence, streams jury events (SSE); the verdict event carries the signed approval
- `POST /api/paypal/orders` — creates a sandbox order from a valid approval
- `POST /api/paypal/orders/[id]/capture` — captures a buyer-approved order

## Project structure

- `app/` — pages and API route handlers
- `components/verdict/` — decision form, evidence panel, jury room, juror cards, verdict card, payment panel
- `lib/decision/` — deterministic evidence
- `lib/agents/` — prompts, sequential orchestration, verdict schema, money rules, demo jury
- `lib/payments/` — approval signing and the PayPal Orders v2 client
- `lib/validation/`, `lib/types/` — shared schemas and contracts
- `docs/` — Devpost write-up, demo-video script, pitch outline

## Known limitations

- **Sandbox only.** The PayPal host is hard-wired to the sandbox; there is no live-payment mode.
- **One-time charges.** MODIFY to "monthly billing" charges the first month as a one-time order; PayPal Subscriptions, refunds and webhooks are not implemented.
- **Browser storage.** Decisions, verdicts and receipts live in the browser's localStorage; there are no accounts or server database. Use **Download Report Archive** on the history page to keep a copy.
- **Evidence comes only from your inputs.** VerdictPay does not look up prices, merchants or your PayPal transaction history.
- **Approval window.** A signed approval expires after 30 minutes; after that, start a new review to pay.
- **Function time.** The jury route is capped at 60 seconds (`maxDuration`); five sequential model calls on a slow model may need a higher limit on your hosting plan.

## Roadmap (not built)

- PayPal Subscriptions for approved recurring plans, and refunds for reversed decisions
- Webhooks to reconcile payment status server-side
- Pulling real context from PayPal transaction history to spot recurring spend
- Letting AI shopping agents call VerdictPay as a guardrail before they spend

## The original project

The Verdict Chamber, on `main`, is a pre-trade stock research app: submit an investment thesis and a five-role jury (Bull, Bear, Risk, Quant, Judge) reviews it against market evidence. VerdictPay keeps its core idea, a structured adversarial AI review, and points it at everyday payments with PayPal executing the outcome.

- Browse the original: https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/main
- See every hackathon change: `git diff main...hackathon`

## License

[MIT](LICENSE)
