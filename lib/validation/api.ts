import { z } from "zod";
import { thesisSchema } from "@/lib/validation/thesis";

const boundedNumber = z.number().finite().min(0).max(1_000_000_000);
const signalSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number().finite().min(-100).max(100),
  direction: z.enum(["bullish", "bearish", "neutral"]),
  strength: z.enum(["strong", "moderate", "weak"]),
  summary: z.string().max(1_000),
});

export const serverThesisSchema = thesisSchema.extend({
  id: z.string().max(64).optional(),
  createdAt: z.string().datetime().optional(),
  rationale: z.string().max(1_000).optional(),
  entryPrice: boundedNumber.optional(),
  target: boundedNumber.optional(),
  stopLoss: boundedNumber.optional(),
  portfolioSnapshot: z.array(z.object({
    symbol: z.string().min(1).max(32),
    name: z.string().min(1).max(120),
    assetClass: z.enum(["equity", "mf", "etf", "bond", "reit", "invit", "cash"]),
    sector: z.string().max(100).optional(),
    qty: z.number().finite().min(0).max(1_000_000_000),
    ltp: boundedNumber,
    avgPrice: boundedNumber,
    dayChangePct: z.number().finite().min(-100).max(1_000).optional(),
  })).max(200).optional(),
});

const portfolioImpactSchema = z.object({
  newPositionPct: z.number().finite().min(0).max(100),
  sectorConcentration: z.array(z.object({
    sector: z.string().max(100),
    before: z.number().finite().min(0).max(100),
    after: z.number().finite().min(0).max(100),
    delta: z.number().finite().min(-100).max(100),
  })).max(100),
  correlationWarning: z.string().max(1_000).nullable(),
  varDeltaPct: z.number().finite().min(-100).max(100),
  summary: z.string().max(2_000),
});

export const evidencePackSchema = z.object({
  assembledAt: z.string().datetime(),
  thesis: serverThesisSchema,
  quote: z.object({
    symbol: z.string().min(1).max(32),
    name: z.string().min(1).max(120),
    ltp: boundedNumber,
    prevClose: boundedNumber,
    changePct: z.number().finite().min(-100).max(1_000),
    open: boundedNumber,
    high: boundedNumber,
    low: boundedNumber,
    week52High: boundedNumber,
    week52Low: boundedNumber,
    volume: boundedNumber,
    avgVolume10d: boundedNumber,
    marketCapCr: boundedNumber.optional(),
    asOf: z.string().datetime(),
    isLive: z.boolean(),
  }),
  signals: z.object({
    momentum: signalSchema,
    volumeAnomaly: signalSchema,
    volatility: signalSchema,
    riskReward: signalSchema,
    trapScore: signalSchema,
    newsSentiment: signalSchema,
    rsi: signalSchema.optional(),
    smaTrend: signalSchema.optional(),
    composite: signalSchema,
  }),
  regime: z.object({
    label: z.enum(["trending-up", "trending-down", "ranging", "risk-off"]),
    display: z.string().max(100),
    summary: z.string().max(1_000),
    niftyChangePct: z.number().finite().min(-100).max(1_000),
  }),
  riskRewardRatio: z.number().finite().min(0).max(1_000),
  stopLossPct: z.number().finite().min(0).max(1_000),
  targetPct: z.number().finite().min(0).max(1_000),
  portfolioImpact: portfolioImpactSchema.optional(),
  warnings: z.array(z.string().max(300)).max(20),
});

export const juryRequestSchema = z.object({
  thesis: serverThesisSchema,
});

export const evidenceRequestSchema = serverThesisSchema;
