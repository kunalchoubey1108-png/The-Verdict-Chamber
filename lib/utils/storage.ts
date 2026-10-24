// ── localStorage persistence for VerdictPay ──────────────────────────────────
// Namespaced under "vp." so records from the original stock app ("vc.*")
// are never misread as payment decisions.

import type { FullVerdict } from "@/lib/types/verdict";
import { z } from "zod";
import { decisionSchema, type MoneyDecision } from "@/lib/validation/decision";

const PREFIX = "vp.";
const HISTORY_KEY = PREFIX + "history"; // string[] of verdict IDs, newest first
const DECISION_PREFIX = PREFIX + "decision.";
const VERDICT_PREFIX = PREFIX + "verdict.";

const persistedVerdictSchema = z.object({
  id: z.string().min(1).max(64),
  createdAt: z.string().datetime(),
  decision: decisionSchema,
  deliberation: z.array(z.object({
    agent: z.enum(["bull", "bear", "risk", "quant", "judge"]),
    content: z.string().max(100_000),
    timestamp: z.string().datetime(),
    status: z.enum(["thinking", "streaming", "done"]),
    simulated: z.boolean().optional(),
  })).max(5),
  verdict: z.object({
    outcome: z.enum(["PROCEED", "MODIFY", "REJECT"]),
    confidence: z.number().finite().min(0).max(100),
    riskScore: z.number().finite().min(0).max(100),
    approvedAmount: z.number().finite().min(0),
    modification: z.string().max(500),
    dealBreaker: z.string().max(500),
    summary: z.string().max(2_000),
    keyRisks: z.array(z.string().max(300)).max(5),
  }),
  approvalToken: z.string().max(4_096).nullable().optional(),
  payment: z.object({
    status: z.string().max(40),
    amount: z.number().finite().min(0),
    orderId: z.string().max(64).nullable(),
    captureId: z.string().max(64).nullable(),
    at: z.string().datetime(),
  }).optional(),
});

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Decisions ────────────────────────────────────────────────────────────────

export function saveDecision(decision: MoneyDecision): boolean {
  return safeSet(DECISION_PREFIX + decision.id, decision);
}

export function loadDecision(id: string): MoneyDecision | null {
  const parsed = decisionSchema.safeParse(safeGet<unknown>(DECISION_PREFIX + id));
  return parsed.success && parsed.data.id === id ? parsed.data : null;
}

// ── Verdicts ─────────────────────────────────────────────────────────────────

export function saveVerdict(verdict: FullVerdict): boolean {
  const verdictSaved = safeSet(VERDICT_PREFIX + verdict.id, verdict);
  // Prepend ID to history list, cap at 50
  const history = loadHistoryIds();
  const updated = [verdict.id, ...history.filter((i) => i !== verdict.id)].slice(0, 50);
  const historySaved = safeSet(HISTORY_KEY, updated);
  return verdictSaved && historySaved;
}

export function loadVerdict(id: string): FullVerdict | null {
  const parsed = persistedVerdictSchema.safeParse(safeGet<unknown>(VERDICT_PREFIX + id));
  return parsed.success && parsed.data.id === id ? parsed.data : null;
}

export function loadVerdictHistory(): FullVerdict[] {
  return loadHistoryIds()
    .map((id) => loadVerdict(id))
    .filter((v): v is FullVerdict => v !== null);
}

function loadHistoryIds(): string[] {
  const value = safeGet<unknown>(HISTORY_KEY);
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 64).slice(0, 50)
    : [];
}

/** The saved review for a decision, if the jury already ruled on it. */
export function findVerdictForDecision(decisionId: string): FullVerdict | null {
  return loadVerdictHistory().find((v) => v.decision.id === decisionId) ?? null;
}

export function deleteVerdict(id: string): void {
  safeRemove(VERDICT_PREFIX + id);
  const history = loadHistoryIds();
  safeSet(HISTORY_KEY, history.filter((i) => i !== id));
}
