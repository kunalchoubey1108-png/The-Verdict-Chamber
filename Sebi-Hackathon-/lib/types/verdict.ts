// ── Verdict Types ─────────────────────────────────────────────────────────────
// The structured output of the multi-agent jury deliberation.

export type VerdictOutcome = "TRADE" | "WATCH" | "AVOID";

// ── Agent identifiers ─────────────────────────────────────────────────────────

export type AgentId = "bull" | "bear" | "risk" | "quant" | "judge";

export interface AgentMeta {
  id: AgentId;
  /** Display name */
  name: string;
  /** Short role description */
  role: string;
  /** Tailwind color class for the avatar */
  color: string;
  /** Icon character / emoji */
  icon: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  bull: {
    id: "bull",
    name: "Bull Counsel",
    role: "Finds the strongest case for the trade",
    color: "text-good",
    icon: "🐂",
  },
  bear: {
    id: "bear",
    name: "Bear Counsel",
    role: "Attacks every weakness in the thesis",
    color: "text-critical",
    icon: "🐻",
  },
  risk: {
    id: "risk",
    name: "Risk Officer",
    role: "Focuses on downside, sizing & tail risk",
    color: "text-serious",
    icon: "🛡️",
  },
  quant: {
    id: "quant",
    name: "Quant Analyst",
    role: "Evaluates signal quality and R:R ratio",
    color: "text-accent",
    icon: "📊",
  },
  judge: {
    id: "judge",
    name: "Presiding Judge",
    role: "Synthesises all arguments, delivers the verdict",
    color: "text-ink",
    icon: "⚖️",
  },
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
}

// ── Final verdict card ────────────────────────────────────────────────────────

export interface VerdictCard {
  outcome: VerdictOutcome;
  /** Overall confidence in the verdict 0–100 */
  confidence: number;
  /** Portfolio risk score 0–100 (higher = riskier) */
  riskScore: number;
  /** Probability this is a trap / false setup 0–100 */
  trapProbability: number;
  /** The single falsification condition — what kills the thesis */
  thesisKiller: string;
  /** Computed R:R ratio */
  riskRewardRatio: number;
  /** One-paragraph final synthesis */
  summary: string;
  /** Key conditions under which WATCH becomes TRADE */
  watchConditions?: string[];
  /** Key risk factors called out by the panel */
  keyRisks: string[];
}

// ── Full verdict (stored in localStorage / DB) ────────────────────────────────

export interface FullVerdict {
  id: string;
  thesisId: string;
  createdAt: string;
  deliberation: AgentMessage[];
  verdict: VerdictCard;
  /** The thesis snapshot at verdict time */
  thesisSnapshot: {
    instrument: string;
    direction: string;
    entryPrice: number;
    target: number;
    stopLoss: number;
  };
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
  verdict?: VerdictCard;
  error?: string;
}
