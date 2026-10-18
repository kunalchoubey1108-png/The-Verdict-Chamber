// ── localStorage persistence for Verdict Chamber ─────────────────────────────
// All storage is namespaced under "vc." to avoid collisions with NiveshOS
// which uses "niveshos.*" keys.

import type { PortfolioHolding, TradeThesis } from "@/lib/types/thesis";
import type { FullVerdict } from "@/lib/types/verdict";
import { z } from "zod";
import { evidencePackSchema, serverThesisSchema } from "@/lib/validation/api";

const PREFIX = "vc.";
const HISTORY_KEY = PREFIX + "history"; // string[] of verdict IDs, newest first
const THESIS_PREFIX = PREFIX + "thesis.";
const VERDICT_PREFIX = PREFIX + "verdict.";
const PORTFOLIO_HANDOFF_KEY = PREFIX + "portfolio-handoff";

const persistedVerdictSchema = z.object({
  id: z.string().min(1).max(64),
  thesisId: z.string().min(1).max(64),
  createdAt: z.string().datetime(),
  deliberation: z.array(z.object({
    agent: z.enum(["bull", "bear", "risk", "quant", "judge"]),
    content: z.string().max(100_000),
    timestamp: z.string().datetime(),
    status: z.enum(["thinking", "streaming", "done"]),
  })).max(5),
  verdict: z.object({
    outcome: z.enum(["TRADE", "WATCH", "AVOID"]),
    confidence: z.number().finite().min(0).max(100),
    riskScore: z.number().finite().min(0).max(100),
    trapProbability: z.number().finite().min(0).max(100),
    thesisKiller: z.string().max(5_000),
    riskRewardRatio: z.number().finite().min(0).max(1_000),
    summary: z.string().max(10_000),
    watchConditions: z.array(z.string().max(2_000)).max(50).optional(),
    keyRisks: z.array(z.string().max(2_000)).max(50),
  }),
  evidencePack: evidencePackSchema.optional(),
  thesisSnapshot: z.object({
    instrument: z.string().min(1).max(120),
    direction: z.string().min(1).max(16),
    entryPrice: z.number().finite().min(0),
    target: z.number().finite().min(0),
    stopLoss: z.number().finite().min(0),
  }),
});

export interface PortfolioHandoff {
  symbol: string;
  positionSize: number;
  portfolioSnapshot: PortfolioHolding[];
}

/** Read and clear the one-time handoff created by NiveshOS. */
export function consumePortfolioHandoff(): PortfolioHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PORTFOLIO_HANDOFF_KEY);
    localStorage.removeItem(PORTFOLIO_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PortfolioHandoff>;
    if (
      typeof parsed.symbol !== "string" ||
      typeof parsed.positionSize !== "number" ||
      !Number.isFinite(parsed.positionSize) ||
      parsed.positionSize < 500 ||
      parsed.positionSize > 100_000_000 ||
      !Array.isArray(parsed.portfolioSnapshot)
    ) return null;

    const portfolioSnapshot = parsed.portfolioSnapshot.filter((holding): holding is PortfolioHolding =>
      !!holding &&
      typeof holding.symbol === "string" &&
      typeof holding.name === "string" &&
      typeof holding.qty === "number" && Number.isFinite(holding.qty) && holding.qty >= 0 &&
      typeof holding.ltp === "number" && Number.isFinite(holding.ltp) && holding.ltp >= 0 &&
      typeof holding.avgPrice === "number" && Number.isFinite(holding.avgPrice) && holding.avgPrice >= 0 &&
      ["equity", "mf", "etf", "bond", "reit", "invit", "cash"].includes(holding.assetClass)
    ).slice(0, 200);

    return { symbol: parsed.symbol, positionSize: parsed.positionSize, portfolioSnapshot };
  } catch {
    return null;
  }
}

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

// ── Theses ───────────────────────────────────────────────────────────────────

export function saveThesis(thesis: TradeThesis): boolean {
  return safeSet(THESIS_PREFIX + thesis.id, thesis);
}

export function loadThesis(id: string): TradeThesis | null {
  const parsed = serverThesisSchema.safeParse(safeGet<unknown>(THESIS_PREFIX + id));
  return parsed.success && parsed.data.id === id ? parsed.data as TradeThesis : null;
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
  return parsed.success && parsed.data.id === id ? parsed.data as FullVerdict : null;
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

export function deleteVerdict(id: string): void {
  safeRemove(VERDICT_PREFIX + id);
  const history = loadHistoryIds();
  safeSet(HISTORY_KEY, history.filter((i) => i !== id));
}

export function clearAllVerdicts(): void {
  const ids = loadHistoryIds();
  ids.forEach((id) => safeRemove(VERDICT_PREFIX + id));
  safeRemove(HISTORY_KEY);
}
