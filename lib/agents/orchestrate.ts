// ── Multi-Agent Jury Orchestrator ─────────────────────────────────────────────
// Sequential jury: Advocate → Skeptic → Budget Officer → Analyst → Judge.
// Each agent receives the evidence plus all prior arguments. Streams SSE-style
// events. Without a Gemini key (or when a call fails) a deterministic
// simulation stands in so the flow never dead-ends.

import { google } from "@ai-sdk/google";
import { generateObject, streamText } from "ai";
import type { DecisionEvidence } from "@/lib/decision/evidence";
import type { AgentId, JuryEvent, VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";
import { fmtUSD } from "@/lib/utils/format";
import {
  BULL_SYSTEM_PROMPT,
  BEAR_SYSTEM_PROMPT,
  RISK_SYSTEM_PROMPT,
  QUANT_SYSTEM_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  formatEvidence,
} from "./prompts";
import { judgeSchema, normalizeVerdict, simulateVerdict, type JudgeOutput } from "./verdict";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

const AGENTS: { id: AgentId; system: string }[] = [
  { id: "bull", system: BULL_SYSTEM_PROMPT },
  { id: "bear", system: BEAR_SYSTEM_PROMPT },
  { id: "risk", system: RISK_SYSTEM_PROMPT },
  { id: "quant", system: QUANT_SYSTEM_PROMPT },
  { id: "judge", system: JUDGE_SYSTEM_PROMPT },
];

/** Deterministic counsel arguments used without a Gemini key. */
function simulatedArgument(agent: Exclude<AgentId, "judge">, d: MoneyDecision, e: DecisionEvidence): string {
  const share = `${Math.round(e.budgetSharePct)}%`;
  switch (agent) {
    case "bull":
      return `### The case for paying

- **Stated need:** ${d.reason || "no reason was given, so value rests on the item itself."}
- **Affordability:** ${fmtUSD(e.dueNow)} is ${share} of the ${fmtUSD(d.monthlyBudget)} monthly budget, leaving ${fmtUSD(e.remainingAfter)}.
- **Cost of waiting:** delaying a tool that is used regularly has its own cost in time and workarounds.

**Advocate: pay if ${d.title} will be used regularly.**`;
    case "bear":
      return `### The case against

${e.redFlags.length > 0 ? e.redFlags.map((f) => `- **${f}**`).join("\n") : "- No hard red flags, but every new payment should beat the next-best use of the money."}
- **Reversibility:** ${d.billing === "yearly" ? "a yearly prepayment is the hardest form to undo." : d.billing === "monthly" ? "monthly billing can be cancelled, but subscriptions are easy to forget." : "a one-time purchase may not be refundable."}

**Skeptic: ${e.redFlags.length > 0 ? "change or refuse until the red flags are resolved." : "pay only with a clear plan to use it."}**`;
    case "risk": {
      const risk = Math.round(Math.min(100, e.budgetSharePct * 0.6 + e.overlaps.length * 15 + (e.remainingAfter < 0 ? 25 : 0)));
      return `### Budget review

- **Share of budget:** ${share} in a single charge.
- **Already committed:** ${fmtUSD(e.committedMonthly)}/month in subscriptions.
- **Left after paying:** ${fmtUSD(e.remainingAfter)}${e.remainingAfter < 0 ? " (over budget)" : ""}.
- **Lock-in:** ${d.billing === "yearly" ? "12 months prepaid." : "low."}

**Budget risk: ${risk}/100 — ${e.remainingAfter < 0 ? "not affordable as requested." : risk > 50 ? "affordable but heavy." : "within limits."}**`;
    }
    case "quant":
      return `### The numbers

- **Due now:** ${fmtUSD(e.dueNow)}
- **First 12 months:** ${fmtUSD(e.annualCost)}
- **Monthly equivalent:** ${e.monthlyCost > 0 ? fmtUSD(e.monthlyCost) : "n/a (one-time)"}
- **Budget share:** ${share}
- **Overlapping spend:** ${e.overlaps.length > 0 ? `${fmtUSD(e.overlaps.reduce((s, o) => s + o.monthlyCost, 0))}/month` : "none"}

**Analyst: the decisive number is ${e.remainingAfter < 0 ? `the ${fmtUSD(-e.remainingAfter)} budget shortfall` : `${share} of the monthly budget`}.**`;
  }
}

/**
 * Run the full jury and stream events. Always emits exactly one `verdict`
 * event (live or simulated) unless the client disconnects.
 */
export async function runJury(
  decision: MoneyDecision,
  evidence: DecisionEvidence,
  onEvent: (event: JuryEvent) => void,
  signal?: AbortSignal
): Promise<VerdictCard | null> {
  if (signal?.aborted) return null;
  const evidenceText = formatEvidence(decision, evidence);
  const live = Boolean(API_KEY && API_KEY !== "your_gemini_api_key_here");
  const prior: { agent: AgentId; text: string }[] = [];
  let verdict: VerdictCard | null = null;

  const simulate = (id: AgentId): { text: string; judge?: JudgeOutput } => {
    if (id !== "judge") return { text: simulatedArgument(id, decision, evidence) };
    const judge = simulateVerdict(decision, evidence);
    return { text: judge.ruling, judge };
  };

  for (const { id, system } of AGENTS) {
    if (signal?.aborted) return verdict;
    onEvent({ type: "agent_start", agent: id });

    const prompt =
      evidenceText +
      (prior.length > 0
        ? "\n\n=== PREVIOUS ARGUMENTS ===\n" + prior.map((p) => `--- ${p.agent.toUpperCase()} ---\n${p.text}`).join("\n\n")
        : "");

    let text = "";
    let judge: JudgeOutput | undefined;
    let simulated = !live;
    try {
      if (!live) {
        ({ text, judge } = simulate(id));
        await streamWords(text, id, onEvent, signal);
      } else if (id === "judge") {
        onEvent({ type: "agent_chunk", agent: id, chunk: "*The Judge is deliberating…*\n\n" });
        const { object } = await generateObject({ model: google(MODEL), schema: judgeSchema, system, prompt, abortSignal: signal });
        judge = object;
        text = object.ruling;
        await streamWords(text, id, onEvent, signal);
      } else {
        const result = streamText({ model: google(MODEL), system, prompt, abortSignal: signal });
        for await (const chunk of result.textStream) {
          text += chunk;
          onEvent({ type: "agent_chunk", agent: id, chunk });
        }
      }
    } catch (err) {
      if (signal?.aborted) return verdict;
      console.warn(`[runJury] Falling back to simulated argument for agent ${id}:`, err);
      simulated = true;
      ({ text, judge } = simulate(id));
      await streamWords("\n\n" + text, id, onEvent, signal);
    }

    prior.push({ agent: id, text });
    if (judge) {
      verdict = normalizeVerdict(judge, decision);
      onEvent({ type: "verdict", verdict });
    }
    onEvent({ type: "agent_done", agent: id, simulated });
  }

  return verdict;
}

/** Stream pre-built text in small word chunks so it reads like live output. */
async function streamWords(text: string, agent: AgentId, onEvent: (event: JuryEvent) => void, signal?: AbortSignal) {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i += 6) {
    onEvent({ type: "agent_chunk", agent, chunk: words.slice(i, i + 6).join(" ") + " " });
    await delay(30, signal);
  }
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return new Promise((resolve) => setTimeout(resolve, milliseconds));
  if (signal.aborted) return Promise.reject(signal.reason ?? new Error("Jury stream cancelled."));

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason ?? new Error("Jury stream cancelled."));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
