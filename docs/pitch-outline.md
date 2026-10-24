# VerdictPay — pitch deck outline

The hackathon page does not publish weighted judging criteria. This outline maps each slide to what it does state: projects must **meaningfully use PayPal**, **meaningfully use AI**, show a **working prototype** and be **well documented**, with special awards for **creativity, impact and execution**. Replace the mapping if the official criteria are published.

| # | Slide | Content | Maps to |
| --- | --- | --- | --- |
| 1 | **VerdictPay** | "An AI jury for every payment." One screenshot of a MODIFY verdict: $1,188 requested, $99 approved. | Creativity |
| 2 | **The problem** | Bad spending is rarely fraud. It's duplicate tools, annual prepays and "offer ends tonight". Checkout is one click and nobody argues the other side. | Impact |
| 3 | **The idea** | Put adversarial review between the decision and the payment, and let the payment rail enforce the verdict. Built on The Verdict Chamber's five-agent stock-research jury. | Creativity |
| 4 | **How it works** | Decision → computed evidence → Advocate, Skeptic, Budget Officer, Analyst → Judge → you confirm → PayPal charges the approved amount → audit trail. Use the architecture diagram from the README. | Execution |
| 5 | **Meaningful AI** | Gemini via the Vercel AI SDK: four streamed counsel plus a judge with schema-validated structured output. Agents must cite computed evidence; user text is treated as untrusted. | AI requirement |
| 6 | **Meaningful PayPal** | Orders v2 + JS SDK (sandbox). The verdict decides whether an order exists and for how much. Server-signed approvals (HMAC, 30-minute expiry), amount fixed by the signature, `PayPal-Request-Id` idempotency, explicit user confirmation. | PayPal requirement |
| 7 | **Live demo** | The three examples: MODIFY ($1,188 → $99, paid via PayPal), REJECT ($400 not spent, no button), PROCEED ($129). Link to the video. | Working prototype |
| 8 | **Trust and safety** | Money rules enforced in code, not by the model. A demo mode that labels itself. No secrets in the browser. AI decision support, not financial advice. | Execution |
| 9 | **What's next** | PayPal Subscriptions and refunds, webhooks, PayPal transaction history as evidence, an API for AI shopping agents to request a verdict before they spend. | Impact |
| 10 | **Close** | Repo link, video link, "Argue it out before you pay." | — |

**Speaker notes**

- Keep slide 6 concrete: show the order route (`app/api/paypal/orders/route.ts`) verifying the approval before it creates the order.
- Don't claim savings figures; the history page's numbers come only from the reviews you run.
- Say "sandbox" every time you show PayPal.
