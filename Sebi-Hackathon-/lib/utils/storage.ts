// ── localStorage persistence for Verdict Chamber ─────────────────────────────
// All storage is namespaced under "vc." to avoid collisions with NiveshOS
// which uses "niveshos.*" keys.

import type { TradeThesis } from "@/lib/types/thesis";
import type { FullVerdict } from "@/lib/types/verdict";

const PREFIX = "vc.";
const HISTORY_KEY = PREFIX + "history"; // string[] of verdict IDs, newest first
const THESIS_PREFIX = PREFIX + "thesis.";
const VERDICT_PREFIX = PREFIX + "verdict.";

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
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

export function saveThesis(thesis: TradeThesis): void {
  safeSet(THESIS_PREFIX + thesis.id, thesis);
}

export function loadThesis(id: string): TradeThesis | null {
  return safeGet<TradeThesis>(THESIS_PREFIX + id);
}

// ── Verdicts ─────────────────────────────────────────────────────────────────

export function saveVerdict(verdict: FullVerdict): void {
  safeSet(VERDICT_PREFIX + verdict.id, verdict);
  // Prepend ID to history list, cap at 50
  const history = safeGet<string[]>(HISTORY_KEY) ?? [];
  const updated = [verdict.id, ...history.filter((i) => i !== verdict.id)].slice(0, 50);
  safeSet(HISTORY_KEY, updated);
}

export function loadVerdict(id: string): FullVerdict | null {
  return safeGet<FullVerdict>(VERDICT_PREFIX + id);
}

export function loadVerdictHistory(): FullVerdict[] {
  const ids = safeGet<string[]>(HISTORY_KEY) ?? [];
  return ids
    .map((id) => loadVerdict(id))
    .filter((v): v is FullVerdict => v !== null);
}

export function deleteVerdict(id: string): void {
  safeRemove(VERDICT_PREFIX + id);
  const history = safeGet<string[]>(HISTORY_KEY) ?? [];
  safeSet(HISTORY_KEY, history.filter((i) => i !== id));
}

export function clearAllVerdicts(): void {
  const ids = safeGet<string[]>(HISTORY_KEY) ?? [];
  ids.forEach((id) => safeRemove(VERDICT_PREFIX + id));
  safeRemove(HISTORY_KEY);
}
