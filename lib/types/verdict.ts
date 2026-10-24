// ── Verdict Types ─────────────────────────────────────────────────────────────
// The structured output of the multi-agent jury deliberation.

import type { MoneyDecision } from "@/lib/validation/decision";

export type VerdictOutcome = "PROCEED" | "MODIFY" | "REJECT";

// ── Agent identifiers ─────────────────────────────────────────────────────────
// Internal ids are kept from the original stock jury; display names changed.

export type AgentId = "bull" | "bear" | "risk" | "quant" | "judge";

export interface AgentMeta {
  id: AgentId;
  /** Display name */
  name: string;
  /** Short role description */
  role: string;
  /** Icon character / emoji */
  icon: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  bull: { id: "bull", name: "Advocate", role: "Makes the strongest case for paying", icon: "👍" },
  bear: { id: "bear", name: "Skeptic", role: "Attacks every weakness in the purchase", icon: "🔍" },
  risk: { id: "risk", name: "Budget Officer", role: "Checks affordability, cash flow and commitments", icon: "🛡️" },
  quant: { id: "quant", name: "Analyst", role: "Runs the numbers: annual cost, budget share, overlap", icon: "📊" },
  judge: { id: "judge", name: "Presiding Judge", role: "Weighs every argument and rules", icon: "⚖️" },
};

// ── Deliberation messages ─────────────────────────────────────────────────────

export interface AgentMessage {
  agent: AgentId;
  /** Full markdown argument text */
  content: string;
  /** ISO timestamp */
  timestamp: string;
  /** Streaming state */
  status: "thinking" | "streaming" | "done";
  /** True when the argument came from the deterministic demo jury, not Gemini */
  simulated?: boolean;
}

// ── Final verdict card ────────────────────────────────────────────────────────

export interface VerdictCard {
  outcome: VerdictOutcome;
  /** Judge confidence 0–100 */
  confidence: number;
  /** Financial risk of the payment 0–100 (higher = riskier) */
  riskScore: number;
  /** USD the user may pay now: full amount (PROCEED), lower or equal (MODIFY), 0 (REJECT) */
  approvedAmount: number;
  /** For MODIFY: the exact change to make; empty otherwise */
  modification: string;
  /** The single condition under which this decision would be wrong */
  dealBreaker: string;
  /** Two-to-three sentence synthesis */
  summary: string;
  keyRisks: string[];
}

// ── Payment outcome ───────────────────────────────────────────────────────────

export interface PaymentRecord {
  /** PayPal capture status (e.g. COMPLETED), or SIMULATED in demo mode */
  status: string;
  /** USD actually charged */
  amount: number;
  orderId: string | null;
  captureId: string | null;
  /** ISO timestamp */
  at: string;
}

// ── Full verdict (stored in localStorage) ─────────────────────────────────────

export interface FullVerdict {
  id: string;
  createdAt: string;
  /** The decision as submitted; evidence is recomputed from it on display */
  decision: MoneyDecision;
  deliberation: AgentMessage[];
  verdict: VerdictCard;
  /** Server-signed approval; lets the saved review be paid until it expires */
  approvalToken?: string | null;
  /** Present once the user paid (or simulated paying) the approved amount */
  payment?: PaymentRecord;
}

// ── SSE stream event types ────────────────────────────────────────────────────

export type JuryEventType =
  | "agent_start"
  | "agent_chunk"
  | "agent_done"
  | "verdict"
  | "error";

export interface JuryEvent {
  type: JuryEventType;
  agent?: AgentId;
  chunk?: string;
  /** On agent_done: whether this argument came from the demo jury */
  simulated?: boolean;
  verdict?: VerdictCard;
  /** Server-signed approval sent with the verdict; null when payments are off or REJECT */
  approvalToken?: string | null;
  error?: string;
}
