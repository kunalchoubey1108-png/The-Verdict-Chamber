/* ==========================================================================
   NiveshOS — data.js  (Agent A / logic)
   Real, exchange-listed instruments in a simulated Account Aggregator /
   NSDL / CDSL / CAMS consolidation. Now MULTI-USER: `users[]` each own their
   accounts + holdings (diverse personas); `products`, `lessons`, `riskQuiz`
   are the shared catalogue + education. The app points its live view at the
   signed-in user after a LOCAL, client-side login.

   SECURITY NOTE: the login is a LOCAL DEMO only — credentials live in this
   file and are checked in the browser. It is not real authentication and is
   trivially bypassable; it exists to demo per-user portfolios, not to secure
   anything. No backend, no network auth.

   Prices/NAVs are REAL, merged from real-quotes.js over baked fallbacks.
   Rebuild the snapshot with `node tools/build-real-data.mjs`. Reference date:
   2026-07-06.
   ========================================================================== */

/* 30 trading-day date axis, ending on the reference date. */
const NIVESH_DATES = [
  "2026-06-07","2026-06-08","2026-06-09","2026-06-10","2026-06-11","2026-06-12",
  "2026-06-13","2026-06-14","2026-06-15","2026-06-16","2026-06-17","2026-06-18",
  "2026-06-19","2026-06-20","2026-06-21","2026-06-22","2026-06-23","2026-06-24",
  "2026-06-25","2026-06-26","2026-06-27","2026-06-28","2026-06-29","2026-06-30",
  "2026-07-01","2026-07-02","2026-07-03","2026-07-04","2026-07-05","2026-07-06"
];

const NIVESH_DATA = {

  /* ---- six local demo users, diverse by age / risk / asset mix ---------- */
  users: [
    {
      id: "priya", username: "priya", password: "priya123",
      name: "Priya Sharma", pan: "ABCPS****K", avatar: "PS",
      persona: "Balanced saver · bank-heavy, needs diversifying",
      seed: { onboarded: false, riskProfile: null, completedLessons: [] },
      accounts: [
        { id: "acc_zer",  broker: "Zerodha",          depository: "NSDL",     type: "Demat & Trading", lastSync: "2026-07-06 09:12" },
        { id: "acc_grw",  broker: "Groww",            depository: "CDSL",     type: "Demat & Trading", lastSync: "2026-07-06 09:12" },
        { id: "acc_hdfc", broker: "HDFC Securities",   depository: "NSDL",     type: "Demat & Trading", lastSync: "2026-07-06 09:11" },
        { id: "acc_cams", broker: "MF Central (CAMS)", depository: "CAMS RTA", type: "MF Folios",       lastSync: "2026-07-06 08:58" }
      ],
      holdings: [
        { id: "h_hdfc_z", accountId: "acc_zer",  symbol: "HDFCBANK",   name: "HDFC Bank Ltd",         assetClass: "equity", sector: "Financials", qty: 120, avgPrice: 760,  ltp: 829.85, dayChangePct: -1.9 },
        { id: "h_hdfc_h", accountId: "acc_hdfc", symbol: "HDFCBANK",   name: "HDFC Bank Ltd",         assetClass: "equity", sector: "Financials", qty: 70,  avgPrice: 760,  ltp: 829.85, dayChangePct: -1.9 },
        { id: "h_icici_z",accountId: "acc_zer",  symbol: "ICICIBANK",  name: "ICICI Bank Ltd",        assetClass: "equity", sector: "Financials", qty: 40,  avgPrice: 1300, ltp: 1426.9, dayChangePct: -2.0 },
        { id: "h_icici_g",accountId: "acc_grw",  symbol: "ICICIBANK",  name: "ICICI Bank Ltd",        assetClass: "equity", sector: "Financials", qty: 25,  avgPrice: 1300, ltp: 1426.9, dayChangePct: -2.0 },
        { id: "h_rel",    accountId: "acc_zer",  symbol: "RELIANCE",   name: "Reliance Industries",   assetClass: "equity", sector: "Energy",     qty: 40,  avgPrice: 1360, ltp: 1321.3, dayChangePct: -0.8 },
        { id: "h_tcs",    accountId: "acc_grw",  symbol: "TCS",        name: "Tata Consultancy Svcs", assetClass: "equity", sector: "IT",         qty: 10,  avgPrice: 1980, ltp: 2057.6, dayChangePct:  0.2 },
        { id: "h_infy",   accountId: "acc_hdfc", symbol: "INFY",       name: "Infosys Ltd",           assetClass: "equity", sector: "IT",         qty: 25,  avgPrice: 1090, ltp: 1042.2, dayChangePct: -0.2 },
        { id: "h_tmpv",   accountId: "acc_grw",  symbol: "TMPV",       name: "Tata Motors PV Ltd",    assetClass: "equity", sector: "Auto",       qty: 60,  avgPrice: 360,  ltp: 347.05, dayChangePct: -3.8 },
        { id: "h_airtel", accountId: "acc_zer",  symbol: "BHARTIARTL", name: "Bharti Airtel Ltd",     assetClass: "equity", sector: "Telecom",    qty: 18,  avgPrice: 1700, ltp: 1925.7, dayChangePct: -1.2 },
        { id: "h_axis", accountId: "acc_cams", symbol: "AXISBLUE", schemeCode: 120465, name: "Axis Large Cap Fund — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 1800, avgPrice: 60.0, ltp: 69.51, dayChangePct: -2.0,
          underlying: [
            { symbol: "HDFCBANK",  name: "HDFC Bank",   weight: 9.2 },
            { symbol: "ICICIBANK", name: "ICICI Bank",  weight: 8.1 },
            { symbol: "RELIANCE",  name: "Reliance",    weight: 7.5 },
            { symbol: "INFY",      name: "Infosys",     weight: 6.3 },
            { symbol: "TCS",       name: "TCS",         weight: 5.4 }
          ] },
        { id: "h_mirae", accountId: "acc_cams", symbol: "MIRAELC", schemeCode: 118825, name: "Mirae Asset Large Cap — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 900, avgPrice: 118.0, ltp: 127.95, dayChangePct: -2.0,
          underlying: [
            { symbol: "HDFCBANK",   name: "HDFC Bank",     weight: 8.8 },
            { symbol: "ICICIBANK",  name: "ICICI Bank",    weight: 7.9 },
            { symbol: "RELIANCE",   name: "Reliance",      weight: 7.1 },
            { symbol: "INFY",       name: "Infosys",       weight: 5.8 },
            { symbol: "BHARTIARTL", name: "Bharti Airtel", weight: 4.9 }
          ] },
        { id: "h_tatacap", accountId: "acc_zer",  symbol: "TATACAP81", name: "Tata Capital NCD 8.1% 2029", assetClass: "bond", sector: "Financials",  qty: 50,    avgPrice: 1000, ltp: 1035,   dayChangePct:  0.05 },
        { id: "h_gold",    accountId: "acc_hdfc", symbol: "GOLDBEES",  name: "Nippon India Gold ETF",      assetClass: "etf",  sector: "Commodities", qty: 500,   avgPrice: 95,   ltp: 119.51, dayChangePct:  0.8 },
        { id: "h_cash",    accountId: "acc_zer",  symbol: "CASH",      name: "Idle Cash (settlement)",     assetClass: "cash", sector: "Cash",        qty: 52000, avgPrice: 1,    ltp: 1,      dayChangePct:  0.0 }
      ]
    },

    {
      id: "rajesh", username: "rajesh", password: "rajesh123",
      name: "Rajesh Kumar", pan: "AKRPK****M", avatar: "RK",
      persona: "Conservative retiree (58) · capital-protection, income",
      seed: { onboarded: true, riskProfile: "conservative", riskScore: 8, completedLessons: ["bonds", "sgb"] },
      accounts: [
        { id: "acc_hdfc", broker: "HDFC Securities",   depository: "NSDL",     type: "Demat & Trading", lastSync: "2026-07-06 09:05" },
        { id: "acc_cams", broker: "MF Central (CAMS)", depository: "CAMS RTA", type: "MF Folios",       lastSync: "2026-07-06 08:50" }
      ],
      holdings: [
        { id: "r_ncd",   accountId: "acc_hdfc", symbol: "TATACAP81", name: "Tata Capital NCD 8.1% 2029", assetClass: "bond", sector: "Financials",  qty: 100, avgPrice: 1000, ltp: 1035,   dayChangePct: 0.05 },
        { id: "r_sgb",   accountId: "acc_hdfc", symbol: "SGB2032",   name: "Sovereign Gold Bond 2032",   assetClass: "bond", sector: "Commodities", qty: 6,   avgPrice: 6000, ltp: 6480,   dayChangePct: 0.6 },
        { id: "r_gold",  accountId: "acc_hdfc", symbol: "GOLDBEES",  name: "Nippon India Gold ETF",      assetClass: "etf",  sector: "Commodities", qty: 400, avgPrice: 90,   ltp: 119.51, dayChangePct: 0.8 },
        { id: "r_nifty", accountId: "acc_cams", symbol: "UTINIF50",  schemeCode: 120716, name: "UTI Nifty 50 Index — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 300, avgPrice: 150, ltp: 170.5, dayChangePct: -0.9 },
        { id: "r_hdfc",  accountId: "acc_hdfc", symbol: "HDFCBANK",  name: "HDFC Bank Ltd",              assetClass: "equity", sector: "Financials", qty: 30, avgPrice: 790, ltp: 829.85, dayChangePct: -1.9 },
        { id: "r_cash",  accountId: "acc_hdfc", symbol: "CASH",      name: "Idle Cash (settlement)",     assetClass: "cash", sector: "Cash",        qty: 120000, avgPrice: 1, ltp: 1,      dayChangePct: 0.0 }
      ]
    },

    {
      id: "ananya", username: "ananya", password: "ananya123",
      name: "Ananya Iyer", pan: "AXIPI****R", avatar: "AI",
      persona: "First-job investor (26) · aggressive, tech-concentrated",
      seed: { onboarded: true, riskProfile: "aggressive", riskScore: 22, completedLessons: [] },
      accounts: [
        { id: "acc_zer", broker: "Zerodha", depository: "NSDL", type: "Demat & Trading", lastSync: "2026-07-06 09:14" },
        { id: "acc_grw", broker: "Groww",   depository: "CDSL", type: "Demat & Trading", lastSync: "2026-07-06 09:14" }
      ],
      holdings: [
        { id: "a_tcs",  accountId: "acc_zer", symbol: "TCS",     name: "Tata Consultancy Svcs", assetClass: "equity", sector: "IT",    qty: 10, avgPrice: 1900, ltp: 2057.6, dayChangePct: 0.2 },
        { id: "a_infy", accountId: "acc_zer", symbol: "INFY",    name: "Infosys Ltd",           assetClass: "equity", sector: "IT",    qty: 15, avgPrice: 1000, ltp: 1042.2, dayChangePct: -0.2 },
        { id: "a_rel",  accountId: "acc_grw", symbol: "RELIANCE",name: "Reliance Industries",   assetClass: "equity", sector: "Energy",qty: 5,  avgPrice: 1400, ltp: 1321.3, dayChangePct: -0.8 },
        { id: "a_tmpv", accountId: "acc_grw", symbol: "TMPV",    name: "Tata Motors PV Ltd",    assetClass: "equity", sector: "Auto",  qty: 20, avgPrice: 320,  ltp: 347.05, dayChangePct: -3.8 },
        { id: "a_axis", accountId: "acc_zer", symbol: "AXISBLUE", schemeCode: 120465, name: "Axis Large Cap Fund — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 500, avgPrice: 64, ltp: 69.51, dayChangePct: -2.0,
          underlying: [
            { symbol: "HDFCBANK",  name: "HDFC Bank",  weight: 9.2 },
            { symbol: "ICICIBANK", name: "ICICI Bank", weight: 8.1 },
            { symbol: "RELIANCE",  name: "Reliance",   weight: 7.5 },
            { symbol: "INFY",      name: "Infosys",    weight: 6.3 },
            { symbol: "TCS",       name: "TCS",        weight: 5.4 }
          ] },
        { id: "a_cash", accountId: "acc_zer", symbol: "CASH", name: "Idle Cash (settlement)", assetClass: "cash", sector: "Cash", qty: 8000, avgPrice: 1, ltp: 1, dayChangePct: 0.0 }
      ]
    },

    {
      id: "farhan", username: "farhan", password: "farhan123",
      name: "Mohammed Farhan", pan: "AFZPF****Q", avatar: "MF",
      persona: "Income investor (45) · REITs, InvITs & bonds",
      seed: { onboarded: true, riskProfile: "balanced", riskScore: 15, completedLessons: ["reit", "invit", "bonds"] },
      accounts: [
        { id: "acc_hdfc", broker: "HDFC Securities", depository: "NSDL", type: "Demat & Trading", lastSync: "2026-07-06 09:08" },
        { id: "acc_zer",  broker: "Zerodha",         depository: "NSDL", type: "Demat & Trading", lastSync: "2026-07-06 09:10" }
      ],
      holdings: [
        { id: "f_emb",  accountId: "acc_hdfc", symbol: "EMBASSY",   name: "Embassy Office Parks REIT",  assetClass: "reit",  sector: "Real Estate",    qty: 200, avgPrice: 340, ltp: 369.92, dayChangePct: -0.5 },
        { id: "f_mind", accountId: "acc_hdfc", symbol: "MINDSPACE", name: "Mindspace Business Parks REIT",assetClass: "reit", sector: "Real Estate",    qty: 150, avgPrice: 330, ltp: 345.06, dayChangePct: -0.4 },
        { id: "f_pg",   accountId: "acc_zer",  symbol: "PGINVIT",   name: "PowerGrid InvIT",            assetClass: "invit", sector: "Infrastructure", qty: 500, avgPrice: 100, ltp: 95.96,  dayChangePct: -0.7 },
        { id: "f_ig",   accountId: "acc_zer",  symbol: "INDIGRID",  name: "IndiGrid InvIT",             assetClass: "invit", sector: "Infrastructure", qty: 300, avgPrice: 132, ltp: 140.06, dayChangePct: 0.3 },
        { id: "f_ncd",  accountId: "acc_hdfc", symbol: "TATACAP81", name: "Tata Capital NCD 8.1% 2029", assetClass: "bond",  sector: "Financials",     qty: 50,  avgPrice: 1000,ltp: 1035,   dayChangePct: 0.05 },
        { id: "f_gold", accountId: "acc_hdfc", symbol: "GOLDBEES",  name: "Nippon India Gold ETF",      assetClass: "etf",   sector: "Commodities",    qty: 200, avgPrice: 100, ltp: 119.51, dayChangePct: 0.8 },
        { id: "f_cash", accountId: "acc_zer",  symbol: "CASH",      name: "Idle Cash (settlement)",     assetClass: "cash",  sector: "Cash",           qty: 30000, avgPrice: 1, ltp: 1,     dayChangePct: 0.0 }
      ]
    },

    {
      id: "sunita", username: "sunita", password: "sunita123",
      name: "Sunita Devi", pan: "BQSPD****N", avatar: "SD",
      persona: "Just starting out (34) · one index fund + cash",
      seed: { onboarded: true, riskProfile: null, completedLessons: [] },
      accounts: [
        { id: "acc_grw", broker: "Groww", depository: "CDSL", type: "Demat & Trading", lastSync: "2026-07-06 09:20" }
      ],
      holdings: [
        { id: "s_nifty", accountId: "acc_grw", symbol: "UTINIF50", schemeCode: 120716, name: "UTI Nifty 50 Index — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 100, avgPrice: 165, ltp: 170.5, dayChangePct: -0.9 },
        { id: "s_cash",  accountId: "acc_grw", symbol: "CASH",     name: "Idle Cash (settlement)", assetClass: "cash", sector: "Cash", qty: 15000, avgPrice: 1, ltp: 1, dayChangePct: 0.0 }
      ]
    },

    {
      id: "vikram", username: "vikram", password: "vikram123",
      name: "Vikram Reddy", pan: "AWVPR****J", avatar: "VR",
      persona: "High-net-worth (50) · large, all-asset-class book",
      seed: { onboarded: true, riskProfile: "aggressive", riskScore: 20, completedLessons: ["reit", "invit", "bonds", "sgb", "diversification"] },
      accounts: [
        { id: "acc_zer",  broker: "Zerodha",          depository: "NSDL",     type: "Demat & Trading", lastSync: "2026-07-06 09:02" },
        { id: "acc_hdfc", broker: "HDFC Securities",   depository: "NSDL",     type: "Demat & Trading", lastSync: "2026-07-06 09:03" },
        { id: "acc_grw",  broker: "Groww",            depository: "CDSL",     type: "Demat & Trading", lastSync: "2026-07-06 09:04" },
        { id: "acc_cams", broker: "MF Central (CAMS)", depository: "CAMS RTA", type: "MF Folios",       lastSync: "2026-07-06 08:45" }
      ],
      holdings: [
        { id: "v_hdfc",  accountId: "acc_zer",  symbol: "HDFCBANK",  name: "HDFC Bank Ltd",         assetClass: "equity", sector: "Financials", qty: 200, avgPrice: 700,  ltp: 829.85, dayChangePct: -1.9 },
        { id: "v_icici", accountId: "acc_hdfc", symbol: "ICICIBANK", name: "ICICI Bank Ltd",        assetClass: "equity", sector: "Financials", qty: 100, avgPrice: 1200, ltp: 1426.9, dayChangePct: -2.0 },
        { id: "v_rel",   accountId: "acc_zer",  symbol: "RELIANCE",  name: "Reliance Industries",   assetClass: "equity", sector: "Energy",     qty: 80,  avgPrice: 1250, ltp: 1321.3, dayChangePct: -0.8 },
        { id: "v_infy",  accountId: "acc_grw",  symbol: "INFY",      name: "Infosys Ltd",           assetClass: "equity", sector: "IT",         qty: 60,  avgPrice: 980,  ltp: 1042.2, dayChangePct: -0.2 },
        { id: "v_airtel",accountId: "acc_zer",  symbol: "BHARTIARTL",name: "Bharti Airtel Ltd",     assetClass: "equity", sector: "Telecom",    qty: 40,  avgPrice: 1600, ltp: 1925.7, dayChangePct: -1.2 },
        { id: "v_axis", accountId: "acc_cams", symbol: "AXISBLUE", schemeCode: 120465, name: "Axis Large Cap Fund — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 3000, avgPrice: 55, ltp: 69.51, dayChangePct: -2.0,
          underlying: [
            { symbol: "HDFCBANK",  name: "HDFC Bank",  weight: 9.2 },
            { symbol: "ICICIBANK", name: "ICICI Bank", weight: 8.1 },
            { symbol: "RELIANCE",  name: "Reliance",   weight: 7.5 },
            { symbol: "INFY",      name: "Infosys",    weight: 6.3 },
            { symbol: "TCS",       name: "TCS",        weight: 5.4 }
          ] },
        { id: "v_mirae", accountId: "acc_cams", symbol: "MIRAELC", schemeCode: 118825, name: "Mirae Asset Large Cap — Direct Growth", assetClass: "mf", sector: "Diversified", qty: 1500, avgPrice: 110, ltp: 127.95, dayChangePct: -2.0,
          underlying: [
            { symbol: "HDFCBANK",   name: "HDFC Bank",     weight: 8.8 },
            { symbol: "ICICIBANK",  name: "ICICI Bank",    weight: 7.9 },
            { symbol: "RELIANCE",   name: "Reliance",      weight: 7.1 },
            { symbol: "INFY",       name: "Infosys",       weight: 5.8 },
            { symbol: "BHARTIARTL", name: "Bharti Airtel", weight: 4.9 }
          ] },
        { id: "v_emb",  accountId: "acc_hdfc", symbol: "EMBASSY",  name: "Embassy Office Parks REIT", assetClass: "reit",  sector: "Real Estate",    qty: 300, avgPrice: 350, ltp: 369.92, dayChangePct: -0.5 },
        { id: "v_pg",   accountId: "acc_zer",  symbol: "PGINVIT",  name: "PowerGrid InvIT",           assetClass: "invit", sector: "Infrastructure", qty: 800, avgPrice: 105, ltp: 95.96,  dayChangePct: -0.7 },
        { id: "v_ncd",  accountId: "acc_hdfc", symbol: "TATACAP81",name: "Tata Capital NCD 8.1% 2029",assetClass: "bond",  sector: "Financials",     qty: 100, avgPrice: 1000,ltp: 1035,   dayChangePct: 0.05 },
        { id: "v_gold", accountId: "acc_hdfc", symbol: "GOLDBEES", name: "Nippon India Gold ETF",     assetClass: "etf",   sector: "Commodities",    qty: 1000, avgPrice: 80, ltp: 119.51, dayChangePct: 0.8 },
        { id: "v_cash", accountId: "acc_zer",  symbol: "CASH",     name: "Idle Cash (settlement)",    assetClass: "cash",  sector: "Cash",           qty: 200000, avgPrice: 1, ltp: 1,     dayChangePct: 0.0 }
      ]
    }
  ],

  /* 9 registered catalogue products + 1 unregistered scam (always BLOCKED).
     Real listed REITs/InvITs carry quoteSym → live NSE price via real-quotes.js;
     the index fund carries schemeCode → live AMFI NAV. Shared across users.   */
  products: [
    { id: "p_embassy",  name: "Embassy Office Parks REIT", category: "REIT",            assetClass: "reit",  quoteSym: "EMBASSY",   riskGrade: "B", liquidity: "High", complexity: 2, minInvest: 370,   price: 369.92, yieldOrReturn: "6.8% distribution yield", issuerRating: "AAA",       registered: true,  requiredLesson: "reit",  minTier: "balanced",
      blurb: "Owns Grade-A office parks across Bengaluru, Mumbai, Pune & NCR; pays out rent as quarterly distributions." },
    { id: "p_mindspace",name: "Mindspace Business Parks REIT", category: "REIT",        assetClass: "reit",  quoteSym: "MINDSPACE", riskGrade: "B", liquidity: "High", complexity: 2, minInvest: 345,   price: 345.06, yieldOrReturn: "6.5% distribution yield", issuerRating: "AAA",       registered: true,  requiredLesson: "reit",  minTier: "balanced",
      blurb: "Commercial office REIT sponsored by K Raheja Corp with assets in Mumbai, Hyderabad, Pune & Chennai." },
    { id: "p_powergrid",name: "PowerGrid InvIT",          category: "InvIT",           assetClass: "invit", quoteSym: "PGINVIT",   riskGrade: "B", liquidity: "Medium", complexity: 2, minInvest: 96,  price: 95.96,  yieldOrReturn: "9.5% distribution yield", issuerRating: "AAA",       registered: true,  requiredLesson: "invit", minTier: "balanced",
      blurb: "Holds operational inter-state power transmission lines with long-term regulated cash flows." },
    { id: "p_indigrid", name: "IndiGrid InvIT",           category: "InvIT",           assetClass: "invit", quoteSym: "INDIGRID",  riskGrade: "C", liquidity: "Medium", complexity: 2, minInvest: 140, price: 140.06, yieldOrReturn: "10.2% distribution yield", issuerRating: "AAA",      registered: true,  requiredLesson: "invit", minTier: "balanced",
      blurb: "India's first power-sector InvIT; transmission + a growing renewables portfolio." },
    { id: "p_tatacap",  name: "Tata Capital NCD 8.1% 2029", category: "Corporate Bond",assetClass: "bond",  riskGrade: "A", liquidity: "Medium", complexity: 2, minInvest: 10000, price: 1000, yieldOrReturn: "8.1% annual coupon", issuerRating: "AAA",     registered: true,  requiredLesson: "bonds", minTier: "conservative",
      blurb: "Senior secured NCD from a AAA-rated NBFC; fixed 8.1% coupon, maturity 2029." },
    { id: "p_piramal",  name: "Piramal Capital NCD 9.4% 2028", category: "Corporate Bond", assetClass: "bond", riskGrade: "C", liquidity: "Low", complexity: 2, minInvest: 10000, price: 1000, yieldOrReturn: "9.4% annual coupon", issuerRating: "AA-",  registered: true,  requiredLesson: "bonds", minTier: "balanced",
      blurb: "Higher-yield AA- NCD; more coupon, more credit risk and thinner secondary liquidity." },
    { id: "p_sgb",      name: "Sovereign Gold Bond 2032",  category: "Sovereign Gold Bond", assetClass: "bond", riskGrade: "A", liquidity: "Low", complexity: 1, minInvest: 6200, price: 6200, yieldOrReturn: "2.5% p.a. + gold price", issuerRating: "Sovereign", registered: true, requiredLesson: "sgb", minTier: "conservative",
      blurb: "RBI-issued bond tracking gold; pays 2.5% interest and is tax-free on maturity if held to term." },
    { id: "p_nifty",    name: "UTI Nifty 50 Index Fund — Direct Growth", category: "Index Fund", assetClass: "mf", schemeCode: 120716, riskGrade: "B", liquidity: "High", complexity: 1, minInvest: 500, price: 170.5, yieldOrReturn: "Tracks NIFTY 50", issuerRating: "NA",  registered: true,  requiredLesson: null,    minTier: "conservative",
      blurb: "Low-cost fund mirroring India's 50 largest listed companies — broad, cheap equity exposure." },
    { id: "p_tbill",    name: "91-Day Treasury Bill",     category: "Treasury Bill",   assetClass: "bond",  riskGrade: "A", liquidity: "High", complexity: 1, minInvest: 10000, price: 1000, yieldOrReturn: "6.9% annualised yield", issuerRating: "Sovereign", registered: true,  requiredLesson: null,    minTier: "conservative",
      blurb: "Ultra-short government paper; parking spot for idle cash, effectively zero credit risk." },
    { id: "p_scam",     name: "QuickRich Agro Gold Scheme", category: "Unregistered Scheme", assetClass: "scam", riskGrade: "E", liquidity: "Low", complexity: 3, minInvest: 25000, price: 25000, yieldOrReturn: "24% assured returns", issuerRating: "Unrated", registered: false, requiredLesson: null, minTier: "aggressive",
      blurb: "\"Guaranteed 24% assured returns\" from an unregistered agro-gold pool. Not found in any SEBI/exchange registry — classic red flag." }
  ],

  /* Investment-gateway brokers. NiveshOS is an aggregator/advisor: it prepares
     the order and hands off to a SEBI-registered broker for KYC, payment and
     execution — it never places trades itself. `supports` lists the asset
     classes each broker can transact, used to gate the redirect. `host` is the
     placeholder deep-link target; a real integration swaps it for the broker's
     basket/OAuth handoff. Logos are rendered as colour + mark placeholders.   */
  brokers: [
    { id: "zerodha",    name: "Zerodha",     platform: "Kite",        color: "#387ed1", mark: "Z", host: "kite.zerodha.com",
      desc: "India's largest retail broker. Flat-fee delivery, deep charts via Kite, full listed-market coverage.",
      supports: ["equity", "etf", "mf", "bond", "reit", "invit"] },
    { id: "groww",      name: "Groww",       platform: "Groww App",   color: "#00b386", mark: "G", host: "groww.in",
      desc: "Beginner-friendly app for stocks, ETFs and direct (zero-commission) mutual funds.",
      supports: ["equity", "etf", "mf", "bond"] },
    { id: "angelone",   name: "Angel One",   platform: "Angel One",   color: "#f4593b", mark: "A", host: "angelone.in",
      desc: "Full-service broker with research, SmartAPI and every listed asset class including REITs & InvITs.",
      supports: ["equity", "etf", "mf", "bond", "reit", "invit"] },
    { id: "upstox",     name: "Upstox",      platform: "Upstox Pro",  color: "#5a3df0", mark: "U", host: "upstox.com",
      desc: "Low-cost broker backed by Ratan Tata & Tiger Global; fast paperless onboarding.",
      supports: ["equity", "etf", "mf", "bond"] },
    { id: "paytmmoney", name: "Paytm Money", platform: "Paytm Money", color: "#00baf2", mark: "P", host: "paytmmoney.com",
      desc: "SEBI-registered arm of Paytm for stocks, ETFs, direct mutual funds and NPS.",
      supports: ["equity", "etf", "mf", "bond"] }
  ],

  /* 5 education modules (shared) ------------------------------------------ */
  lessons: [
    { id: "reit", title: "REITs", icon: "building", minutes: 4,
      sections: [
        { h: "What is a REIT?", p: "A Real Estate Investment Trust owns income-producing property — think office parks and malls — and lists on the exchange like a share. Buying one unit makes you a tiny landlord without needing crores for a building." },
        { h: "Where the return comes from", p: "REITs must pay out at least 90% of their rental income to unitholders. So you earn a regular 'distribution' (like rent) plus any rise in the unit price. It behaves part-bond, part-equity." },
        { h: "The risks", p: "If tenants leave or offices sit empty, distributions can fall. Prices also move with interest rates: when rates rise, REIT prices often dip. Liquidity is decent but thinner than large-cap stocks." }
      ],
      quiz: [
        { q: "What does a REIT mainly own?", options: ["Government bonds", "Income-producing real estate", "Foreign currency", "Crypto assets"], answer: 1 },
        { q: "At least how much income must a REIT distribute to unitholders?", options: ["10%", "50%", "90%", "None — it's optional"], answer: 2 },
        { q: "REIT prices tend to fall when…", options: ["Interest rates rise", "Rents rise", "More tenants sign up", "The unit splits"], answer: 0 }
      ] },
    { id: "invit", title: "InvITs", icon: "zap", minutes: 4,
      sections: [
        { h: "What is an InvIT?", p: "An Infrastructure Investment Trust is the REIT idea applied to infrastructure — power lines, highways, gas pipelines. You pool money with others to own toll/tariff-earning assets and collect the cash they throw off." },
        { h: "Why the yields look high", p: "Regulated infra assets produce steady, contracted cash flows, so InvITs often distribute 9–11%. But part of that payout is return of capital, not pure profit — the asset slowly depletes, so headline yield overstates true return." },
        { h: "The risks", p: "Cash flows depend on the asset (traffic on a road, uptime of a line) and on regulation. Units can be less liquid, and leverage inside the trust adds interest-rate sensitivity." }
      ],
      quiz: [
        { q: "An InvIT typically owns…", options: ["Shopping malls", "Infrastructure like power lines & highways", "Bank deposits", "Gold bars"], answer: 1 },
        { q: "Why can InvIT distribution yields look unusually high?", options: ["They never pay tax", "Part of the payout is return of capital", "They are risk-free", "They double every year"], answer: 1 },
        { q: "A key driver of an InvIT's cash flow is…", options: ["The cricket season", "Usage of the underlying asset (e.g. traffic)", "The founder's mood", "Gold prices"], answer: 1 }
      ] },
    { id: "bonds", title: "Corporate Bonds", icon: "fileText", minutes: 4,
      sections: [
        { h: "Lending, not owning", p: "A bond is a loan you give to a company. It promises a fixed coupon (interest) on set dates and returns your principal at maturity. Unlike a share, you don't own the business — you're its lender." },
        { h: "Rating = safety grade", p: "Agencies grade credit quality: AAA is safest, then AA, A, and lower. A higher coupon usually means higher risk. A AAA bond at 8% and an AA- bond at 9.4% are not the same bet — the extra 1.4% is the price of extra default risk." },
        { h: "The risks", p: "Credit risk (issuer can't pay), interest-rate risk (existing bonds lose value when rates rise), and liquidity risk (harder to sell mid-term). Match the maturity to when you need the money." }
      ],
      quiz: [
        { q: "Owning a corporate bond makes you the company's…", options: ["Owner", "Lender", "Employee", "Auditor"], answer: 1 },
        { q: "Which rating is the safest?", options: ["AA-", "A", "AAA", "BBB"], answer: 2 },
        { q: "A bond paying a higher coupon usually carries…", options: ["Lower risk", "Higher risk", "No risk", "Guaranteed returns"], answer: 1 }
      ] },
    { id: "sgb", title: "Sovereign Gold Bonds", icon: "coins", minutes: 3,
      sections: [
        { h: "Gold without the locker", p: "A Sovereign Gold Bond (SGB) is issued by the RBI and tracks the price of gold — but you hold it in your demat, so there's no making charge, no purity worry, and no storage risk." },
        { h: "You get paid to wait", p: "On top of gold's price movement, SGBs pay 2.5% interest a year on your invested amount. Held to the 8-year maturity, the capital gain from gold is tax-free — an edge physical gold and ETFs don't have." },
        { h: "The trade-offs", p: "Your money is locked for years (early exit only via the exchange, often at a discount) and if gold falls, so does your bond. It's a long-horizon diversifier, not a trading instrument." }
      ],
      quiz: [
        { q: "Who issues Sovereign Gold Bonds?", options: ["SEBI", "The RBI", "Private jewellers", "The stock exchange"], answer: 1 },
        { q: "Besides gold's price, an SGB pays…", options: ["Nothing extra", "2.5% annual interest", "Monthly dividends", "A lottery"], answer: 1 },
        { q: "A key drawback of SGBs is…", options: ["Making charges", "A long lock-in period", "Purity risk", "Storage cost"], answer: 1 }
      ] },
    { id: "diversification", title: "Diversification & Overlap", icon: "scale", minutes: 4,
      sections: [
        { h: "Don't put all eggs in one basket", p: "Diversification spreads money across assets that don't all move together, so one bad bet doesn't sink you. Concentration is the opposite — and it's the single most common retail mistake." },
        { h: "The hidden overlap trap", p: "Owning two large-cap funds feels diversified, but if both hold the same HDFC Bank, ICICI Bank and Reliance, you've simply doubled the same bets. 'Fund overlap' means less real diversification than the number of funds suggests." },
        { h: "Watch your sector tilt", p: "Add up exposure by sector, not just by stock. A portfolio that's ~40% financials — across direct banks and fund holdings — is one interest-rate shock away from a big drawdown, even if it looks spread across many names." }
      ],
      quiz: [
        { q: "Diversification works by combining assets that…", options: ["Always move together", "Don't all move together", "Are all banks", "Are all gold"], answer: 1 },
        { q: "Two large-cap funds holding the same stocks is called…", options: ["Fund overlap", "Arbitrage", "A stock split", "Hedging"], answer: 0 },
        { q: "A portfolio that is ~40% in one sector is mainly exposed to…", options: ["Nothing — it's safe", "Concentration risk", "Guaranteed gains", "Zero volatility"], answer: 1 }
      ] }
  ],

  /* 6-question risk-profiling quiz (shared) ------------------------------- */
  riskQuiz: [
    { q: "What is your age band?",
      options: [ { t: "Above 55", w: 1 }, { t: "40–55", w: 2 }, { t: "30–40", w: 3 }, { t: "Under 30", w: 4 } ] },
    { q: "When do you expect to need most of this money?",
      options: [ { t: "Within 2 years", w: 1 }, { t: "2–5 years", w: 2 }, { t: "5–10 years", w: 3 }, { t: "10+ years", w: 4 } ] },
    { q: "Your portfolio drops 20% in a month. You…",
      options: [ { t: "Sell everything to stop the bleeding", w: 1 }, { t: "Sell some and wait", w: 2 }, { t: "Do nothing, stay invested", w: 3 }, { t: "Buy more at lower prices", w: 4 } ] },
    { q: "How stable is your income?",
      options: [ { t: "Irregular / dependent on markets", w: 1 }, { t: "Stable but single source", w: 2 }, { t: "Stable with some savings buffer", w: 3 }, { t: "Very stable, large buffer", w: 4 } ] },
    { q: "How would you rate your investing knowledge?",
      options: [ { t: "Beginner", w: 1 }, { t: "Some basics", w: 2 }, { t: "Fairly confident", w: 3 }, { t: "Experienced", w: 4 } ] },
    { q: "What matters most for this portfolio?",
      options: [ { t: "Protecting capital above all", w: 1 }, { t: "Steady income", w: 2 }, { t: "Balanced growth", w: 3 }, { t: "Maximum long-term growth", w: 4 } ] }
  ],

  /* AI Suitability Assessment — the questionnaire the pre-gateway assessment
     collects. Data-driven so questions can be added later without touching the
     engine: each option carries a value `v` (1 worst … 4 best for risk-taking)
     and each question a `field` the scorer buckets into ("capacity" = ability
     to take risk, "tolerance" = willingness). `key` mirrors the field id used
     by the engine's prudence overrides (emergency, horizon).                  */
  suitabilityAssessment: [
    { id: "age", label: "What is your age?", field: "capacity",
      options: [{ t: "Under 30", v: 4 }, { t: "30–45", v: 3 }, { t: "45–60", v: 2 }, { t: "Above 60", v: 1 }] },
    { id: "occupation", label: "Your occupation / income type", field: "capacity",
      options: [{ t: "Salaried (stable)", v: 4 }, { t: "Self-employed / professional", v: 3 }, { t: "Business owner", v: 2 }, { t: "Retired / student", v: 1 }] },
    { id: "income", label: "Annual income", field: "capacity",
      options: [{ t: "Under ₹5 lakh", v: 1 }, { t: "₹5–15 lakh", v: 2 }, { t: "₹15–30 lakh", v: 3 }, { t: "Above ₹30 lakh", v: 4 }] },
    { id: "expenses", label: "Monthly expenses (share of income)", field: "capacity",
      options: [{ t: "Under 40%", v: 4 }, { t: "40–60%", v: 3 }, { t: "60–80%", v: 2 }, { t: "Over 80%", v: 1 }] },
    { id: "emergency", label: "Emergency fund", field: "capacity",
      options: [{ t: "6+ months of expenses", v: 4 }, { t: "3–6 months", v: 3 }, { t: "Under 3 months", v: 2 }, { t: "None yet", v: 1 }] },
    { id: "goal", label: "Primary goal for this money", field: "tolerance",
      options: [{ t: "Protect capital", v: 1 }, { t: "Steady income", v: 2 }, { t: "Balanced growth", v: 3 }, { t: "Maximise growth", v: 4 }] },
    { id: "horizon", label: "When will you need most of it?", field: "capacity",
      options: [{ t: "Under 2 years", v: 1 }, { t: "2–5 years", v: 2 }, { t: "5–10 years", v: 3 }, { t: "10+ years", v: 4 }] },
    { id: "tolerance", label: "If this fell 20% in a month, you'd…", field: "tolerance",
      options: [{ t: "Sell everything", v: 1 }, { t: "Sell some", v: 2 }, { t: "Hold and wait", v: 3 }, { t: "Buy more", v: 4 }] }
  ],

  /* Jargon buster — plain-language definitions, searchable in Learn and
     answerable by the copilot ("what is NAV?").                            */
  glossary: [
    { term: "NAV", def: "Net Asset Value — the per-unit price of a mutual fund, published daily by AMFI after markets close. Buy/sell orders execute at NAV, not a live price." },
    { term: "Demat account", def: "An electronic locker for your securities, held at a depository (NSDL or CDSL). Your broker is the doorway; the depository holds the assets." },
    { term: "Account Aggregator", def: "An RBI-regulated consent system that lets you share your financial data between institutions — read-only, revocable, and only after you approve each request." },
    { term: "REIT", def: "Real Estate Investment Trust — owns rent-earning property (offices, malls) and trades on the exchange. Must pay at least 90% of rental income to unitholders." },
    { term: "InvIT", def: "Infrastructure Investment Trust — the REIT idea for power lines, roads and pipelines. Distributions look high (9–11%) partly because some of it is your own capital coming back." },
    { term: "NCD", def: "Non-Convertible Debenture — a corporate bond that can't convert to shares. You're the company's lender: fixed coupon, principal at maturity, credit risk in between." },
    { term: "Coupon", def: "The fixed interest a bond pays, quoted per year on face value. A ₹1,000 bond at 8.1% pays ₹81 a year regardless of the bond's market price." },
    { term: "Credit rating", def: "An agency's grade of how likely an issuer is to repay: AAA is safest, then AA, A, BBB… A higher coupon on a lower rating is payment for extra default risk." },
    { term: "SGB", def: "Sovereign Gold Bond — RBI-issued paper that tracks the gold price, pays 2.5% a year on top, and is capital-gains tax-free if held the full 8 years." },
    { term: "T-Bill", def: "Treasury Bill — government paper maturing in under a year, sold at a discount. Effectively zero credit risk; the parking spot for short-term cash." },
    { term: "Distribution yield", def: "What a REIT/InvIT pays out yearly as a % of its unit price. Not the same as a guaranteed return — payouts move with rents, traffic and rates." },
    { term: "Fund overlap", def: "When two funds hold the same underlying stocks. Two large-caps sharing 4 of their top 5 holdings gives you double the same bet, not diversification." },
    { term: "Concentration risk", def: "Too much of the portfolio in one stock or sector. One shock — a rate hike for banks, a scandal for a stock — moves your whole net worth." },
    { term: "Drawdown", def: "The fall from a portfolio's peak to its trough. A 50% drawdown needs a 100% gain to recover — which is why avoiding deep falls beats chasing gains." },
    { term: "LTCG", def: "Long-Term Capital Gains — profit on assets held past a threshold (12 months for listed equity), taxed at a lower rate than short-term gains." },
    { term: "Suitability", def: "Matching a product's risk and complexity to your profile before you're allowed to buy — the gate that stands between a beginner and a leveraged exotic." }
  ],

  /* ISIN master — simulates the depository / RTA security master a CAS import
     resolves each row against (this is exactly what a real NSDL/CDSL feed keys
     on). ISIN → instrument metadata. Extend to recognise more instruments;
     any ISIN not here surfaces as "unknown" for manual correction on import. */
  isinMap: {
    "INE040A01034": { symbol: "HDFCBANK",   name: "HDFC Bank Ltd",                       assetClass: "equity", sector: "Financials" },
    "INE090A01021": { symbol: "ICICIBANK",  name: "ICICI Bank Ltd",                      assetClass: "equity", sector: "Financials" },
    "INE002A01018": { symbol: "RELIANCE",   name: "Reliance Industries Ltd",             assetClass: "equity", sector: "Energy" },
    "INE009A01021": { symbol: "INFY",       name: "Infosys Ltd",                         assetClass: "equity", sector: "IT" },
    "INE467B01029": { symbol: "TCS",        name: "Tata Consultancy Services Ltd",       assetClass: "equity", sector: "IT" },
    "INE397D01024": { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd",                   assetClass: "equity", sector: "Telecom" },
    "INE585B01010": { symbol: "MARUTI",     name: "Maruti Suzuki India Ltd",             assetClass: "equity", sector: "Auto" },
    "INE752E01010": { symbol: "POWERGRID",  name: "Power Grid Corp of India Ltd",        assetClass: "equity", sector: "Utilities" },
    "INF209KB1ZK6": { symbol: "SBIBLUE",    name: "SBI Bluechip Fund — Direct Growth",   assetClass: "mf",     sector: "Diversified" },
    "INF179KC1947": { symbol: "HDFCFLEXI",  name: "HDFC Flexi Cap Fund — Direct Growth", assetClass: "mf",     sector: "Diversified" }
  },

  /* Sample CAMS/KFintech-style Consolidated Account Statement (plain text),
     used for the demo and as a fallback when a PDF can't be parsed. Columns are
     separated by 2+ spaces. Deliberately mixed so the importer exercises every
     bucket: new instruments, a holding already in the book (duplicate), an
     unknown ISIN (needs manual correction) and a malformed row (error).       */
  sampleCAS: [
    "CAMS & KFintech — Consolidated Account Statement (CAS)",
    "Statement Period: 01-Apr-2026 to 06-Jul-2026     PAN: AWVPR****J",
    "Depository: NSDL / CDSL      Registrar: CAMS / KFintech",
    "",
    "ISIN            Instrument                              Type    Qty         Value(INR)",
    "INE467B01029    Tata Consultancy Services Ltd           EQ      15          46500.00",
    "INE585B01010    Maruti Suzuki India Ltd                 EQ      6           66120.00",
    "INF209KB1ZK6    SBI Bluechip Fund - Direct Growth       MF      250.5       23610.00",
    "INE752E01010    Power Grid Corp of India Ltd            EQ      120         34800.00",
    "INE040A01034    HDFC Bank Ltd                           EQ      50          41492.50",
    "INE528G01035    Yes Bank Ltd                            EQ      400         8200.00",
    "INE999X01099    Unlisted Startup Pre-IPO Pool           EQ",
    "End of Statement"
  ].join("\n")
};

/* --------------------------------------------------------------------------
   Merge the REAL market snapshot (real-quotes.js) over baked fallbacks — for
   every user's holdings and the shared product catalogue — then synthesise a
   deterministic 30-day net-worth history per user ending at their live total.
   No-op for prices if real-quotes.js is absent (offline fallback stays).
   -------------------------------------------------------------------------- */
(function finalizeData() {
  var RQ = (typeof window !== "undefined") && window.REAL_QUOTES;
  if (RQ) {
    var quotes = RQ.quotes || {}, navs = RQ.navs || {};
    NIVESH_DATA.users.forEach(function (u) {
      (u.holdings || []).forEach(function (h) {
        if (h.schemeCode && navs[h.schemeCode] != null) h.ltp = navs[h.schemeCode].nav;
        else if (quotes[h.symbol] != null) h.ltp = quotes[h.symbol].ltp;
      });
    });
    (NIVESH_DATA.products || []).forEach(function (p) {
      if (p.schemeCode && navs[p.schemeCode] != null) p.price = navs[p.schemeCode].nav;
      else if (p.quoteSym && quotes[p.quoteSym] != null) p.price = quotes[p.quoteSym].ltp;
    });
    NIVESH_DATA.dataSource = { asOf: RQ.asOf, sources: RQ.sources || [], live: true };
  } else {
    NIVESH_DATA.dataSource = { asOf: "baked snapshot", sources: [], live: false };
  }

  // deterministic seeded RNG so a user's chart is stable across reloads
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function genHistory(end, seedStr) {
    var seed = 0;
    for (var i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
    var rnd = mulberry32(seed);
    var n = NIVESH_DATES.length;
    var drift = 0.02 + rnd() * 0.05;            // +2%..+7% over the window
    var start = end / (1 + drift);
    return NIVESH_DATES.map(function (t, i) {
      if (i === n - 1) return { t: t, v: Math.round(end) };
      var base = start + (end - start) * (i / (n - 1));
      var wobble = (rnd() - 0.5) * 0.012 * base; // ±0.6% daily noise
      return { t: t, v: Math.round(base + wobble) };
    });
  }
  NIVESH_DATA.users.forEach(function (u) {
    var nw = (u.holdings || []).reduce(function (s, h) { return s + (h.qty || 0) * (h.ltp || 0); }, 0);
    u.history = genHistory(nw, u.id);
  });
})();

/* expose for other scripts / debugging */
if (typeof window !== "undefined") { window.NIVESH_DATA = NIVESH_DATA; }
