import { z } from "zod";

export const thesisSchema = z.object({
  instrument: z.object({
    symbol: z.string().min(1, "Choose an instrument"),
    name: z.string().min(1),
    exchange: z.enum(["NSE", "BSE"]),
    finnhubSymbol: z.string(),
    assetClass: z.enum([
      "equity",
      "mf",
      "etf",
      "bond",
      "reit",
      "invit",
      "cash",
    ]),
    sector: z.string().optional(),
  }),
  positionSize: z
    .number({ invalid_type_error: "Enter an amount to invest" })
    .positive("Investment capital must be positive")
    .min(500, "Minimum allocation is ₹500")
    .max(100_000_000, "Max allocation is ₹10 crore"),
  // Optional parameters with intelligent defaults
  direction: z.enum(["LONG", "SHORT"]).default("LONG"),
  entryPrice: z.number().optional(),
  target: z.number().optional(),
  stopLoss: z.number().optional(),
  horizon: z.enum(["intraday", "swing", "positional", "longterm"]).default("swing"),
  rationale: z.string().optional().default("Discretionary allocation for pre-trade suitability evaluation."),
});

export type ThesisFormValues = z.infer<typeof thesisSchema>;
