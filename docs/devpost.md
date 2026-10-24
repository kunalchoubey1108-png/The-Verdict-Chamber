# VerdictPay — Devpost submission text

Copy each section into the matching Devpost field. Replace the bracketed items before submitting.

---

## Tagline

An adversarial AI jury reviews every payment before PayPal moves the money.

## Inspiration

Most bad spending isn't fraud. It's the annual plan you didn't need, the second tool that does what the first one already does, or the "offer ends tonight" course. These payments take one click, and nobody argues the other side before the money leaves.

The Verdict Chamber, the project this builds on, already had a five-agent AI jury that stress-tested stock trades before capital was committed. We asked: what if every payment got that same cross-examination, and the payment rail itself enforced the verdict?

## What it does

You describe a money decision: what it is, who gets paid, the amount, how it bills, why, plus your monthly budget and current subscriptions.

1. VerdictPay computes the evidence from your inputs: amount due now, first-year cost, share of your budget, money left afterwards, overlap with existing subscriptions and urgency wording.
2. Four AI counsel argue in order (Advocate, Skeptic, Budget Officer, Analyst), each seeing the arguments before it.
3. A Presiding Judge rules **PROCEED**, **MODIFY** or **REJECT**, with the approved amount, required change, key risks and a "reconsider if" condition.
4. If the jury approves, you confirm the exact amount and payee, and PayPal charges only that approved amount. A rejected payment never gets a PayPal button.
5. Every review is kept as an audit trail with the full debate and the PayPal order and capture IDs, plus a summary of how many payments the jury changed or rejected and how many dollars were requested but not approved.

Example: a $1,188 yearly design-app plan that overlaps a tool you already pay for and eats 79% of your monthly budget. The jury rules MODIFY: start monthly. PayPal charges $99 instead of $1,188.

## How we built it

- **Next.js 15 / React 19 / TypeScript**, Tailwind CSS, Zod for validation at every boundary, Vitest for tests.
- **AI:** Google Gemini (`gemini-3.8-flash`) via the Vercel AI SDK. The counsel stream their arguments with `streamText`; the judge returns a typed verdict with `generateObject` and a Zod schema, so the UI never scrapes JSON out of prose. Prompts require agents to cite the computed evidence and to treat user-typed text as untrusted data.
- **PayPal:** the Orders v2 REST API (OAuth client credentials, create order, capture) and the PayPal JavaScript SDK buttons, in the sandbox. Both calls send `PayPal-Request-Id` for idempotency.
- **Verdict-gated payments:** verdicts live in the browser, so the server signs each approval (HMAC-SHA256, 30-minute expiry) with the decision, approved amount, outcome and payee. The order endpoint creates a PayPal order only from a valid signature and only for the signed amount.
- **Money rules outside the model:** whatever the model returns, PROCEED pays the requested amount, MODIFY never exceeds it, and REJECT pays nothing.
- **Honest demo mode:** without a Gemini key (or if a call fails) a deterministic jury stands in, and the UI labels it so it never looks like live AI.

## Challenges we ran into

- **Trusting an LLM with money.** A model can return any number. We moved every money rule into server code, capped the approved amount at the request, and made the payment endpoint accept only server-signed approvals.
- **No database, but payments need integrity.** Signed, expiring approvals and PayPal idempotency keys gave tamper-proof, double-click-safe payments without adding a database.
- **Structured verdicts.** The original judge embedded JSON in free text; when the model drifted, reviews dead-ended. Switching to schema-validated structured output, with a guaranteed fallback, fixed it.
- **Re-pointing a stock-research product** at everyday payments without losing what made it work: the sequential, adversarial jury.

## Accomplishments that we're proud of

- The AI's verdict changes what PayPal does: whether an order can exist and for how much.
- A MODIFY verdict is a real outcome, not a soft "maybe": the user pays a different, smaller amount.
- The full flow, from decision to debate to verdict to confirmation to PayPal capture to audit trail, runs end to end, and also runs with no keys in a clearly labelled demo mode.

## What we learned

- Agentic payments need a contract between the AI layer and the payment layer: signed, scoped, expiring permissions, not "the model said so".
- Structured output plus deterministic guard rails beats prompt engineering alone for anything that touches money.

## What's next for VerdictPay

- PayPal Subscriptions for approved recurring plans, and refunds for reversed decisions
- Webhooks for server-side payment reconciliation
- Using PayPal transaction history as evidence to spot recurring spend
- An API so AI shopping agents can ask VerdictPay for a verdict before they spend

## Built with

nextjs, react, typescript, tailwindcss, zod, vercel-ai-sdk, google-gemini, paypal-orders-api, paypal-javascript-sdk, vitest

## Tools field (AI and PayPal usage)

- **Google Gemini (`gemini-3.8-flash`) via the Vercel AI SDK:** powers the four counsel (streamed arguments) and the judge (schema-validated structured verdict). If no key is set, a deterministic demo jury runs and is labelled in the UI.
- **PayPal Orders v2 REST API + PayPal JavaScript SDK (sandbox):** creates an order only for the jury-approved amount from a server-signed approval, and captures it after the buyer approves. Order and capture IDs are stored in the audit trail.

## Links

- Code: https://github.com/kunalchoubey1108-png/The-Verdict-Chamber/tree/hackathon
- Demo video: [YouTube link — public, under 3 minutes]
- Live demo: [hosted URL, or "run locally — see README"]
- Sandbox buyer login for judges (if hosted): [sandbox personal account email / password from the PayPal Developer Dashboard]
