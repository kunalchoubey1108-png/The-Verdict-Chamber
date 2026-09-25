// ── Thesis Types ─────────────────────────────────────────────────────────────
// The trade thesis or purchase inquiry submitted by the user.

export type Direction = "LONG" | "SHORT";
export type Horizon = "intraday" | "swing" | "positional" | "longterm";
export type AssetClass =
  | "equity"
  | "mf"
  | "etf"
  | "bond"
  | "reit"
  | "invit"
  | "cash";

export interface InstrumentRef {
  /** Ticker symbol — e.g. HDFCBANK, RELIANCE */
  symbol: string;
  /** Display name */
  name: string;
  /** Exchange: NSE | BSE */
  exchange: "NSE" | "BSE";
  /** Finnhub symbol — e.g. NSE:HDFCBANK */
  finnhubSymbol: string;
  assetClass: AssetClass;
  sector?: string;
}

export interface TradeThesis {
  id: string;
  createdAt: string; // ISO timestamp
  instrument: InstrumentRef;
  /** Amount of money to invest (in INR) */
  positionSize: number;
  /** Defaults to LONG for purchase assessments */
  direction: Direction;
  /** Estimated entry price (defaults to current LTP) */
  entryPrice?: number;
  /** Target price (calculated or optional) */
  target?: number;
  /** Stop-loss price (calculated or optional) */
  stopLoss?: number;
  horizon?: Horizon;
  /** User rationale or auto-generated assessment inquiry */
  rationale?: string;
  /** Optional portfolio snapshot for Digital Twin impact analysis */
  portfolioSnapshot?: PortfolioHolding[];
}

/** Minimal holding shape for Digital Twin (matches NiveshOS holding schema) */
export interface PortfolioHolding {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector?: string;
  qty: number;
  ltp: number;
  avgPrice: number;
  dayChangePct?: number;
}

export const HORIZONS: Record<Horizon, string> = {
  intraday: "Intraday (today)",
  swing: "Short-term swing (1–3 weeks)",
  positional: "Medium-term (1–6 months)",
  longterm: "Long-term investment (1+ years)",
};

export const POPULAR_INSTRUMENTS: InstrumentRef[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE", finnhubSymbol: "NSE:RELIANCE", assetClass: "equity", sector: "Energy & Conglomerate" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE", finnhubSymbol: "NSE:TCS", assetClass: "equity", sector: "IT Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", finnhubSymbol: "NSE:HDFCBANK", assetClass: "equity", sector: "Banking & Financials" },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE", finnhubSymbol: "NSE:INFY", assetClass: "equity", sector: "IT Services" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", finnhubSymbol: "NSE:ICICIBANK", assetClass: "equity", sector: "Banking & Financials" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", finnhubSymbol: "NSE:BHARTIARTL", assetClass: "equity", sector: "Telecommunications" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", finnhubSymbol: "NSE:SBIN", assetClass: "equity", sector: "Banking & Financials" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", finnhubSymbol: "NSE:TATAMOTORS", assetClass: "equity", sector: "Automobile" },
  { symbol: "ITC", name: "ITC Ltd", exchange: "NSE", finnhubSymbol: "NSE:ITC", assetClass: "equity", sector: "FMCG" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", finnhubSymbol: "NSE:LT", assetClass: "equity", sector: "Infrastructure" },
  { symbol: "NIFTY50", name: "Nippon India Nifty 50 ETF", exchange: "NSE", finnhubSymbol: "NSE:NIFTY50", assetClass: "etf", sector: "Index ETF" },
  { symbol: "GOLDBEES", name: "Nippon India Gold ETF", exchange: "NSE", finnhubSymbol: "NSE:GOLDBEES", assetClass: "etf", sector: "Commodities ETF" },
];
