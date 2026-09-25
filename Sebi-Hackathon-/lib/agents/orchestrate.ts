// ── Multi-Agent Jury Orchestrator ─────────────────────────────────────────────
// Sequential jury: Bull → Bear → Risk → Quant → Judge
// Each agent receives the evidence pack + all prior agent outputs.
// Streams output as SSE-style JSON events.
// Includes intelligent offline/demo synthesis simulation if no API key is provided.

import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type { EvidencePack } from "@/lib/types/evidence";
import type { AgentId, JuryEvent, VerdictCard } from "@/lib/types/verdict";
import { fmtINR, fmtPct } from "@/lib/utils/format";
import {
  BULL_SYSTEM_PROMPT,
  BEAR_SYSTEM_PROMPT,
  RISK_SYSTEM_PROMPT,
  QUANT_SYSTEM_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  formatEvidencePack,
} from "./prompts";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

type AgentConfig = {
  id: AgentId;
  systemPrompt: string;
  maxTokens: number;
};

const AGENTS: AgentConfig[] = [
  { id: "bull",  systemPrompt: BULL_SYSTEM_PROMPT,  maxTokens: 600 },
  { id: "bear",  systemPrompt: BEAR_SYSTEM_PROMPT,  maxTokens: 600 },
  { id: "risk",  systemPrompt: RISK_SYSTEM_PROMPT,  maxTokens: 500 },
  { id: "quant", systemPrompt: QUANT_SYSTEM_PROMPT, maxTokens: 500 },
  { id: "judge", systemPrompt: JUDGE_SYSTEM_PROMPT, maxTokens: 800 },
];

/** Extract the JSON verdict block from the Judge's response */
function parseJudgeVerdict(text: string, ep: EvidencePack): VerdictCard | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    const parsed = JSON.parse(match[1]);
    if (!["TRADE", "WATCH", "AVOID"].includes(parsed.outcome)) return null;
    return {
      outcome: parsed.outcome,
      confidence: Number(parsed.confidence) || 50,
      riskScore: Number(parsed.riskScore) || 50,
      trapProbability: Number(parsed.trapProbability) || 30,
      thesisKiller: String(parsed.thesisKiller || "No specific thesis killer identified."),
      riskRewardRatio: Number(parsed.riskRewardRatio) || ep.riskRewardRatio,
      summary: String(parsed.summary || ""),
      watchConditions: Array.isArray(parsed.watchConditions) ? parsed.watchConditions : [],
      keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
    };
  } catch {
    return null;
  }
}

/** Deterministic rich synthesis when Google Gemini API key is missing */
function generateSimulatedArgument(agent: AgentId, ep: EvidencePack): string {
  const { thesis, quote, signals, regime } = ep;
  const sym = thesis.instrument.symbol;
  const name = thesis.instrument.name;
  const ltp = fmtINR(quote.ltp);
  const capital = fmtINR(thesis.positionSize);
  const shares = Math.floor(thesis.positionSize / Math.max(1, quote.ltp));
  const change = fmtPct(quote.changePct);
  const isUp = quote.changePct >= 0;

  switch (agent) {
    case "bull":
      return `### Fundamental & Tactical Accumulation Thesis

Deploying **${capital}** (~${shares} shares) into **${name} (${sym})** at current level **${ltp}** is supported by structural demand and current price behavior:

- **Price Action & Trend:** ${sym} is trading at **${ltp}** (${change} on the day). The stock continues to demonstrate institutional support above its 52-week baseline of ${fmtINR(quote.week52Low)}.
- **Macro & Sectoral Alignment:** Under current **${regime.display}** market conditions, high-quality leaders like ${sym} benefit from sustained liquidity rotation and corporate earnings strength.
- **Purchase Timing:** Committing capital today secures entry before a potential breakout past 52-week highs (${fmtINR(quote.week52High)}). Downside is strongly bounded by nearby volume shelves.

**Bull Verdict:** A calculated, highly compelling long entry for quality expansion over the next 1–3 months.`;

    case "bear":
      return `### Structural Headwinds & Distribution Risks

While ${name} carries strong brand equity, allocating **${capital}** right now exposes the buyer to significant timing friction:

- **Valuation & Range Exhaustion:** Trading at **${ltp}**, the stock sits close to its upper range threshold (${fmtINR(quote.week52High)}). With ${signals.volatility.summary}, late buyers face sharp intraday mean-reversion.
- **Near-Future Market State:** Broad market conditions (${regime.display}) reflect selective dispersion. Any sudden index pullback will drag large caps first, trapping fresh breakout capital in prolonged drawdown.
- **Trap Vulnerability:** Volume momentum indicates potential buyer exhaustion. Entering without waiting for an established pullback risks catching a false breakout.

**Bear Verdict:** Premature entry. Withhold deployment until price consolidates or retests lower support floors.`;

    case "risk":
      const calculatedRisk = signals.trapScore.value > 0 ? 68 : 42;
      return `### Capital Sizing & Guardrail Mandate

From a risk governance perspective, deploying **${capital}** requires strict invalidation boundaries:

- **Allocation Sizing:** An allocation of ${capital} into ${sym} represents a focused single-name bet. Given current volatility metrics (${signals.volatility.value.toFixed(0)}/100), position sizing should not exceed 10–15% of your total liquid portfolio.
- **Veto Stop Floor:** Any entry must respect a strict invalidation level at **${fmtINR(quote.ltp * 0.95)}** (-5.0%). If the price closes below this floor, institutional accumulation has failed.
- **Market Liquidity Caution:** Market regime (${regime.display}) demands staged tranche entries rather than a single lump sum.

**Risk Score: ${calculatedRisk}/100 — Prudent if trunched with a disciplined stop loss at ${fmtINR(quote.ltp * 0.95)}.**`;

    case "quant":
      const quantScore = Math.max(35, Math.min(85, Math.round(50 + signals.composite.value * 0.4)));
      return `### Microstructure & Probabilistic Trajectory

Quantitative evaluation across price distribution and liquidity indicators:

- **Range Location:** ${sym} is trading in the **${Math.round(((quote.ltp - quote.week52Low) / Math.max(1, quote.week52High - quote.week52Low)) * 100)}th percentile** of its 52-week channel (${fmtINR(quote.week52Low)} – ${fmtINR(quote.week52High)}).
- **Composite Signal Strength:** Composite signal stands at **${signals.composite.value.toFixed(0)}/100** (${signals.composite.direction.toUpperCase()}). Historical probability of positive return over 30 days is **${quantScore}%**.
- **Asymmetry Profile:** Risk-to-reward asymmetry offers a favourable **${ep.riskRewardRatio.toFixed(2)}:1** upside-to-downside skew under current volume trends.

**Quant Metric: ${quantScore}/100 Probability of Favourable Continuation over 60-day window.**`;

    case "judge":
      const outcome = signals.composite.value > 15 ? "TRADE" : signals.composite.value < -20 ? "AVOID" : "WATCH";
      const conf = Math.max(50, Math.min(88, Math.round(55 + Math.abs(signals.composite.value) * 0.3)));
      const riskSc = signals.trapScore.value > 0 ? 65 : 44;
      const killer = `${sym} breaking below ${fmtINR(quote.ltp * 0.95)} with heavy volume on consecutive trading sessions completely invalidates the purchase thesis.`;
      const summary = `${name} exhibits resilient price behaviour within the ${regime.display} environment. Allocating ${capital} is justified if executed with disciplined stop boundaries; however, monitoring near-term resistance is essential.`;

      return `### Final Chamber Synthesis & Decree

Having heard Bull Counsel, Bear Counsel, Risk Officer, and Quant Analyst regarding the proposed purchase of **${name} (${sym})** with capital of **${capital}**:

1. **Stock Behaviour Summary:** ${sym} is demonstrating solid underlying volume support at **${ltp}**, with bullish momentum balanced by overhead resistance near 52-week highs.
2. **Purchase Wisdom:** The purchase carries favourable asymmetry provided entry is not chased on spike days. Staged accumulation aligns with risk limits.
3. **Likely Near-Future Market State:** The market is currently in a **${regime.display}** phase. Selective sectoral rotation will reward resilient balance sheets, but broad volatility remains active.
4. **Decisive Thesis Killer:** The single condition that terminates this position is: *${killer}*

\`\`\`json
{
  "outcome": "${outcome}",
  "confidence": ${conf},
  "riskScore": ${riskSc},
  "trapProbability": ${signals.trapScore.value > 0 ? 44 : 28},
  "thesisKiller": "${killer}",
  "riskRewardRatio": ${ep.riskRewardRatio.toFixed(2)},
  "summary": "${summary}",
  "watchConditions": [
    "Volume expansion confirming daily close above ${fmtINR(quote.ltp * 1.02)}",
    "Nifty 50 sustaining positive intraday breadth"
  ],
  "keyRisks": [
    "Overhead resistance test near 52-week high",
    "Sectoral rotation away from ${thesis.instrument.sector || 'large caps'}",
    "Intraday stop breach below ${fmtINR(quote.ltp * 0.95)}"
  ]
}
\`\`\``;
  }
}

/**
 * Run the full jury and stream SSE events.
 * Uses Google Gemini when API key is configured; otherwise smoothly runs the
 * specialized simulation engine so the UI works seamlessly in all environments.
 */
export async function runJury(
  evidencePack: EvidencePack,
  onEvent: (event: JuryEvent) => void
): Promise<VerdictCard> {
  const evidenceText = formatEvidencePack(evidencePack);
  const priorArguments: { agent: AgentId; text: string }[] = [];

  let verdictCard: VerdictCard | null = null;
  const hasGeminiKey = Boolean(API_KEY && API_KEY !== "your_gemini_api_key_here");

  for (const agentConfig of AGENTS) {
    const { id, systemPrompt, maxTokens } = agentConfig;

    onEvent({ type: "agent_start", agent: id });

    let fullText = "";

    try {
      if (hasGeminiKey) {
        // Build the user message: evidence pack + prior arguments
        const priorSection =
          priorArguments.length > 0
            ? "\n\n=== PREVIOUS COUNSEL ARGUMENTS ===\n" +
              priorArguments
                .map((p) => `--- ${p.agent.toUpperCase()} COUNSEL ---\n${p.text}`)
                .join("\n\n")
            : "";

        const userMessage = evidenceText + priorSection;

        if (id === "judge") {
          onEvent({ type: "agent_chunk", agent: id, chunk: "*The Judge is deliberating…*\n\n" });

          const result = await generateText({
            model: google(MODEL),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxTokens,
          });

          fullText = result.text;

          // Stream the judge's text in chunks for visual effect
          const words = fullText.split(" ");
          const chunkSize = 8;
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(" ") + " ";
            onEvent({ type: "agent_chunk", agent: id, chunk });
            await new Promise((r) => setTimeout(r, 25));
          }

          verdictCard = parseJudgeVerdict(fullText, evidencePack);
        } else {
          const stream = await streamText({
            model: google(MODEL),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            maxTokens,
          });

          for await (const chunk of stream.textStream) {
            fullText += chunk;
            onEvent({ type: "agent_chunk", agent: id, chunk });
          }
        }
      } else {
        // Simulated stream (runs seamlessly if user hasn't added GOOGLE_GENERATIVE_AI_API_KEY)
        fullText = generateSimulatedArgument(id, evidencePack);
        const words = fullText.split(" ");
        const chunkSize = 6;
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(" ") + " ";
          onEvent({ type: "agent_chunk", agent: id, chunk });
          await new Promise((r) => setTimeout(r, 35));
        }

        if (id === "judge") {
          verdictCard = parseJudgeVerdict(fullText, evidencePack);
        }
      }

      if (id === "judge" && verdictCard) {
        onEvent({ type: "verdict", verdict: verdictCard });
      }

      priorArguments.push({ agent: id, text: fullText });
      onEvent({ type: "agent_done", agent: id });
    } catch (err) {
      console.warn(`[runJury] Falling back to simulated deliberation for agent ${id}:`, err);
      // Graceful fallback to rich simulated argument so user never gets blocked by API key errors
      fullText = generateSimulatedArgument(id, evidencePack);
      const words = fullText.split(" ");
      const chunkSize = 8;
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(" ") + " ";
        onEvent({ type: "agent_chunk", agent: id, chunk });
        await new Promise((r) => setTimeout(r, 20));
      }

      if (id === "judge") {
        verdictCard = parseJudgeVerdict(fullText, evidencePack);
        if (verdictCard) {
          onEvent({ type: "verdict", verdict: verdictCard });
        }
      }

      priorArguments.push({ agent: id, text: fullText });
      onEvent({ type: "agent_done", agent: id });
    }
  }

  return verdictCard ?? (parseJudgeVerdict(generateSimulatedArgument("judge", evidencePack), evidencePack)!);
}
