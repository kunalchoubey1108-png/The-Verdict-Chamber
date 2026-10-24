# VerdictPay — demo video script (target 2:45, hard limit under 3:00)

**Before recording**

- Run with live keys: `GOOGLE_GENERATIVE_AI_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `VERDICT_SIGNING_SECRET`. Check that juror cards show **LIVE AI**, not DEMO JUROR.
- Clear site data (or use a fresh browser profile) so History starts empty.
- Log out of PayPal in the browser so the sandbox login shows; have the sandbox buyer email and password ready.
- Do one rehearsal run of each example; live AI wording varies, so read the verdict on screen rather than from this script.
- Record at 1280×800 or larger, browser zoom 100%. Use no copyrighted music.
- If live AI is slow, speed up the jury-streaming section in editing (and say so on screen: "sped up 2×").

| Time | Screen | Action | Voiceover |
| --- | --- | --- | --- |
| 0:00–0:15 | Landing page | Hold on the headline. | "One click is all it takes to pay for an annual plan you don't need. VerdictPay puts an AI jury between you and the checkout button, and PayPal only charges what the jury approves." |
| 0:15–0:35 | `/verdict/new` | Click **Annual design app**. Scroll past amount, Yearly, budget and the two subscriptions. | "Here's a real decision: a design app, $1,188 a year. I already pay for a similar tool, and my monthly budget is $1,500." |
| 0:35–0:50 | Review room, evidence panel | Click **Convene the AI jury**. Point at the four stat tiles and red flags. | "First, VerdictPay computes the facts: it's 79% of my budget, it overlaps a tool I have, and it's prepaid for a year. The AI argues over these numbers; it doesn't invent them." |
| 0:50–1:25 | Transcript streaming | Let Advocate and Skeptic stream; scroll to Budget Officer and Analyst. Point at the LIVE AI chip. | "Five Gemini agents argue in order. The Advocate makes the case for it, the Skeptic attacks it, the Budget Officer checks affordability, the Analyst runs the numbers, and each one sees the arguments before it." |
| 1:25–1:45 | Verdict card | Point at MODIFY, Requested $1,188 vs Approved $99, Required change. | "The judge rules MODIFY: start on monthly billing. The verdict is structured output, and the money rules are enforced in code: the jury can lower the amount, never raise it." |
| 1:45–2:10 | Payment panel → PayPal popup | Tick the confirmation, click **Continue to PayPal**, click the PayPal button, log in with the sandbox buyer, click Pay. | "I confirm, and PayPal opens for exactly $99, not $1,188. The server signed this approval, so nobody can change the amount in the browser." |
| 2:10–2:20 | Receipt | Point at COMPLETED, order ID and capture ID. | "Captured in the PayPal sandbox, with the order and capture IDs saved to the audit trail." |
| 2:20–2:35 | New review → Flash-sale course | Load **Flash-sale course** and run it; jump to the verdict (cut while streaming). | "Now a $400 'limited-time' course. The jury spots the pressure wording and the overlap, and rejects it. No PayPal button at all: $400 not spent." |
| 2:35–2:50 | `/verdict/history` | Show the impact strip and the two entries with payment status. | "Every review is kept: the debate, the verdict and the PayPal receipt, plus how much the jury stopped. VerdictPay: argue it out before you pay." |

**Spoken word count:** about 300 words, which fits 2:45 at a normal pace.

**Fallback if PayPal keys aren't ready:** record the same flow in demo mode, but say "Demo mode: PayPal is not configured, so this payment is simulated" over the payment step. Judges are told to look for working PayPal integration, so prefer a real sandbox capture.
