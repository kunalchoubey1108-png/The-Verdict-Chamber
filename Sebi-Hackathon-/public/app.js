/* ==========================================================================
   NiveshOS — app.js  (Agent A / logic)
   Vanilla browser script (no modules, no framework, runs from file://).
   Owns: localStorage state, panel router, onboarding, all panel renderers,
   inline-SVG charts, suitability engine, simulated order routing, rule-based
   copilot, audit/consent trails. Queries the DOM by the BUILD_SPEC contract
   IDs; every lookup is null-safe so a missing container never crashes.
   Exposes window.NIVESH = { switchPanel, state, fmt }.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.NIVESH_DATA || {};
  var TODAY = "2026-07-06";

  /* -------------------------------------------------------------- helpers */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  var _inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  function fmt(n) { return "₹" + _inr.format(Math.round(n || 0)); }
  function fmtSigned(n) { return (n >= 0 ? "+" : "−") + "₹" + _inr.format(Math.abs(Math.round(n || 0))); }
  function pct(n, d) { d = d == null ? 1 : d; return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(d) + "%"; }
  function cls_dir(n) { return n > 0 ? "positive" : n < 0 ? "negative" : "neutral"; }
  function dirColor(n) { return n > 0 ? "var(--good)" : n < 0 ? "var(--critical)" : "var(--ink-muted)"; }
  var SERIES = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  function sv(i) { return "var(" + SERIES[i % SERIES.length] + ")"; }

  /* ---- inline SVG icon set (Lucide-derived, stroke, currentColor) --------
     Replaces emoji app-wide so glyphs read as one system with the nav icons.
     Sized in `em` so each icon inherits its container's font-size. Add a name
     here and reference it via ic("name"). */
  var ICONS = {
    check:    '<path d="M20 6 9 17l-5-5"/>',
    x:        '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    refresh:  '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    warning:  '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info:     '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ban:      '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    lock:     '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    search:   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    file:     '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    target:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    pencil:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash:    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    zap:      '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    coins:    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    scale:    '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    palm:     '<path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/>',
    lifebuoy: '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
    grad:     '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.84l8.57 3.9a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    home:     '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    umbrella: '<path d="M22 12a10.06 10.06 0 0 0-20 0z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/>',
    car:      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">' + (ICONS[name] || "") + "</svg>";
  }

  /* ------------------------------------------------------------- state
     Persistence is namespaced per signed-in user: niveshos.u.<id>.<key>.
     `theme` is global; the active session id lives under niveshos.session.  */
  var SESSION_KEY = "niveshos.session";
  var THEME_KEY = "niveshos.theme";
  var activeUserId = null;
  var state = {
    onboarded: false,
    theme: "dark",
    riskProfile: null,          // 'conservative' | 'balanced' | 'aggressive'
    riskScore: null,
    completedLessons: [],
    purchases: [],              // holding-shaped objects appended by order flow
    consents: [],
    auditTrail: [],
    assessment: null,           // AI Suitability Assessment result (see gateway)
    importedHoldings: [],       // holdings merged in from a CAS import (see CAS)
    goals: [],                  // goal-based investment plans (see Goal Planner)
    alertConfig: null,          // Smart Alerts thresholds (see alerts engine)
    alertsRead: [],             // ids of alerts marked read
    alertLog: []                // logged event alerts (NAV refresh, data update, …)
  };
  var _rendered = false;

  function uk(k) { return "niveshos.u." + activeUserId + "." + k; }
  function loadTheme() {
    try { var r = localStorage.getItem(THEME_KEY); if (r != null) state.theme = JSON.parse(r); }
    catch (e) { /* ignore */ }
  }
  function hasSavedState() {
    try { return activeUserId && localStorage.getItem(uk("onboarded")) != null; }
    catch (e) { return false; }
  }
  function loadState() {
    if (!activeUserId) return;
    try {
      Object.keys(state).forEach(function (k) {
        if (k === "theme") return;                 // theme is global, not per-user
        var raw = localStorage.getItem(uk(k));
        if (raw != null) state[k] = JSON.parse(raw);
      });
    } catch (e) { /* file:// private mode etc. — fall back to defaults */ }
  }
  function save(k) {
    try {
      if (k === "theme") { localStorage.setItem(THEME_KEY, JSON.stringify(state.theme)); return; }
      if (!activeUserId) return;
      localStorage.setItem(uk(k), JSON.stringify(state[k]));
    } catch (e) { /* ignore persistence failure */ }
  }
  function saveAll() { Object.keys(state).forEach(save); }

  /* ------------------------------------------------------ users / session */
  function userById(id) {
    return (D.users || []).filter(function (u) { return u.id === id; })[0] || null;
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function setSession(id) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(id)); } catch (e) { } }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { } }

  function setActiveUser(id) {
    activeUserId = id;
    var u = userById(id);
    if (!u) return;
    // point the live data view at this user's portfolio
    D.investor = { name: u.name, pan: u.pan, riskProfile: null };
    D.accounts = (u.accounts || []).slice();   // copy — CAS import may append a synthetic account
    D.holdings = u.holdings || [];
    D.history = u.history || [];
    // reflect identity in the sidebar chip
    var nm = $("investor-name"); if (nm) nm.textContent = u.name;
    var pan = $("investor-pan"); if (pan) pan.textContent = u.pan;
    var av = $("investor-avatar"); if (av) av.textContent = u.avatar || "";
  }

  // First sign-in for a user: seed their state from the persona so their
  // portfolio, risk profile and consent ledger are coherent immediately.
  function seedUserState(u) {
    var s = u.seed || {};
    state.completedLessons = (s.completedLessons || []).slice();
    state.riskProfile = s.riskProfile || null;
    state.riskScore = s.riskScore != null ? s.riskScore : null;
    state.purchases = [];
    state.consents = [];
    state.auditTrail = [];
    state.assessment = null;
    state.importedHoldings = [];
    state.goals = defaultSeedGoals();
    state.alertConfig = defaultAlertConfig();
    state.alertsRead = [];
    state.alertLog = [];
    if (s.onboarded) {
      state.onboarded = true;
      grantConsents(CONSENT_SCOPES.map(function (c) { return c.id; }));
      audit("onboard", "Signed in — portfolio consolidated across " + (D.accounts || []).length + " linked sources.");
    } else {
      state.onboarded = false;
    }
    saveAll();
  }

  /* ------------------------------------------------------- audit + consent */
  function audit(kind, text) {
    state.auditTrail.push({ ts: nowStamp(), kind: kind, text: text });
    save("auditTrail");
    if (isActive("trust")) renderTrust();
  }
  function nowStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return TODAY.slice(0, 4) + "-" + TODAY.slice(5) + " " +
      p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  /* ---------------------------------------------------- derived portfolio */
  function baseHoldings() { return (D.holdings || []).slice(); }
  function allHoldings() { return baseHoldings().concat(state.purchases).concat(state.importedHoldings || []); }
  function hv(h) { return (h.qty || 0) * (h.ltp || 0); }
  function marketHoldings() { return allHoldings().filter(function (h) { return h.assetClass !== "cash"; }); }
  function netWorth() { return allHoldings().reduce(function (s, h) { return s + hv(h); }, 0); }
  function idleCash() { return allHoldings().filter(function (h) { return h.assetClass === "cash"; }).reduce(function (s, h) { return s + hv(h); }, 0); }
  function marketValue() { return marketHoldings().reduce(function (s, h) { return s + hv(h); }, 0); }
  function invested() { return marketHoldings().reduce(function (s, h) { return s + (h.qty || 0) * (h.avgPrice || 0); }, 0); }
  function dayPnL() {
    var r = marketHoldings().reduce(function (s, h) { return s + hv(h) * (h.dayChangePct || 0) / 100; }, 0);
    var base = marketValue() - r;
    return { rupees: r, pct: base ? (r / base) * 100 : 0 };
  }
  function thirtyDay() {
    var hs = D.history || [];
    if (hs.length < 2) return { pct: 0, from: 0, to: netWorth() };
    var a = hs[0].v, b = hs[hs.length - 1].v;
    return { pct: (b - a) / a * 100, from: a, to: b };
  }

  var ASSET_ORDER = [
    { key: "equity", label: "Equity" },
    { key: "mf", label: "Mutual Funds" },
    { key: "reit", label: "REITs" },
    { key: "invit", label: "InvITs" },
    { key: "bond", label: "Bonds" },
    { key: "etf", label: "Gold ETF" },
    { key: "cash", label: "Cash" }
  ];
  function assetAlloc() {
    var total = netWorth();
    return ASSET_ORDER.map(function (a, i) {
      var val = allHoldings().filter(function (h) { return h.assetClass === a.key; })
        .reduce(function (s, h) { return s + hv(h); }, 0);
      return { key: a.key, label: a.label, value: val, pct: total ? val / total * 100 : 0, color: sv(i) };
    }).filter(function (a) { return a.value > 0; });
  }
  function sectorExposure() {
    // over market value (excludes cash) — this is the concentration denominator
    var mv = marketValue(), map = {};
    marketHoldings().forEach(function (h) {
      var s = h.sector || "Other";
      map[s] = (map[s] || 0) + hv(h);
    });
    return Object.keys(map).map(function (s) {
      return { sector: s, value: map[s], pct: mv ? map[s] / mv * 100 : 0 };
    }).sort(function (a, b) { return b.value - a.value; });
  }
  function financialsPct() {
    var s = sectorExposure().filter(function (x) { return x.sector === "Financials"; })[0];
    return s ? s.pct : 0;
  }
  function topIssuer() {
    // largest single issuer (by symbol) as % of market value
    var mv = marketValue(), map = {};
    marketHoldings().forEach(function (h) {
      map[h.symbol] = { name: h.name, v: (map[h.symbol] ? map[h.symbol].v : 0) + hv(h) };
    });
    var best = null;
    Object.keys(map).forEach(function (k) {
      if (!best || map[k].v > best.v) best = { name: map[k].name, v: map[k].v };
    });
    return best ? { name: best.name, pct: mv ? best.v / mv * 100 : 0 } : { name: "—", pct: 0 };
  }
  function mfOverlap() {
    var mfs = allHoldings().filter(function (h) { return h.assetClass === "mf" && h.underlying; });
    if (mfs.length < 2) return null;
    var a = mfs[0], b = mfs[1];
    var setB = {}; b.underlying.forEach(function (u) { setB[u.symbol] = u; });
    var common = a.underlying.filter(function (u) { return setB[u.symbol]; })
      .map(function (u) { return { symbol: u.symbol, name: u.name }; });
    var overlapPct = Math.round(common.length / a.underlying.length * 100);
    return { a: a, b: b, common: common, pct: overlapPct };
  }
  /* ---- portfolio health: 5 weighted factors, 100 points, all computed ---- */
  function scoreBand(x, best, worst, max) {
    if (x <= best) return max;
    if (x >= worst) return 0;
    return Math.round(max * (worst - x) / (worst - best));
  }
  function healthReport() {
    // "Diversified" is fund-level exposure spread across many sectors — not a
    // concentrated bet, so it can't be the top sector for scoring purposes.
    var topSec = sectorExposure().filter(function (s) { return s.sector !== "Diversified"; })[0]
      || { sector: null, pct: 0 };
    var ti = topIssuer();
    var ov = mfOverlap();
    var nw = netWorth(), cashPct = nw ? idleCash() / nw * 100 : 0;
    var classes = assetAlloc().filter(function (a) { return a.key !== "cash" && a.pct >= 5; }).length;
    var factors = [
      { label: "Sector balance", pts: scoreBand(topSec.pct, 25, 45, 25), max: 25, link: "analytics",
        note: topSec.sector ? "Top sector (" + topSec.sector + ") is " + topSec.pct.toFixed(1) + "% — comfort band is ≤25%."
                            : "No concentrated sector bets — exposure is via diversified funds." },
      { label: "Asset-class spread", pts: [0, 4, 10, 18, 25][Math.min(classes, 4)], max: 25, link: "invest",
        note: classes + " asset class" + (classes === 1 ? "" : "es") + " above 5% weight — 4+ earns full marks." },
      { label: "Single-issuer risk", pts: scoreBand(ti.pct, 10, 25, 20), max: 20, link: "analytics",
        note: esc(ti.name) + " alone is " + ti.pct.toFixed(1) + "% of market value." },
      { label: "Fund overlap", pts: ov ? scoreBand(ov.pct, 40, 100, 15) : 15, max: 15, link: "analytics",
        note: ov ? "Your two funds overlap ~" + ov.pct + "% — same bets twice." : "No duplicated look-through funds." },
      { label: "Idle cash", pts: scoreBand(cashPct, 5, 18, 15), max: 15, link: "copilot",
        note: fmt(idleCash()) + " (" + cashPct.toFixed(1) + "%) earning ~0%." }
    ];
    var score = factors.reduce(function (s, f) { return s + f.pts; }, 0);
    var grade = score >= 80 ? { label: "Strong", status: "good" }
      : score >= 60 ? { label: "Fair", status: "warn" }
        : { label: "Needs attention", status: "serious" };
    return { score: score, grade: grade, factors: factors };
  }
  function renderHealth() {
    var host = $("health-card"); if (!host) return;
    var h = healthReport();
    var rows = h.factors.map(function (f) {
      var ratio = f.pts / f.max;
      var col = ratio >= 0.8 ? "var(--good)" : ratio >= 0.5 ? "var(--warn)" : "var(--serious)";
      return '<div class="health-row" data-link="' + f.link + '" role="button" tabindex="0">' +
        '<div class="health-row-head"><span>' + f.label + '</span>' +
        '<b style="color:' + col + ';">' + f.pts + " / " + f.max + "</b></div>" +
        '<div class="health-track"><span style="width:' + (ratio * 100).toFixed(0) + '%;background:' + col + ';"></span></div>' +
        '<div class="health-note">' + f.note + "</div></div>";
    }).join("");
    host.innerHTML = '<div class="health-grid">' +
      '<div class="health-score">' +
        '<div class="health-score-num" style="color:var(--' + (h.grade.status === "good" ? "good" : h.grade.status === "warn" ? "warn" : "serious") + ');">' + h.score + "</div>" +
        '<div class="health-score-den">/ 100</div>' +
        '<div class="badge-' + h.grade.status + '" style="font-size:13px;font-weight:700;">' + h.grade.label + "</div>" +
        '<p class="health-caption">Five live-computed factors. Click one to see where to act.</p>' +
      "</div>" +
      '<div class="health-rows"><h3 style="margin:0 0 10px;">Portfolio health</h3>' + rows + "</div></div>";
    Array.prototype.forEach.call(host.querySelectorAll("[data-link]"), function (n) {
      n.addEventListener("click", function () { switchPanel(n.getAttribute("data-link")); });
    });
  }

  function riskiestHolding() {
    // largest single-day adverse move among market holdings
    var arr = marketHoldings().slice().sort(function (x, y) { return (x.dayChangePct || 0) - (y.dayChangePct || 0); });
    return arr[0];
  }
  function mergedHoldings() {
    // merge same symbol across accounts (dupe-merge). cash excluded from table.
    var groups = {};
    marketHoldings().forEach(function (h) {
      var g = groups[h.symbol];
      if (!g) {
        groups[h.symbol] = {
          symbol: h.symbol, name: h.name, assetClass: h.assetClass, sector: h.sector,
          qty: h.qty, ltp: h.ltp, dayChangePct: h.dayChangePct,
          value: hv(h), accounts: [h.accountId]
        };
      } else {
        g.qty += h.qty; g.value += hv(h);
        if (g.accounts.indexOf(h.accountId) < 0) g.accounts.push(h.accountId);
      }
    });
    return Object.keys(groups).map(function (k) { return groups[k]; })
      .sort(function (a, b) { return b.value - a.value; });
  }
  function accountName(id) {
    var a = (D.accounts || []).filter(function (x) { return x.id === id; })[0];
    return a ? a.broker : id;
  }

  var TYPE_LABEL = { equity: "Equity", mf: "Mutual Fund", bond: "Bond", reit: "REIT", invit: "InvIT", etf: "ETF", cash: "Cash" };

  /* ============================================================ CHARTS */
  var tooltip = null;
  function getTip() { if (!tooltip) tooltip = $("chart-tooltip"); return tooltip; }
  function showTip(html, e) {
    var t = getTip(); if (!t) return;
    t.hidden = false; t.innerHTML = html;
    t.style.position = "fixed";
    t.style.left = (e.clientX + 14) + "px";
    t.style.top = (e.clientY + 14) + "px";
    t.style.pointerEvents = "none";
    t.style.zIndex = "9999";
  }
  function hideTip() { var t = getTip(); if (t) t.hidden = true; }
  function wireTips(container) {
    if (!container) return;
    var marks = container.querySelectorAll("[data-tip]");
    Array.prototype.forEach.call(marks, function (m) {
      m.style.cursor = "pointer";
      m.addEventListener("mousemove", function (e) { showTip(m.getAttribute("data-tip"), e); });
      m.addEventListener("mouseleave", hideTip);
    });
  }

  // --- donut (asset-class allocation) + legend
  function renderDonut(container) {
    if (!container) return;
    var data = assetAlloc(), total = netWorth();
    var size = 220, cx = size / 2, cy = size / 2, r = 82, sw = 22;
    var C = 2 * Math.PI * r, gap = 2, off = 0;
    var segs = "";
    data.forEach(function (d, i) {
      var len = d.pct / 100 * C;
      var dash = Math.max(len - gap, 0.5);
      segs += '<circle class="anim-donut" data-tip="<b>' + esc(d.label) + '</b><br>' + fmt(d.value) + " &middot; " + d.pct.toFixed(1) +
        '%" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + d.color +
        '" stroke-width="' + sw + '" stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) +
        '" stroke-dashoffset="' + (-off).toFixed(2) + '"></circle>';
      off += len;
    });
    var svg = '<svg viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Asset allocation">' +
      '<g transform="rotate(-90 ' + cx + " " + cy + ')">' + segs + "</g>" +
      '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" fill="var(--ink-muted)" font-size="11">Net Worth</text>' +
      '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" fill="var(--ink)" font-size="17" font-weight="700">' + fmt(total) + "</text></svg>";
    var legend = '<ul class="chart-legend" style="list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 16px;">';
    data.forEach(function (d) {
      legend += '<li style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2);">' +
        '<span style="width:10px;height:10px;border-radius:2px;background:' + d.color + ';display:inline-block;"></span>' +
        esc(d.label) + ' <span style="color:var(--ink-muted);">' + d.pct.toFixed(1) + "%</span></li>";
    });
    legend += "</ul>";
    container.innerHTML = '<div class="donut-wrap" style="display:flex;flex-direction:column;align-items:center;">' + svg + legend + "</div>";
    wireTips(container);
  }

  // --- 30-day line chart with crosshair + tooltip
  function renderLine(container) {
    if (!container) return;
    var hs = D.history || [];
    if (!hs.length) { container.innerHTML = ""; return; }
    var W = 640, H = 220, pL = 8, pR = 8, pT = 14, pB = 22;
    var iw = W - pL - pR, ih = H - pT - pB;
    var vals = hs.map(function (d) { return d.v; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var pad = (max - min) * 0.12 || 1; min -= pad; max += pad;
    function X(i) { return pL + (i / (hs.length - 1)) * iw; }
    function Y(v) { return pT + (1 - (v - min) / (max - min)) * ih; }
    var pts = hs.map(function (d, i) { return X(i) + "," + Y(d.v).toFixed(1); });
    var linePath = "M" + pts.join(" L");
    var areaPath = "M" + X(0) + "," + (pT + ih) + " L" + pts.join(" L") + " L" + X(hs.length - 1) + "," + (pT + ih) + " Z";
    var up = vals[vals.length - 1] >= vals[0];
    var col = up ? "var(--good)" : "var(--critical)";
    var grid = "";
    for (var g = 0; g <= 3; g++) {
      var gy = pT + (g / 3) * ih;
      grid += '<line x1="' + pL + '" y1="' + gy + '" x2="' + (W - pR) + '" y2="' + gy + '" stroke="var(--grid)" stroke-width="1"></line>';
    }
    var svg = '<svg id="line-svg" viewBox="0 0 ' + W + " " + H + '" width="100%" preserveAspectRatio="none" role="img" aria-label="30-day portfolio value">' +
      grid +
      '<path d="' + areaPath + '" fill="' + col + '" opacity="0.08"></path>' +
      '<path class="anim-line" d="' + linePath + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>' +
      '<line id="line-cross" x1="0" y1="' + pT + '" x2="0" y2="' + (pT + ih) + '" stroke="var(--ink-muted)" stroke-width="1" stroke-dasharray="3 3" style="display:none;"></line>' +
      '<circle id="line-dot" r="3.5" fill="' + col + '" style="display:none;"></circle>' +
      '<rect id="line-hit" x="' + pL + '" y="' + pT + '" width="' + iw + '" height="' + ih + '" fill="transparent"></rect></svg>';
    var range = '<div class="chart-note" style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-muted);margin-top:4px;">' +
      "<span>" + esc(hs[0].t) + "</span><span>30-day &middot; " + pct(thirtyDay().pct) + "</span><span>" + esc(hs[hs.length - 1].t) + "</span></div>";
    container.innerHTML = svg + range;
    // interaction
    var hit = $("line-hit"), cross = $("line-cross"), dot = $("line-dot");
    if (hit) {
      hit.style.cursor = "crosshair";
      hit.addEventListener("mousemove", function (e) {
        var rect = hit.getBoundingClientRect();
        var rel = (e.clientX - rect.left) / rect.width;
        var idx = Math.round(rel * (hs.length - 1));
        idx = Math.max(0, Math.min(hs.length - 1, idx));
        var d = hs[idx], x = X(idx), y = Y(d.v);
        if (cross) { cross.setAttribute("x1", x); cross.setAttribute("x2", x); cross.style.display = ""; }
        if (dot) { dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.style.display = ""; }
        showTip("<b>" + esc(d.t) + "</b><br>" + fmt(d.v), e);
      });
      hit.addEventListener("mouseleave", function () {
        if (cross) cross.style.display = "none";
        if (dot) dot.style.display = "none";
        hideTip();
      });
    }
  }

  // --- horizontal sector bars
  function renderSectorBars(container) {
    if (!container) return;
    var data = sectorExposure();
    var max = data.length ? data[0].pct : 100;
    var rowH = 30, barH = 20, W = 560, labelW = 150, trackX = labelW, trackW = W - labelW - 60;
    var svg = '<svg viewBox="0 0 ' + W + " " + (data.length * rowH + 6) + '" width="100%" role="img" aria-label="Sector exposure">';
    data.forEach(function (d, i) {
      var y = i * rowH + 4;
      var w = Math.max(2, d.pct / max * trackW);
      svg += '<text x="0" y="' + (y + barH / 2 + 4) + '" fill="var(--ink-2)" font-size="12">' + esc(d.sector) + "</text>";
      svg += '<rect x="' + trackX + '" y="' + y + '" width="' + trackW + '" height="' + barH + '" rx="4" fill="var(--grid)" opacity="0.5"></rect>';
      svg += '<rect class="anim-bar" data-grow="x" data-tip="<b>' + esc(d.sector) + '</b><br>' + fmt(d.value) + " &middot; " + d.pct.toFixed(1) +
        '%" x="' + trackX + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + barH + '" rx="4" fill="' + sv(i) + '"></rect>';
      svg += '<text x="' + (trackX + w + 6) + '" y="' + (y + barH / 2 + 4) + '" fill="var(--ink)" font-size="12" font-weight="600">' + d.pct.toFixed(1) + "%</text>";
    });
    svg += "</svg>";
    container.innerHTML = svg;
    wireTips(container);
  }

  // --- risk gauge (0-100 semicircle)
  function renderGauge(container, score, label) {
    if (!container) return;
    var W = 240, H = 140, cx = W / 2, cy = 120, r = 92;
    var start = "M" + (cx - r) + "," + cy + " A" + r + "," + r + " 0 0 1 " + (cx + r) + "," + cy;
    var col = score < 34 ? "var(--good)" : score < 67 ? "var(--warn)" : "var(--serious)";
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="Risk score">' +
      '<path d="' + start + '" fill="none" stroke="var(--grid)" stroke-width="16" stroke-linecap="round"></path>' +
      '<path d="' + start + '" fill="none" stroke="' + col + '" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="' + score + ' 100"></path>' +
      '<text x="' + cx + '" y="' + (cy - 18) + '" text-anchor="middle" fill="var(--ink)" font-size="30" font-weight="700">' + Math.round(score) + "</text>" +
      '<text x="' + cx + '" y="' + (cy + 2) + '" text-anchor="middle" fill="var(--ink-muted)" font-size="11">/ 100</text></svg>' +
      '<div style="text-align:center;margin-top:2px;font-size:13px;color:var(--ink-2);">Risk appetite: <b style="color:var(--ink);">' + esc(label) + "</b></div>";
    container.innerHTML = svg;
  }

  // --- mix vs suggested stacked bars
  var SUGGESTED = {
    conservative: { Equity: 25, "Mutual Funds": 15, Bonds: 40, "Gold ETF": 10, Cash: 10 },
    balanced: { Equity: 40, "Mutual Funds": 20, Bonds: 25, "Gold ETF": 8, Cash: 7 },
    aggressive: { Equity: 60, "Mutual Funds": 20, Bonds: 12, "Gold ETF": 5, Cash: 3 }
  };
  function renderMixBars(container) {
    if (!container) return;
    var tier = state.riskProfile || "balanced";
    var yours = assetAlloc();
    var sug = SUGGESTED[tier];
    var W = 560, barH = 22;
    function stacked(items, y) {
      var x = 0, out = "";
      items.forEach(function (it) {
        var w = it.pct / 100 * W;
        if (w <= 0) return;
        var seg = Math.max(0, w - 2);
        out += '<rect class="anim-bar" data-grow="x" data-tip="<b>' + esc(it.label) + '</b><br>' + it.pct.toFixed(1) +
          '%" x="' + x.toFixed(1) + '" y="' + y + '" width="' + seg.toFixed(1) + '" height="' + barH + '" rx="3" fill="' + it.color + '"></rect>';
        if (it.pct >= 9) out += '<text x="' + (x + seg / 2).toFixed(1) + '" y="' + (y + barH / 2 + 4) + '" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">' + Math.round(it.pct) + "%</text>";
        x += w;
      });
      return out;
    }
    var yoursItems = yours;
    var sugItems = ASSET_ORDER.map(function (a, i) { return { label: a.label, pct: sug[a.label] || 0, color: sv(i) }; });
    var svg = '<svg viewBox="0 0 ' + W + ' 84" width="100%" role="img" aria-label="Your mix vs suggested">' +
      '<text x="0" y="12" fill="var(--ink-muted)" font-size="11">Your mix</text>' +
      stacked(yoursItems, 16) +
      '<text x="0" y="60" fill="var(--ink-muted)" font-size="11">Suggested (' + esc(tier) + ")</text>" +
      stacked(sugItems, 62) + "</svg>";
    var legend = '<ul class="chart-legend" style="list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px;">';
    ASSET_ORDER.forEach(function (a, i) {
      legend += '<li style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink-2);"><span style="width:9px;height:9px;border-radius:2px;background:' + sv(i) + ';display:inline-block;"></span>' + esc(a.label) + "</li>";
    });
    legend += "</ul>";
    container.innerHTML = svg + legend;
    wireTips(container);
  }

  /* ============================================================ PANELS */

  function statTile(label, rawValue, displayText, prefix, deltaText, deltaDir) {
    return '<div class="stat-tile">' +
      '<div class="label">' + esc(label) + "</div>" +
      '<div class="value countup" data-value="' + Math.round(Math.abs(rawValue)) + '" data-prefix="' + prefix + '" data-decimals="0" data-suffix="">' + displayText + "</div>" +
      '<div class="delta ' + deltaDir + '">' + esc(deltaText) + "</div></div>";
  }
  function renderKPIs() {
    var host = $("kpi-row"); if (!host) return;
    var dp = dayPnL(), td = thirtyDay(), unreal = marketValue() - invested();
    host.innerHTML =
      statTile("Net Worth", netWorth(), fmt(netWorth()), "₹", pct(td.pct) + " (30d)", cls_dir(td.pct)) +
      statTile("Day P&L", dp.rupees, fmtSigned(dp.rupees), (dp.rupees < 0 ? "−₹" : "+₹"), pct(dp.pct) + " today", cls_dir(dp.pct)) +
      statTile("Total Invested", invested(), fmt(invested()), "₹", fmtSigned(unreal) + " unrealised", cls_dir(unreal)) +
      statTile("Idle Cash", idleCash(), fmt(idleCash()), "₹", "earning ~0%", "neutral");
  }

  function renderAccountsStrip() {
    var host = $("accounts-strip"); if (!host) return;
    host.innerHTML = (D.accounts || []).map(function (a) {
      var val = marketHoldings().filter(function (h) { return h.accountId === a.id; }).reduce(function (s, h) { return s + hv(h); }, 0);
      val += allHoldings().filter(function (h) { return h.accountId === a.id && h.assetClass === "cash"; }).reduce(function (s, h) { return s + hv(h); }, 0);
      return '<div class="account-card">' +
        '<div class="acct-broker" style="font-weight:600;">' + esc(a.broker) + "</div>" +
        '<div class="acct-meta" style="font-size:11px;color:var(--ink-muted);">' + esc(a.depository) + " &middot; " + esc(a.type) + "</div>" +
        '<div class="acct-value" style="font-weight:700;font-variant-numeric:tabular-nums;margin-top:4px;">' + fmt(val) + "</div>" +
        '<div class="acct-sync" style="font-size:11px;color:var(--good);">● Synced ' + esc(a.lastSync) + "</div></div>";
    }).join("");
  }

  function renderHoldingsTable() {
    var host = $("holdings-table"); if (!host) return;
    var rows = mergedHoldings();
    var body = rows.map(function (r) {
      var acct = r.accounts.length > 1
        ? '<span title="' + esc(r.accounts.map(accountName).join(", ")) + '">' + esc(accountName(r.accounts[0])) + ' <span class="dupe-chip" style="background:var(--surface-2);border:1px solid var(--hairline);border-radius:6px;padding:0 5px;font-size:10px;">+' + (r.accounts.length - 1) + " broker</span></span>"
        : esc(accountName(r.accounts[0]));
      return "<tr>" +
        '<td><b>' + esc(r.symbol) + "</b><div style=\"font-size:11px;color:var(--ink-muted);\">" + esc(r.name) + "</div></td>" +
        "<td>" + esc(TYPE_LABEL[r.assetClass] || r.assetClass) + "</td>" +
        "<td>" + acct + "</td>" +
        '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + _inr.format(r.qty) + "</td>" +
        '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + fmt(r.value) + "</td>" +
        '<td style="text-align:right;color:' + dirColor(r.dayChangePct) + ';">' + pct(r.dayChangePct) + "</td></tr>";
    }).join("");
    host.innerHTML = '<table class="data-table holdings" style="width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;">' +
      '<thead><tr style="text-align:left;color:var(--ink-muted);font-size:11px;">' +
      "<th>Instrument</th><th>Type</th><th>Account</th><th style=\"text-align:right;\">Qty</th><th style=\"text-align:right;\">Value</th><th style=\"text-align:right;\">Day Δ</th></tr></thead>" +
      "<tbody>" + body + "</tbody></table>";
  }

  /* ==================================================== SMART ALERTS ENGINE
     Generates notifications from live portfolio analytics (condition alerts,
     recomputed each render) plus runtime events (NAV refresh, data update,
     diversification improvements — logged with a timestamp). Priority levels
     map to badge classes: serious=High, warn=Medium, info=Low. Read-state and
     the event log persist per-user in localStorage. No network, no advice —
     purely descriptive signals off the same numbers the analytics panel uses. */
  function alertIcon(p) { return '<svg class="alert-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">' + p + "</svg>"; }
  var ALERT_META = {
    concentration: { label: "Concentration", icon: alertIcon('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>') },
    drop:          { label: "Drawdown",      icon: alertIcon('<path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/>') },
    price:         { label: "Price move",    icon: alertIcon('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>') },
    dividend:      { label: "Distribution",  icon: alertIcon('<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>') },
    diversify:     { label: "Diversified",   icon: alertIcon('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>') },
    overlap:       { label: "Fund overlap",  icon: alertIcon('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>') },
    cash:          { label: "Idle cash",     icon: alertIcon('<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>') },
    consolidated:  { label: "Consolidated",  icon: alertIcon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>') },
    nav:           { label: "NAV refresh",   icon: alertIcon('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>') },
    data:          { label: "Data source",   icon: alertIcon('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>') }
  };
  var LEVEL_RANK = { serious: 0, warn: 1, info: 2 };
  var PRIORITY_LABEL = { serious: "High", warn: "Medium", info: "Low" };
  function defaultAlertConfig() { return { dropPct: 3, concentrationPct: 30, movePct: 3 }; }
  function alertCfg() {
    if (!state.alertConfig) state.alertConfig = defaultAlertConfig();
    return state.alertConfig;
  }
  function productFor(sym) {
    return (D.products || []).filter(function (p) { return p.quoteSym === sym || p.symbol === sym; })[0];
  }
  function diversifiedClassCount() {
    return assetAlloc().filter(function (a) { return a.key !== "cash" && a.pct >= 5; }).length;
  }

  /* live, deterministic-id alerts derived from current holdings */
  function computeConditionAlerts() {
    var cfg = alertCfg(), list = [];
    var fp = financialsPct(), ti = topIssuer(), ov = mfOverlap(), dp = dayPnL();
    var topSec = sectorExposure().filter(function (s) { return s.sector !== "Diversified"; })[0];

    if (topSec && topSec.pct > cfg.concentrationPct) {
      list.push({ id: "cond:concentration", type: "concentration", level: "serious", link: "analytics",
        title: topSec.sector + " concentration",
        text: "<b>" + topSec.sector + "</b> is <b>" + topSec.pct.toFixed(1) + "%</b> of market value — above your " + cfg.concentrationPct + "% band. Top issuer <b>" + esc(ti.name) + "</b> alone is " + ti.pct.toFixed(1) + "%." });
    }
    if (dp.pct < -cfg.dropPct) {
      var hard = dp.pct < -(cfg.dropPct * 1.5);
      list.push({ id: "cond:drop", type: "drop", level: hard ? "serious" : "warn", link: "copilot",
        title: "Portfolio down " + pct(dp.pct).replace("−", "−") + " today",
        text: "Net worth moved <b>" + fmtSigned(dp.rupees) + "</b> (" + pct(dp.pct) + ") — past your −" + cfg.dropPct + "% alert threshold." });
    }
    // significant single-name moves, biggest first, capped
    mergedHoldings().filter(function (r) { return Math.abs(r.dayChangePct || 0) >= cfg.movePct; })
      .sort(function (a, b) { return Math.abs(b.dayChangePct) - Math.abs(a.dayChangePct); })
      .slice(0, 3).forEach(function (r) {
        var up = r.dayChangePct > 0;
        list.push({ id: "cond:price:" + r.symbol, type: "price", level: up ? "info" : "warn", link: "dashboard",
          title: r.symbol + " " + pct(r.dayChangePct),
          text: "<b>" + esc(r.name) + "</b> moved " + pct(r.dayChangePct) + " today — a " + cfg.movePct + "%+ swing on a " + fmt(r.value) + " position." });
      });
    // distributions/dividends for held REITs/InvITs, if catalogue data exists
    marketHoldings().filter(function (h) { return h.assetClass === "reit" || h.assetClass === "invit"; })
      .sort(function (a, b) { return hv(b) - hv(a); })
      .slice(0, 2).forEach(function (h) {
        var p = productFor(h.symbol); if (!p || !p.yieldOrReturn) return;
        list.push({ id: "cond:dividend:" + h.symbol, type: "dividend", level: "info", link: "dashboard",
          title: h.symbol + " distribution",
          text: "<b>" + esc(h.name) + "</b> pays <b>" + esc(p.yieldOrReturn) + "</b> — a quarterly payout accrues on your " + _inr.format(h.qty) + " units." });
      });
    // positive: portfolio is well spread
    var classes = diversifiedClassCount();
    if (classes >= 4 || (topSec && topSec.pct < 25)) {
      list.push({ id: "cond:diversify", type: "diversify", level: "info", link: "analytics",
        title: "Well diversified",
        text: classes + " asset classes above 5% weight" + (topSec ? ", top sector just " + topSec.pct.toFixed(1) + "%" : "") + " — concentration risk is low." });
    }
    if (ov && ov.pct >= 60) {
      list.push({ id: "cond:overlap", type: "overlap", level: "warn", link: "analytics",
        title: "Fund overlap",
        text: "<b>" + esc(ov.a.name.split(" —")[0]) + "</b> &amp; <b>" + esc(ov.b.name.split(" —")[0]) + "</b> overlap ~" + ov.pct + "% (" + ov.common.length + " common holdings) — less diversified than it looks." });
    }
    if (idleCash() > 0) {
      list.push({ id: "cond:cash", type: "cash", level: "warn", link: "invest",
        title: "Idle cash",
        text: "<b>" + fmt(idleCash()) + "</b> sitting idle at ~0%. " + suitableProducts().length + " suitable options in Discover." });
    }
    var dupes = mergedHoldings().filter(function (r) { return r.accounts.length > 1; });
    if (dupes.length) {
      list.push({ id: "cond:consolidated", type: "consolidated", level: "info", link: "dashboard",
        title: "Consolidated view",
        text: dupes.map(function (d) { return d.symbol; }).join(" &amp; ") + " held across 2 brokers — merged into one holding." });
    }
    return list;
  }

  /* append a timestamped event alert (NAV refresh, data update, …) */
  function logAlert(type, level, title, text, link) {
    var m = ALERT_META[type] || {};
    state.alertLog.unshift({ id: type + ":" + Date.now(), type: type, level: level || "info",
      title: title, text: text, link: link || "dashboard", ts: nowStamp(), event: true });
    if (state.alertLog.length > 30) state.alertLog.length = 30;
    save("alertLog");
    refreshAlertsUI();
  }

  /* merged, prioritised feed: live condition alerts + logged events */
  function allAlerts() {
    var read = state.alertsRead || [];
    var list = computeConditionAlerts().concat(state.alertLog || []);
    list.forEach(function (a) {
      a.icon = a.icon || (ALERT_META[a.type] || {}).icon || "•";
      a.read = read.indexOf(a.id) >= 0;
    });
    return list.sort(function (a, b) {
      var r = (LEVEL_RANK[a.level] || 9) - (LEVEL_RANK[b.level] || 9);
      if (r) return r;
      return (b.ts || "") < (a.ts || "") ? -1 : 1; // events newest first
    });
  }
  function unreadCount() {
    return allAlerts().filter(function (a) { return !a.read; }).length;
  }
  function markAlertRead(id) {
    if ((state.alertsRead || []).indexOf(id) < 0) { state.alertsRead.push(id); save("alertsRead"); }
    refreshAlertsUI();
  }
  function markAllAlertsRead() {
    allAlerts().forEach(function (a) { if (state.alertsRead.indexOf(a.id) < 0) state.alertsRead.push(a.id); });
    save("alertsRead");
    refreshAlertsUI();
  }

  /* ---- dashboard preview card (top few, highest priority) ---- */
  function renderAlerts() {
    var host = $("alerts-feed"); if (!host) return;
    var list = allAlerts().slice(0, 5);
    host.innerHTML =
      '<div class="alerts-card-head"><h3>Smart alerts</h3>' +
      '<button class="btn-ghost alerts-open-center" type="button">Open notification centre →</button></div>' +
      (list.length ? list.map(alertRow).join("") :
        '<p class="alerts-empty">No alerts right now — your portfolio is inside every threshold.</p>');
    wireAlertRows(host);
    var open = host.querySelector(".alerts-open-center");
    if (open) open.addEventListener("click", function () { openNotifCenter(); });
  }
  function alertRow(a) {
    return '<div class="alert alert-' + a.level + (a.read ? " is-read" : "") + '" data-link="' + a.link + '" data-id="' + esc(a.id) + '">' +
      '<span class="alert-icon" aria-hidden="true">' + a.icon + "</span>" +
      '<div class="alert-body"><div class="alert-title-row">' +
        '<span class="alert-title">' + esc(a.title) + "</span>" +
        '<span class="badge-' + (a.level === "serious" ? "serious" : a.level === "warn" ? "warn" : "good") + ' prio-badge">' + PRIORITY_LABEL[a.level] + "</span></div>" +
      '<div class="alert-text">' + a.text + "</div>" +
      (a.ts ? '<div class="alert-ts">' + esc(a.ts) + "</div>" : "") +
      "</div></div>";
  }
  function wireAlertRows(host) {
    Array.prototype.forEach.call(host.querySelectorAll(".alert[data-link]"), function (n) {
      n.addEventListener("click", function () {
        var id = n.getAttribute("data-id"); if (id) markAlertRead(id);
        switchPanel(n.getAttribute("data-link"));
      });
    });
  }

  /* ---- notification centre (right-side drawer) ---- */
  var notifFilter = "all";
  function openNotifCenter() {
    var panel = $("notif-panel"); if (!panel) return;
    panel.hidden = false;
    document.body.classList.add("notif-open");
    renderNotifCenter();
  }
  function closeNotifCenter() {
    var panel = $("notif-panel"); if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("notif-open");
  }
  function renderNotifCenter() {
    var panel = $("notif-panel"); if (!panel || panel.hidden) return;
    var all = allAlerts();
    var cfg = alertCfg();
    var types = {}; all.forEach(function (a) { types[a.type] = 1; });
    var chips = [{ k: "all", l: "All" }, { k: "unread", l: "Unread · " + all.filter(function (a) { return !a.read; }).length }]
      .concat(Object.keys(types).map(function (t) { return { k: t, l: (ALERT_META[t] || {}).label || t }; }));
    var shown = all.filter(function (a) {
      return notifFilter === "all" ? true : notifFilter === "unread" ? !a.read : a.type === notifFilter;
    });
    panel.innerHTML =
      '<div class="notif-head">' +
        '<div><h2>Notifications</h2><span class="notif-sub">' + all.filter(function (a) { return !a.read; }).length + ' unread · ' + all.length + ' total</span></div>' +
        '<div class="notif-head-actions">' +
          '<button class="btn-ghost" id="notif-mark-all" type="button">Mark all read</button>' +
          '<button class="notif-close" id="notif-close" type="button" aria-label="Close">' + ic("x") + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="notif-config">' +
        '<label>Drawdown alert at −<input id="cfg-drop" type="number" min="1" max="50" step="1" value="' + cfg.dropPct + '">%</label>' +
        '<label>Sector cap <input id="cfg-conc" type="number" min="10" max="90" step="5" value="' + cfg.concentrationPct + '">%</label>' +
      "</div>" +
      '<div class="notif-filters">' + chips.map(function (c) {
        return '<button class="notif-chip' + (notifFilter === c.k ? " active" : "") + '" data-filter="' + c.k + '" type="button">' + esc(c.l) + "</button>";
      }).join("") + "</div>" +
      '<div class="notif-list">' + (shown.length ? shown.map(notifItem).join("") :
        '<p class="alerts-empty">Nothing here — try another filter.</p>') + "</div>";

    var cl = $("notif-close"); if (cl) cl.addEventListener("click", closeNotifCenter);
    var ma = $("notif-mark-all"); if (ma) ma.addEventListener("click", markAllAlertsRead);
    Array.prototype.forEach.call(panel.querySelectorAll(".notif-chip"), function (b) {
      b.addEventListener("click", function () { notifFilter = b.getAttribute("data-filter"); renderNotifCenter(); });
    });
    var cd = $("cfg-drop"); if (cd) cd.addEventListener("change", function () {
      var v = parseFloat(cd.value); if (v > 0) { alertCfg().dropPct = v; save("alertConfig"); refreshAlertsUI(); }
    });
    var cc = $("cfg-conc"); if (cc) cc.addEventListener("change", function () {
      var v = parseFloat(cc.value); if (v > 0) { alertCfg().concentrationPct = v; save("alertConfig"); refreshAlertsUI(); }
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".notif-item"), function (n) {
      var id = n.getAttribute("data-id");
      var go = n.querySelector(".notif-item-go");
      if (go) go.addEventListener("click", function (e) {
        e.stopPropagation(); markAlertRead(id); closeNotifCenter(); switchPanel(n.getAttribute("data-link"));
      });
      var rd = n.querySelector(".notif-item-read");
      if (rd) rd.addEventListener("click", function (e) { e.stopPropagation(); markAlertRead(id); });
    });
  }
  function notifItem(a) {
    var badge = a.level === "serious" ? "serious" : a.level === "warn" ? "warn" : "good";
    return '<div class="notif-item' + (a.read ? " is-read" : "") + '" data-id="' + esc(a.id) + '" data-link="' + a.link + '">' +
      '<span class="notif-item-icon alert-' + a.level + '" aria-hidden="true">' + a.icon + "</span>" +
      '<div class="notif-item-body">' +
        '<div class="alert-title-row"><span class="alert-title">' + esc(a.title) + "</span>" +
          '<span class="badge-' + badge + ' prio-badge">' + PRIORITY_LABEL[a.level] + "</span></div>" +
        '<div class="alert-text">' + a.text + "</div>" +
        '<div class="notif-item-foot">' +
          '<span class="notif-item-meta">' + esc((ALERT_META[a.type] || {}).label || a.type) + (a.ts ? " · " + esc(a.ts) : " · live") + "</span>" +
          '<span class="notif-item-actions">' +
            (a.read ? "" : '<button class="link-btn notif-item-read" type="button">Mark read</button>') +
            '<button class="link-btn notif-item-go" type="button">View →</button>' +
          "</span>" +
        "</div>" +
      "</div></div>";
  }

  /* keep bell badge + open surfaces in sync after any change */
  function refreshAlertsUI() {
    var bell = $("notif-bell");
    if (bell) {
      var n = unreadCount();
      var b = bell.querySelector(".notif-count");
      if (b) { b.textContent = n > 9 ? "9+" : String(n); b.hidden = n === 0; }
      bell.classList.toggle("has-unread", n > 0);
    }
    if (isActive("dashboard")) renderAlerts();
    renderNotifCenter();
  }

  function renderDashboard() {
    renderDataSource();
    renderCasEntry();
    renderKPIs();
    renderDonut($("alloc-donut"));
    renderLine($("value-line"));
    renderTradingView();
    renderAccountsStrip();
    renderGoalsSummary();
    renderHoldingsTable();
    renderAlerts();
  }

  /* --- live TradingView chart (external, real-time; needs internet) ----- */
  var _tvBuilt = false;
  function renderTradingView() {
    var card = $("tv-chart-card");
    if (!card || _tvBuilt) return;
    // only market-chartable holdings (equity + gold ETF), deduped by symbol
    // BSE feed: TradingView's free widget serves BSE real-time; NSE needs a
    // paid plan and pops "only available on TradingView" instead of a chart.
    var seen = {}, opts = [];
    (D.holdings || []).forEach(function (h) {
      if ((h.assetClass === "equity" || h.assetClass === "etf") && !seen[h.symbol]) {
        seen[h.symbol] = 1;
        opts.push({ sym: "BSE:" + h.symbol, name: h.name });
      }
    });
    if (!opts.length) return;
    var sel = '<select id="tv-symbol" class="tv-select" aria-label="Chart symbol">' +
      opts.map(function (o, i) {
        return '<option value="' + esc(o.sym) + '"' + (i === 0 ? " selected" : "") + '>' +
          esc(o.name) + " · " + esc(o.sym) + "</option>";
      }).join("") + "</select>";
    card.innerHTML =
      '<div class="tv-head"><div>' +
        '<h3 style="margin:0;">Live market chart</h3>' +
        '<p style="margin:2px 0 0;font-size:12px;color:var(--ink-muted);">Real-time &amp; interactive — embedded from TradingView (external, needs internet). Separate from the dated equity snapshot above.</p>' +
      "</div>" + sel + "</div>" +
      '<div id="tv-widget" class="tv-widget"></div>';
    var s = $("tv-symbol");
    if (s) s.addEventListener("change", function () { loadTVWidget(this.value); });
    _tvBuilt = true;
    loadTVWidget(opts[0].sym);
  }
  function loadTVWidget(tvSymbol) {
    var host = $("tv-widget");
    if (!host) return;
    host.innerHTML = "";
    var theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var wrap = el("div", "tradingview-widget-container");
    wrap.appendChild(el("div", "tradingview-widget-container__widget"));
    // TradingView free-widget terms require the attribution link — keep it.
    var copy = el("div", "tradingview-widget-copyright");
    copy.innerHTML = '<a href="https://www.tradingview.com/symbols/' +
      esc(tvSymbol.replace(":", "-")) + '/" rel="noopener nofollow" target="_blank">' +
      '<span class="blue-text">Track all markets on TradingView</span></a>';
    wrap.appendChild(copy);
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      hide_side_toolbar: true,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com"
    });
    wrap.appendChild(script);
    host.appendChild(wrap);
  }

  /* --- real-data provenance strip + live NAV refresh ------------------- */
  var _refreshing = false;
  function renderDataSource() {
    var body = document.querySelector("#panel-dashboard .panel-body");
    if (!body) return;
    var ds = D.dataSource;
    var strip = $("data-source-strip");
    if (!strip) {
      strip = el("div", "data-source-strip");
      strip.id = "data-source-strip";
      body.insertBefore(strip, body.firstChild);
    }
    var live = ds && ds.live;
    var asOf = ds && ds.asOf ? ds.asOf : "baked snapshot";
    strip.innerHTML =
      '<span class="ds-dot" style="color:' + (live ? "var(--good)" : "var(--ink-muted)") + ';">●</span> ' +
      '<span class="ds-label">' + (live ? "Real market data" : "Offline snapshot") + '</span>' +
      '<span class="ds-meta">Prices: NSE via Yahoo Finance · NAVs: AMFI (mfapi.in) · as of ' + esc(asOf) + '</span>' +
      '<button id="refresh-navs" class="btn-ghost ds-refresh" type="button" title="Fetch the latest mutual-fund NAVs live from AMFI">' + ic("refresh") + " Refresh NAVs</button>";
    var btn = $("refresh-navs");
    if (btn) btn.addEventListener("click", refreshLiveNavs);
  }

  function refreshLiveNavs() {
    if (_refreshing) return;
    if (typeof fetch !== "function") { toast("Live refresh needs a modern browser.", "warn"); return; }
    _refreshing = true;
    var btn = $("refresh-navs");
    if (btn) { btn.disabled = true; btn.innerHTML = ic("refresh") + " Refreshing…"; }
    // every AMFI-coded instrument we hold or list (funds + index fund)
    var codes = {};
    (D.holdings || []).forEach(function (h) { if (h.schemeCode) codes[h.schemeCode] = 1; });
    (D.products || []).forEach(function (p) { if (p.schemeCode) codes[p.schemeCode] = 1; });
    var list = Object.keys(codes);
    var pending = list.length, updated = 0, latestDate = null;
    if (!pending) { finishRefresh(btn, 0, null); return; }
    list.forEach(function (code) {
      fetch("https://api.mfapi.in/mf/" + code + "/latest")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var d = j && j.data && j.data[0];
          if (d && d.nav != null) {
            var nav = Math.round(parseFloat(d.nav) * 100) / 100;
            (D.holdings || []).forEach(function (h) { if (String(h.schemeCode) === code) h.ltp = nav; });
            (D.products || []).forEach(function (p) { if (String(p.schemeCode) === code) p.price = nav; });
            latestDate = d.date || latestDate;
            updated++;
          }
        })
        .catch(function () { /* offline / blocked — keep snapshot value */ })
        .then(function () { if (--pending === 0) finishRefresh(btn, updated, latestDate); });
    });
  }
  function finishRefresh(btn, updated, date) {
    _refreshing = false;
    if (btn) { btn.disabled = false; btn.innerHTML = ic("refresh") + " Refresh NAVs"; }
    if (updated > 0) {
      if (D.dataSource) { D.dataSource.live = true; if (date) D.dataSource.asOf = isoDate(date); }
      audit("data", "Live NAV refresh from AMFI (mfapi.in): " + updated + " scheme(s) updated.");
      logAlert("nav", "info", "NAV refresh complete", "<b>" + updated + "</b> mutual-fund scheme(s) repriced live from AMFI (mfapi.in).", "dashboard");
      logAlert("data", "info", "Data source updated", "Prices &amp; NAVs now marked live" + (date ? " as of <b>" + esc(isoDate(date)) + "</b>" : "") + ".", "dashboard");
      renderDashboard();
      if (isActive("analytics")) renderAnalytics();
      if (isActive("invest")) renderInvest();
      if (isActive("discover")) paintDiscover();
      toast("Live NAVs updated from AMFI — " + updated + " scheme(s).", "success");
    } else {
      toast("Could not reach AMFI feed — showing last snapshot.", "warn");
    }
  }
  function isoDate(dmy) {
    // mfapi returns dd-mm-yyyy → yyyy-mm-dd
    var m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy || "");
    return m ? m[3] + "-" + m[2] + "-" + m[1] : dmy;
  }

  function renderAnalytics() {
    renderHealth();
    renderSectorBars($("sector-bars"));
    // concentration card
    var cc = $("concentration-card");
    if (cc) {
      var fp = financialsPct(), ti = topIssuer();
      var statusF = fp > 30 ? "serious" : fp > 20 ? "warn" : "good";
      cc.innerHTML = '<h3 style="margin:0 0 8px;">Concentration</h3>' +
        row("Top sector — Financials", fp.toFixed(1) + "%", statusF) +
        row("Top issuer — " + esc(ti.name), ti.pct.toFixed(1) + "%", ti.pct > 15 ? "warn" : "good") +
        '<p style="font-size:12px;color:var(--ink-muted);margin:8px 0 0;">A single-sector weight above 30% or one issuer above 15% raises drawdown risk.</p>';
    }
    // overlap card
    var oc = $("overlap-card");
    if (oc) {
      var ov = mfOverlap();
      if (ov) {
        oc.innerHTML = '<h3 style="margin:0 0 8px;">MF overlap</h3>' +
          '<div style="font-size:13px;">' + esc(ov.a.name.split(" —")[0]) + " &amp; " + esc(ov.b.name.split(" —")[0]) + "</div>" +
          row("Portfolio overlap", ov.pct + "%", ov.pct >= 60 ? "warn" : "good") +
          '<div style="font-size:12px;color:var(--ink-2);margin-top:6px;">Common holdings: ' + ov.common.map(function (c) { return esc(c.name); }).join(", ") + "</div>";
      } else { oc.innerHTML = '<h3 style="margin:0 0 8px;">MF overlap</h3><p style="color:var(--ink-muted);">Fewer than two look-through funds.</p>'; }
    }
    // risk gauge
    var rc = $("risk-score-card");
    if (rc) {
      var sc = state.riskScore != null ? scoreToGauge(state.riskScore) : 50;
      var lbl = state.riskProfile ? cap(state.riskProfile) : "Not profiled";
      rc.innerHTML = '<h3 style="margin:0 0 4px;">Portfolio risk</h3><div id="gauge-inner"></div>';
      renderGauge($("gauge-inner"), sc, lbl);
      if (!state.riskProfile) rc.innerHTML += '<button class="btn-ghost" data-go="profile" style="margin-top:6px;">Take the risk quiz →</button>';
      var b = rc.querySelector("[data-go]"); if (b) b.addEventListener("click", function () { switchPanel("profile"); });
    }
    // asset mix vs suggested
    var am = $("asset-mix-card");
    if (am) { am.innerHTML = '<h3 style="margin:0 0 8px;">Your mix vs suggested</h3><div id="mix-inner"></div>'; renderMixBars($("mix-inner")); }
    renderStressTest();
  }

  /* -------------------------------------------------- portfolio stress test
     Hypothetical scenarios applied to a COPY of the live holdings — nothing in
     state.* is mutated. Each scenario is a rule mapping a holding to a shock %;
     results aggregate portfolio, asset-class and sector impact.               */
  function bankWeight(h) {
    return (h.underlying || []).filter(function (u) {
      return /\bBank\b|HDFC Bank|ICICI Bank|Axis|Kotak|SBI/i.test(u.name);
    }).reduce(function (s, u) { return s + (u.weight || 0); }, 0);
  }
  var STRESS_SCENARIOS = [
    { id: "nifty10", label: "NIFTY −10%", desc: "Broad equity market falls 10%.",
      shock: function (h) { return (h.assetClass === "equity" || h.assetClass === "mf") ? -10 : 0; } },
    { id: "nifty20", label: "NIFTY −20%", desc: "A sharp 20% market correction.",
      shock: function (h) { return (h.assetClass === "equity" || h.assetClass === "mf") ? -20 : 0; } },
    { id: "bank15", label: "Banking −15%", desc: "Financial stocks sell off 15%.",
      shock: function (h) {
        if (h.assetClass === "equity") return h.sector === "Financials" ? -15 : 0;
        if (h.assetClass === "mf" && h.underlying) return -15 * (bankWeight(h) / 100); // look-through bank weight
        return 0;
      } },
    { id: "gold10", label: "Gold +10%", desc: "Gold rallies 10%.",
      shock: function (h) { return h.sector === "Commodities" ? 10 : 0; } },
    { id: "reit8", label: "REIT −8%", desc: "REIT units fall 8%.",
      shock: function (h) { return h.assetClass === "reit" ? -8 : 0; } },
    { id: "rates1", label: "Rates +1%", desc: "A 1% rate hike pressures bonds & yield assets.",
      shock: function (h) {
        if (h.assetClass === "bond") return -3;
        if (h.assetClass === "reit" || h.assetClass === "invit") return -2.5;
        return 0;
      } }
  ];
  var stressScn = "nifty10";

  function stressResult(scn) {
    var before = 0, after = 0, byClass = {}, bySector = {};
    allHoldings().forEach(function (h) {
      var bv = hv(h), av = bv * (1 + (scn.shock(h) || 0) / 100);
      before += bv; after += av;
      var ck = h.assetClass, sk = h.sector || "Other";
      (byClass[ck] = byClass[ck] || { before: 0, after: 0 }); byClass[ck].before += bv; byClass[ck].after += av;
      (bySector[sk] = bySector[sk] || { before: 0, after: 0 }); bySector[sk].before += bv; bySector[sk].after += av;
    });
    return { before: before, after: after, delta: after - before, pct: before ? (after - before) / before * 100 : 0, byClass: byClass, bySector: bySector };
  }

  function stressDetail(x) {
    var r = x.r;
    var maxV = 0;
    ASSET_ORDER.forEach(function (a) { var c = r.byClass[a.key]; if (c) maxV = Math.max(maxV, c.before, c.after); });
    var classRows = ASSET_ORDER.filter(function (a) { return r.byClass[a.key]; }).map(function (a) {
      var c = r.byClass[a.key], d = c.after - c.before;
      var bw = maxV ? c.before / maxV * 100 : 0, aw = maxV ? c.after / maxV * 100 : 0;
      var acol = d > 0 ? "var(--good)" : d < 0 ? "var(--critical)" : "var(--ink-muted)";
      return '<div class="stress-arow"><div class="stress-arow-lbl">' + esc(TYPE_LABEL[a.key] || a.label) + "</div>" +
        '<div class="stress-bars">' +
          '<div class="stress-bar-track"><span class="anim-bar" data-grow="x" style="width:' + bw.toFixed(1) + '%;background:var(--ink-muted);"></span></div>' +
          '<div class="stress-bar-track"><span class="anim-bar" data-grow="x" style="width:' + aw.toFixed(1) + '%;background:' + acol + ';"></span></div>' +
        "</div>" +
        '<div class="stress-arow-delta" style="color:' + acol + ';">' + (d ? fmtSigned(d) : "—") + "</div></div>";
    }).join("");
    var secs = Object.keys(r.bySector).map(function (s) { var o = r.bySector[s]; return { sector: s, before: o.before, delta: o.after - o.before }; })
      .filter(function (s) { return Math.abs(s.delta) >= 1; })
      .sort(function (a, b) { return a.delta - b.delta; });
    var secRows = secs.length ? secs.map(function (s) {
      var col = dirColor(s.delta), p = s.before ? s.delta / s.before * 100 : 0;
      return '<div class="stress-srow"><span>' + esc(s.sector) + "</span><b style=\"color:" + col + ";\">" + fmtSigned(s.delta) + ' <span class="stress-srow-pct">' + pct(p) + "</span></b></div>";
    }).join("") : '<p style="color:var(--ink-muted);font-size:12.5px;">This scenario doesn’t move any of your sectors.</p>';
    return '<div class="stress-detail"><div class="stress-headline">' +
      '<div><span class="stress-hl-lbl">' + esc(x.scn.desc) + "</span>" +
        '<div class="stress-hl-nums"><span class="stress-before">' + fmt(r.before) + "</span>" +
        '<span class="stress-arrow">→</span>' +
        '<span class="stress-after" style="color:' + dirColor(r.delta) + ';">' + fmt(r.after) + "</span></div></div>" +
      '<div class="stress-hl-delta" style="color:' + dirColor(r.delta) + ';">' + fmtSigned(r.delta) + "<span>" + pct(r.pct) + "</span></div></div>" +
      '<div class="stress-cols"><div class="stress-col"><div class="stress-col-h">Before vs after · by asset class</div>' +
        '<div class="stress-legend"><span><i style="background:var(--ink-muted);"></i>Before</span><span><i style="background:var(--accent);"></i>After</span></div>' +
        classRows + "</div>" +
        '<div class="stress-col"><div class="stress-col-h">Sector impact</div>' + secRows + "</div></div></div>";
  }

  function renderStressTest() {
    var host = $("stress-test"); if (!host) return;
    var results = STRESS_SCENARIOS.map(function (scn) { return { scn: scn, r: stressResult(scn) }; });
    var cards = results.map(function (x) {
      var active = x.scn.id === stressScn ? " active" : "";
      return '<button class="stress-card' + active + '" type="button" data-scn="' + x.scn.id + '">' +
        '<div class="stress-card-label">' + esc(x.scn.label) + "</div>" +
        '<div class="stress-card-after">' + fmt(x.r.after) + "</div>" +
        '<div class="stress-card-delta" style="color:' + dirColor(x.r.delta) + ';">' + fmtSigned(x.r.delta) + " · " + pct(x.r.pct) + "</div></button>";
    }).join("");
    var sel = results.filter(function (x) { return x.scn.id === stressScn; })[0] || results[0];
    host.innerHTML = '<div class="stress-headwrap"><h3 style="margin:0;">Portfolio stress test</h3>' +
      '<p class="stress-sub">Hypothetical shocks applied to your live holdings — your real portfolio is never changed.</p></div>' +
      '<div class="stress-grid">' + cards + "</div>" + stressDetail(sel) +
      '<p class="stress-disclaimer">' + ic("warning") + ' Hypothetical simulations for education only — not a forecast, not investment advice. Real outcomes depend on many factors beyond a single shock.</p>';
    Array.prototype.forEach.call(host.querySelectorAll(".stress-card"), function (b) {
      b.addEventListener("click", function () { stressScn = b.getAttribute("data-scn"); renderStressTest(); });
    });
  }
  function row(label, value, status) {
    return '<div class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--hairline);">' +
      '<span style="font-size:13px;color:var(--ink-2);">' + label + "</span>" +
      '<b class="badge-' + status + '" style="font-variant-numeric:tabular-nums;">' + value + "</b></div>";
  }
  function scoreToGauge(raw) {
    // riskQuiz raw score range 6..24 → 0..100
    var min = 6, max = 24;
    return Math.round((raw - min) / (max - min) * 100);
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* -------------------------------------------------------------- learn */
  function renderLearnProgress() {
    var host = $("learn-progress"); if (!host) return;
    var lessons = D.lessons || [];
    var done = lessons.filter(function (l) { return state.completedLessons.indexOf(l.id) >= 0; });
    var next = lessons.filter(function (l) { return state.completedLessons.indexOf(l.id) < 0; })[0];
    var unlocked = (D.products || []).filter(function (p) {
      return p.registered && p.requiredLesson && state.completedLessons.indexOf(p.requiredLesson) >= 0;
    }).length;
    var pctDone = lessons.length ? done.length / lessons.length * 100 : 0;
    host.innerHTML =
      '<div class="learn-progress-head"><div><h3 style="margin:0;">Your learning path</h3>' +
      '<p style="margin:2px 0 0;font-size:12.5px;color:var(--ink-muted);">Each completed lesson unlocks its product category in Invest.</p></div>' +
      '<b style="font-variant-numeric:tabular-nums;">' + done.length + " / " + lessons.length + "</b></div>" +
      '<div class="health-track" style="margin:10px 0 8px;"><span style="width:' + pctDone.toFixed(0) + '%;background:var(--accent);"></span></div>' +
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:12.5px;color:var(--ink-2);">' +
      "<span>" + unlocked + " product" + (unlocked === 1 ? "" : "s") + " unlocked so far</span>" +
      (next ? '<a href="#" data-lesson-link="' + next.id + '" style="color:var(--accent);">Next: ' + esc(next.title) + " (" + next.minutes + " min) →</a>"
            : '<span style="color:var(--good);">' + ic("check") + ' All lessons complete</span>') + "</div>";
  }
  function renderGlossary() {
    var host = $("glossary-card"); if (!host) return;
    var terms = D.glossary || [];
    if (!terms.length) { host.innerHTML = ""; return; }
    host.innerHTML = '<h3 style="margin:0 0 4px;">Jargon buster</h3>' +
      '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink-muted);">' + terms.length + ' terms, in plain language. The copilot answers these too — try “what is NAV?”.</p>' +
      '<input id="glossary-search" class="chat-input" type="search" placeholder="Search a term — NAV, NCD, drawdown…" aria-label="Search glossary" style="width:100%;margin-bottom:10px;">' +
      '<div id="glossary-list"></div>';
    var list = $("glossary-list"), input = $("glossary-search");
    function paint(filter) {
      var f = (filter || "").toLowerCase();
      var hits = terms.filter(function (t) {
        return !f || t.term.toLowerCase().indexOf(f) >= 0 || t.def.toLowerCase().indexOf(f) >= 0;
      });
      list.innerHTML = hits.length ? hits.map(function (t) {
        return '<div class="glossary-row"><b>' + esc(t.term) + "</b><p>" + esc(t.def) + "</p></div>";
      }).join("") : '<p style="color:var(--ink-muted);font-size:13px;">No match — ask the copilot instead.</p>';
    }
    paint("");
    if (input) input.addEventListener("input", function () { paint(input.value); });
  }
  function renderLearn() {
    renderLearnProgress();
    renderGlossary();
    var host = $("lesson-grid"); if (!host) return;
    host.innerHTML = (D.lessons || []).map(function (l) {
      var done = state.completedLessons.indexOf(l.id) >= 0;
      return '<button class="lesson-card" data-lesson-id="' + l.id + '" style="text-align:left;cursor:pointer;">' +
        '<div style="font-size:26px;">' + ic(l.icon) + "</div>" +
        '<div style="font-weight:600;margin-top:4px;">' + esc(l.title) + "</div>" +
        '<div style="font-size:11px;color:var(--ink-muted);">' + l.minutes + " min &middot; " + l.quiz.length + " questions</div>" +
        '<div class="lesson-status" style="margin-top:6px;font-size:12px;color:' + (done ? "var(--good)" : "var(--ink-muted)") + ';">' + (done ? ic("check") + " Completed" : "Not started") + "</div></button>";
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-lesson-id]"), function (n) {
      n.addEventListener("click", function () { openLesson(n.getAttribute("data-lesson-id")); });
    });
  }

  function openLesson(id) {
    var l = (D.lessons || []).filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var secHtml = l.sections.map(function (s) {
      return '<div style="margin-bottom:12px;"><h4 style="margin:0 0 4px;">' + esc(s.h) + "</h4><p style=\"margin:0;color:var(--ink-2);font-size:13px;line-height:1.5;\">" + esc(s.p) + "</p></div>";
    }).join("");
    var quizHtml = l.quiz.map(function (q, qi) {
      var opts = q.options.map(function (o, oi) {
        return '<label style="display:block;padding:6px 8px;border:1px solid var(--hairline);border-radius:6px;margin:4px 0;cursor:pointer;font-size:13px;">' +
          '<input type="radio" name="q' + qi + '" value="' + oi + '" style="margin-right:8px;">' + esc(o) + "</label>";
      }).join("");
      return '<div class="quiz-q" data-answer="' + q.answer + '" style="margin-bottom:10px;"><div style="font-weight:600;font-size:13px;margin-bottom:2px;">' + (qi + 1) + ". " + esc(q.q) + "</div>" + opts + "</div>";
    }).join("");
    var body = '<div class="lesson-modal"><div style="font-size:28px;">' + ic(l.icon) + '</div><h2 style="margin:2px 0 10px;">' + esc(l.title) + "</h2>" +
      secHtml +
      '<hr style="border:none;border-top:1px solid var(--hairline);margin:12px 0;">' +
      '<h3 style="margin:0 0 8px;">Quick check (' + l.quiz.length + " questions)</h3>" + quizHtml +
      '<div id="quiz-result" style="font-size:13px;margin:8px 0;"></div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;"><button id="quiz-submit" class="btn-primary">Submit quiz</button><button id="quiz-close" class="btn-ghost">Close</button></div></div>';
    openModal(body);
    var sb = $("quiz-submit"), cb = $("quiz-close");
    if (cb) cb.addEventListener("click", closeModal);
    if (sb) sb.addEventListener("click", function () { gradeLesson(l); });
  }

  function gradeLesson(l) {
    var qs = document.querySelectorAll("#modal-root .quiz-q");
    var correct = 0, answered = 0;
    Array.prototype.forEach.call(qs, function (q) {
      var picked = q.querySelector("input:checked");
      if (picked) { answered++; if (parseInt(picked.value, 10) === parseInt(q.getAttribute("data-answer"), 10)) correct++; }
    });
    var res = $("quiz-result");
    if (answered < l.quiz.length) { if (res) res.innerHTML = '<span style="color:var(--warn);">Please answer all ' + l.quiz.length + " questions.</span>"; return; }
    var passed = correct >= 2;
    if (res) res.innerHTML = passed
      ? '<span style="color:var(--good);">' + ic("check") + " " + correct + "/" + l.quiz.length + " correct — lesson complete!</span>"
      : '<span style="color:var(--critical);">' + correct + "/" + l.quiz.length + " correct — review and try again (need 2).</span>";
    if (passed && state.completedLessons.indexOf(l.id) < 0) {
      state.completedLessons.push(l.id); save("completedLessons");
      audit("lesson", "Completed lesson “" + l.title + "” (" + correct + "/" + l.quiz.length + ") — unlocked related products.");
      window.dispatchEvent(new CustomEvent("niveshos:lesson-complete", { detail: { lesson: l.id } }));
      toast("Lesson complete: " + l.title + " — products unlocked");
      renderLearn(); if (isActive("invest")) renderInvest();
      var sb = $("quiz-submit"); if (sb) { sb.textContent = "Done"; sb.onclick = closeModal; }
    }
  }

  /* -------------------------------------------------------------- profile */
  var quizPos = 0, quizAnswers = [];
  function renderProfile() {
    var host = $("risk-quiz");
    if (state.riskProfile) {
      // returning user: show completed state + result (with retake button)
      if (host) host.innerHTML = '<div style="font-size:13px;color:var(--ink-2);">' + ic("check") + ' You\'ve completed the risk quiz. Your result is on the right — retake anytime.</div>';
      renderRiskResult();
    } else {
      quizPos = 0; quizAnswers = [];
      renderQuizStep();
      var rr = $("risk-result"); if (rr) rr.innerHTML = '<div style="color:var(--ink-muted);font-size:13px;">Answer the questions to see your profile.</div>';
    }
  }
  function renderQuizStep() {
    var host = $("risk-quiz"); if (!host) return;
    var qz = D.riskQuiz || [];
    if (quizPos >= qz.length) { host.innerHTML = '<div style="font-size:13px;color:var(--good);">' + ic("check") + ' Quiz complete — see your profile.</div>'; computeRisk(); return; }
    var q = qz[quizPos];
    var progress = Math.round(quizPos / qz.length * 100);
    host.innerHTML = '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progress + '%;"></div></div>' +
      '<div style="font-size:12px;color:var(--ink-muted);margin-top:8px;">Question ' + (quizPos + 1) + " of " + qz.length + "</div>" +
      '<h3 style="margin:4px 0 12px;">' + esc(q.q) + "</h3>" +
      q.options.map(function (o) {
        return '<button class="quiz-option" data-w="' + o.w + '">' + esc(o.t) + "</button>";
      }).join("");
    Array.prototype.forEach.call(host.querySelectorAll(".quiz-option"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(host.querySelectorAll(".quiz-option"), function (x) { x.classList.remove("selected"); });
        b.classList.add("selected");
        quizAnswers.push(parseInt(b.getAttribute("data-w"), 10));
        setTimeout(function () { quizPos++; renderQuizStep(); }, 140);
      });
    });
  }
  function computeRisk() {
    var raw = quizAnswers.reduce(function (a, b) { return a + b; }, 0);
    var tier = raw <= 10 ? "conservative" : raw <= 17 ? "balanced" : "aggressive";
    state.riskScore = raw; state.riskProfile = tier; save("riskScore"); save("riskProfile");
    if (D.investor) D.investor.riskProfile = tier;
    audit("risk", "Risk profile assessed: " + cap(tier) + " (score " + raw + ").");
    renderRiskResult();
    if (isActive("invest")) renderInvest();
    if (isActive("analytics")) renderAnalytics();
  }
  function renderRiskResult() {
    var rr = $("risk-result"); if (!rr) return;
    var tier = state.riskProfile, raw = state.riskScore;
    var unlocks = { conservative: "T-Bills, SGB, AAA bonds, index funds", balanced: "+ REITs, InvITs, higher-yield bonds", aggressive: "the full multi-asset catalogue" };
    rr.innerHTML = '<div class="risk-result-card"><div style="font-size:12px;color:var(--ink-muted);">Your profile</div>' +
      '<div style="font-size:1.8rem;font-weight:700;">' + cap(tier) + "</div>" +
      '<div style="font-size:13px;color:var(--ink-2);">Score ' + raw + " — unlocks " + unlocks[tier] + ".</div>" +
      '<div id="mix-result" style="margin-top:10px;"></div>' +
      '<button id="retake-quiz" class="btn-ghost" style="margin-top:8px;">Retake quiz</button></div>';
    renderMixBars($("mix-result"));
    var rb = $("retake-quiz"); if (rb) rb.addEventListener("click", function () { quizPos = 0; quizAnswers = []; renderQuizStep(); });
  }

  /* -------------------------------------------------------------- invest */
  var TIER_RANK = { conservative: 1, balanced: 2, aggressive: 3 };
  function suitability(p) {
    if (!p.registered) return { ok: false, gate: "registry", reason: "Not SEBI-registered — blocked for your protection.", link: "trust" };
    if (!state.riskProfile) return { ok: false, gate: "profile", reason: "Complete your risk profile first.", link: "profile" };
    if (TIER_RANK[state.riskProfile] < TIER_RANK[p.minTier]) return { ok: false, gate: "tier", reason: "Needs a " + cap(p.minTier) + " profile (you are " + cap(state.riskProfile) + ").", link: "profile" };
    if (p.requiredLesson && state.completedLessons.indexOf(p.requiredLesson) < 0) {
      var ln = (D.lessons || []).filter(function (x) { return x.id === p.requiredLesson; })[0];
      return { ok: false, gate: "lesson", reason: "Finish the “" + (ln ? ln.title : p.requiredLesson) + "” lesson to unlock.", link: "learn" };
    }
    return { ok: true, gate: null, reason: "Suitable for your profile.", link: null };
  }
  function suitableProducts() {
    return (D.products || []).filter(function (p) { return suitability(p).ok; });
  }

  function gradeBadge(g) {
    return '<span class="risk-grade-badge grade-' + String(g).toLowerCase() + '">' + esc(g) + "</span>";
  }
  function nutriRow(label, valHtml) {
    return '<div class="nutrition-row"><span>' + esc(label) + "</span>" + valHtml + "</div>";
  }
  function nutritionLabel(p) {
    return '<div class="nutrition-label">' +
      nutriRow("Risk grade", gradeBadge(p.riskGrade)) +
      nutriRow("Liquidity", "<b>" + esc(p.liquidity) + "</b>") +
      nutriRow("Complexity", "<b>" + ("●".repeat(p.complexity) + "○".repeat(3 - p.complexity)) + "</b>") +
      nutriRow("Min invest", "<b>" + fmt(p.minInvest) + "</b>") +
      nutriRow("Yield / return", "<b>" + esc(p.yieldOrReturn) + "</b>") +
      nutriRow("Issuer rating", "<b>" + esc(p.issuerRating) + "</b>") + "</div>";
  }
  function renderSuitabilityBanner() {
    var host = $("suitability-banner"); if (!host) return;
    if (state.riskProfile) {
      host.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
        "<span>Profile: <b>" + cap(state.riskProfile) + "</b> — " + suitableProducts().length + " of " + (D.products || []).length + " products suitable.</span>" +
        '<button id="sb-retake" class="btn-ghost">Retake quiz</button></div>';
      var b = $("sb-retake"); if (b) b.addEventListener("click", function () { switchPanel("profile"); });
    } else {
      host.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
        "<span>No risk profile yet — take the 6-question quiz to see what's suitable.</span>" +
        '<button id="sb-take" class="btn-primary">Take risk quiz →</button></div>';
      var t = $("sb-take"); if (t) t.addEventListener("click", function () { switchPanel("profile"); });
    }
  }
  function renderInvest() {
    renderSuitabilityBanner();
    var host = $("product-grid"); if (!host) return;
    host.innerHTML = (D.products || []).map(function (p) {
      var s = suitability(p);
      var chip = '<span class="cat-chip" style="background:var(--surface-2);border:1px solid var(--hairline);border-radius:6px;padding:1px 7px;font-size:11px;">' + esc(p.category) + "</span>";
      var badge = p.registered
        ? '<span class="sebi-badge" style="color:var(--good);font-size:11px;">' + ic("check") + ' SEBI-registered</span>'
        : '<span class="blocked-banner" style="color:var(--critical);font-weight:700;font-size:11px;">' + ic("ban") + ' BLOCKED — UNREGISTERED</span>';
      var gate = s.ok
        ? '<div class="suit-ok" style="color:var(--good);font-size:12px;margin-top:6px;">' + ic("check") + " " + esc(s.reason) + "</div>"
        : '<div class="suit-blocked" style="color:var(--serious);font-size:12px;margin-top:6px;">' + ic("lock") + " " + esc(s.reason) + "</div>";
      return '<div class="product-card" data-product="' + p.id + '" style="cursor:pointer;">' +
        '<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;"><div style="font-weight:600;">' + esc(p.name) + "</div>" + gradeBadge(p.riskGrade) + "</div>" +
        '<div style="margin:4px 0;">' + chip + " " + badge + "</div>" +
        '<div style="font-size:12px;color:var(--ink-2);">' + esc(p.yieldOrReturn) + " &middot; Min " + fmt(p.minInvest) + "</div>" +
        gate + "</div>";
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-product]"), function (n) {
      n.addEventListener("click", function () { openProduct(n.getAttribute("data-product")); });
    });
  }

  function openProduct(idOrProduct) {
    // Accepts a catalogue id (Invest panel) OR a ready product-shaped object
    // (Discover synthesises these for stocks/MFs/gold that aren't in the
    // catalogue) so the whole details + suitability + order flow is reused.
    var p = (idOrProduct && typeof idOrProduct === "object")
      ? idOrProduct
      : (D.products || []).filter(function (x) { return x.id === idOrProduct; })[0];
    if (!p) return;
    var s = suitability(p);   // kept for the audit line below
    // Regulatory gates first: an unregistered product is hard-blocked; a product
    // that needs a lesson is gated until it's done. Financial suitability (tier /
    // risk) is now handled by the AI Suitability Assessment, not a hard block.
    var lessonOk = !p.requiredLesson || state.completedLessons.indexOf(p.requiredLesson) >= 0;
    var lessonName = "";
    if (p.requiredLesson) {
      var ln = (D.lessons || []).filter(function (x) { return x.id === p.requiredLesson; })[0];
      lessonName = ln ? ln.title : p.requiredLesson;
    }
    var action, gateLink = null;
    if (!p.registered) {
      action = '<div class="blocked-box" style="margin-top:12px;border:1px solid var(--hairline);border-radius:8px;padding:10px;">' +
        '<div style="color:var(--serious);font-weight:600;">' + ic("lock") + ' Not SEBI-registered — blocked for your protection.</div></div>';
    } else if (!lessonOk) {
      gateLink = "learn";
      action = '<div class="blocked-box" style="margin-top:12px;border:1px solid var(--hairline);border-radius:8px;padding:10px;">' +
        '<div style="color:var(--serious);font-weight:600;">' + ic("lock") + ' Finish the “' + esc(lessonName) + '” lesson to unlock.</div>' +
        '<button id="invest-fix" class="btn-primary" style="margin-top:8px;">Go to lesson →</button></div>';
    } else {
      action = '<button id="invest-continue" class="btn-primary" style="width:100%;margin-top:12px;">Assess suitability &amp; invest →</button>';
    }
    var body = '<div class="product-modal">' + gatewaySteps("details") +
      '<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">' +
      '<h2 style="margin:0;">' + esc(p.name) + "</h2>" + gradeBadge(p.riskGrade) + "</div>" +
      '<div style="margin:6px 0;color:var(--ink-muted);font-size:12px;">' + esc(p.category) + "</div>" +
      '<p style="font-size:13px;color:var(--ink-2);line-height:1.5;">' + esc(p.blurb) + "</p>" +
      nutritionLabel(p) + action +
      '<button id="prod-close" class="btn-ghost" style="margin-top:10px;">Close</button></div>';
    openModal(body);
    audit("suitability", "Suitability check on “" + p.name + "” — " + (s.ok ? "PASS" : "BLOCKED (" + s.gate + ")") + ".");
    if (!p.registered) audit("warning", "Unregistered-scheme warning shown for “" + p.name + "”.");
    var cl = $("prod-close"); if (cl) cl.addEventListener("click", closeModal);
    var go = $("invest-continue"); if (go) go.addEventListener("click", function () { openSuitabilityAssessment(p); });
    var fx = $("invest-fix"); if (fx) fx.addEventListener("click", function () { closeModal(); if (gateLink) switchPanel(gateLink); });
  }

  /* ======================================================= INVESTMENT GATEWAY
     Broker-redirect flow (NO order execution — NiveshOS hands off to a
     SEBI-registered broker). Steps, all reusing the single modal root:
       Product Details → Investment Summary → Broker Selection → Redirect.
     Architecture stays API-ready: brokerDeepLink() returns the handoff URL a
     real integration would open; the demo shows it but never navigates.       */
  var ASSET_LABEL = { equity: "Stocks", etf: "ETFs", mf: "Mutual Funds", bond: "Bonds", reit: "REITs", invit: "InvITs" };
  var GATEWAY_STEPS = [
    { key: "details", label: "Details" },
    { key: "assess", label: "Assess" },
    { key: "summary", label: "Summary" },
    { key: "broker", label: "Broker" },
    { key: "redirect", label: "Redirect" }
  ];
  function gatewaySteps(active) {
    var reached = true;
    var items = GATEWAY_STEPS.map(function (s) {
      var isActiveStep = s.key === active;
      var cls = isActiveStep ? "gw-step active" : (reached ? "gw-step done" : "gw-step");
      if (isActiveStep) reached = false;
      return '<span class="' + cls + '">' + esc(s.label) + "</span>";
    }).join('<span class="gw-step-sep">›</span>');
    return '<div class="gw-steps">' + items + "</div>";
  }
  function unitLabel(p) { return p.assetClass === "mf" ? "Units" : "Quantity"; }
  function defaultQty(p) {
    var price = p.price || 0;
    return price > 0 ? Math.max(1, Math.ceil((p.minInvest || 0) / price)) : 1;
  }

  /* ---- AI Suitability Assessment (deterministic scoring engine) ----------
     Reads D.suitabilityAssessment generically, so adding a question there needs
     no engine change. Produces an investor profile, a suggested allocation, and
     a per-instrument verdict (Suitable / Moderately Suitable / High Risk) with
     reasoning. Advisory only — it never recommends buying or selling.          */
  var ALLOC = {
    Conservative: { Equity: 20, Debt: 55, Gold: 10, Cash: 15 },
    Moderate: { Equity: 45, Debt: 35, Gold: 12, Cash: 8 },
    Aggressive: { Equity: 65, Debt: 22, Gold: 8, Cash: 5 }
  };
  var RISK_ORDER = { "Low": 1, "Medium": 2, "High": 3, "Very High": 4 };
  var PROFILE_MAX = { Conservative: 1, Moderate: 2, Aggressive: 3 };
  function round1(n) { return Math.round(n * 10) / 10; }
  function productRiskLevel(p) { return riskOf(p.riskGrade, p.assetClass); }

  function computeAssessment(answers) {
    var qs = D.suitabilityAssessment || [];
    var cap = [], tol = [];
    qs.forEach(function (q) {
      var v = answers[q.id];
      if (v == null) return;
      (q.field === "tolerance" ? tol : cap).push(v);
    });
    function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 2.5; }
    var capacity = avg(cap), tolerance = avg(tol);
    var overall = 0.6 * capacity + 0.4 * tolerance;   // ability weighted over willingness
    // hard prudence ceilings: no emergency fund or a <2y horizon caps at Conservative
    var capped = (answers.emergency === 1 || answers.horizon === 1);
    if (capped) overall = Math.min(overall, 1.9);
    var profile = overall < 2.0 ? "Conservative" : overall < 3.0 ? "Moderate" : "Aggressive";
    return {
      answers: answers, capacity: round1(capacity), tolerance: round1(tolerance),
      overall: round1(overall), profile: profile, capped: capped,
      allocation: ALLOC[profile], ts: nowStamp()
    };
  }

  function assessSuitability(p, a) {
    var lvl = productRiskLevel(p);                    // "Low" | "Medium" | "High" | "Very High"
    var gap = (RISK_ORDER[lvl] || 2) - PROFILE_MAX[a.profile];
    var status = gap <= 0 ? "Suitable" : gap === 1 ? "Moderately Suitable" : "High Risk";
    var ans = a.answers || {};
    var driver = null;
    // prudence overrides
    if (ans.emergency === 1 && (RISK_ORDER[lvl] || 0) >= 3) { status = "High Risk"; driver = "you have no emergency fund yet"; }
    if (ans.horizon === 1 && (RISK_ORDER[lvl] || 0) >= 3 && status === "Suitable") { status = "Moderately Suitable"; driver = "your horizon is under 2 years"; }
    if (!driver) {
      if (ans.horizon === 1) driver = "a short (<2 year) horizon";
      else if (ans.emergency === 1) driver = "a thin emergency buffer";
      else if (ans.goal === 1) driver = "your capital-protection goal";
      else driver = "your overall financial profile";
    }
    var tone = status === "Suitable" ? "good" : status === "Moderately Suitable" ? "warn" : "serious";
    var cat = esc(p.category), lvlTxt = lvl.toLowerCase();
    var reason;
    if (status === "Suitable")
      reason = "Your " + a.profile + " profile comfortably covers this " + lvlTxt + "-risk " + cat +
        ". Given " + driver + ", it sits within the risk you can absorb.";
    else if (status === "Moderately Suitable")
      reason = "This " + lvlTxt + "-risk " + cat + " sits a step above your " + a.profile +
        " profile. It can fit a small, deliberate allocation, but weigh it against " + driver + ".";
    else
      reason = "This " + lvlTxt + "-risk " + cat + " exceeds what your " + a.profile +
        " profile supports — " + driver + " widens the gap. This is an educational suitability signal, not advice.";
    return { status: status, tone: tone, reason: reason, level: lvl };
  }

  function statusPill(status, tone) {
    return '<span class="badge badge-' + tone + ' gw-status-pill">' + esc(status) + "</span>";
  }

  // Entry point from Product Details. Shows the questionnaire, or jumps straight
  // to the result if this session already has a completed assessment.
  function openSuitabilityAssessment(p) {
    if (state.assessment) { showAssessmentResult(p); return; }
    renderAssessmentForm(p, {});
  }

  function renderAssessmentForm(p, prefill) {
    var qs = D.suitabilityAssessment || [];
    var groups = qs.map(function (q, qi) {
      var opts = q.options.map(function (o, oi) {
        var checked = prefill[q.id] === o.v ? " checked" : "";
        return '<label class="assess-opt"><input type="radio" name="aq_' + esc(q.id) + '" value="' + o.v + '"' + checked + ">" +
          "<span>" + esc(o.t) + "</span></label>";
      }).join("");
      return '<div class="assess-q" data-qid="' + esc(q.id) + '">' +
        '<div class="assess-q-label">' + (qi + 1) + ". " + esc(q.label) + "</div>" +
        '<div class="assess-opts">' + opts + "</div></div>";
    }).join("");
    var body = '<div class="gateway"><h2 style="margin:0;">Suitability assessment</h2>' + gatewaySteps("assess") +
      '<p class="gw-note">A quick read on whether <b>' + esc(p.name) + "</b> fits your finances. Answer all " + qs.length +
      " — we compute your investor profile and a suitability signal. Educational only, not investment advice.</p>" +
      '<div class="assess-form">' + groups + "</div>" +
      '<p id="assess-err" class="assess-err" hidden>Please answer every question to continue.</p>' +
      '<div class="gw-actions"><button id="assess-back" class="btn btn-ghost">← Back</button>' +
      '<button id="assess-submit" class="btn btn-primary">See my result →</button></div></div>';
    openModal(body);
    var bk = $("assess-back"); if (bk) bk.addEventListener("click", function () { openProduct(p); });
    var sb = $("assess-submit"); if (sb) sb.addEventListener("click", function () { submitAssessment(p); });
  }

  function submitAssessment(p) {
    var qs = D.suitabilityAssessment || [];
    var answers = {}, missing = false;
    qs.forEach(function (q) {
      var picked = document.querySelector('input[name="aq_' + q.id + '"]:checked');
      if (picked) answers[q.id] = parseInt(picked.value, 10); else missing = true;
    });
    if (missing) { var e = $("assess-err"); if (e) e.hidden = false; return; }
    state.assessment = computeAssessment(answers); save("assessment");
    audit("assessment", "AI suitability assessment completed — investor profile: " + state.assessment.profile + ".");
    showAssessmentResult(p);
  }

  function showAssessmentResult(p) {
    var a = state.assessment;
    if (!a) { renderAssessmentForm(p, {}); return; }
    var v = assessSuitability(p, a);
    var allocRows = Object.keys(a.allocation).map(function (k, i) {
      var wpct = a.allocation[k];
      return '<div class="alloc-row"><span class="alloc-lbl">' + esc(k) + "</span>" +
        '<span class="alloc-track"><span style="width:' + wpct + "%;background:" + sv(i) + ';"></span></span>' +
        '<span class="alloc-pct">' + wpct + "%</span></div>";
    }).join("");
    var ack = v.status === "High Risk"
      ? '<label class="assess-ack"><input type="checkbox" id="assess-ack-cb"> I understand this may not suit my profile and want to proceed anyway.</label>'
      : "";
    var body = '<div class="gateway"><div class="gw-modal-head"><h2 style="margin:0;">Your suitability result</h2>' +
      statusPill(v.status, v.tone) + "</div>" + gatewaySteps("assess") +
      '<div class="assess-profile">' +
        '<div class="assess-profile-badge">' + esc(a.profile) + '</div>' +
        '<div class="assess-profile-meta">Investor profile' + (a.capped ? ' <span class="assess-capped">· capped for prudence</span>' : "") +
          '<div class="assess-scores">Capacity ' + a.capacity + "/4 · Tolerance " + a.tolerance + "/4</div></div>" +
      "</div>" +
      '<div class="assess-section-h">Suggested asset allocation</div>' +
      '<div class="alloc-block">' + allocRows + "</div>" +
      '<div class="assess-section-h">Suitability for ' + esc(p.name) + "</div>" +
      '<div class="assess-verdict assess-verdict-' + v.tone + '">' + statusPill(v.status, v.tone) +
        '<p class="assess-reason">' + esc(v.reason) + "</p></div>" + ack +
      '<p class="gw-note">This assessment is educational and does not recommend buying or selling any security (SEBI RIA boundary).</p>' +
      '<div class="gw-actions"><button id="assess-redo" class="btn btn-ghost">Redo assessment</button>' +
      '<button id="assess-proceed" class="btn btn-primary">Continue to summary →</button></div></div>';
    openModal(body);
    audit("suitability", "Assessment verdict for “" + p.name + "”: " + v.status + " (" + a.profile + " profile).");
    var redo = $("assess-redo"); if (redo) redo.addEventListener("click", function () { renderAssessmentForm(p, a.answers); });
    var proceed = $("assess-proceed");
    var ackCb = $("assess-ack-cb");
    function syncProceed() { if (proceed && ackCb) proceed.disabled = !ackCb.checked; }
    if (ackCb) { ackCb.addEventListener("change", syncProceed); syncProceed(); }
    if (proceed) proceed.addEventListener("click", function () {
      if (ackCb && !ackCb.checked) return;
      openInvestSummary(p);
    });
  }

  function openInvestSummary(p, presetQty) {
    if (!p.registered) { openProduct(p); return; }                 // regulatory gate
    var lessonOk = !p.requiredLesson || state.completedLessons.indexOf(p.requiredLesson) >= 0;
    if (!lessonOk) { openProduct(p); return; }
    if (!state.assessment) { openSuitabilityAssessment(p); return; } // assessment required first
    var verdict = assessSuitability(p, state.assessment);
    var price = p.price || 0;
    var qty = presetQty != null ? presetQty : defaultQty(p);
    var unit = unitLabel(p);
    var priceLbl = p.assetClass === "mf" ? "Current NAV" : "Current price";
    function amtRow() { return fmt(price * qty); }
    var body = '<div class="gateway"><div class="gw-modal-head"><h2 style="margin:0;">Investment summary</h2>' +
      gradeBadge(p.riskGrade) + "</div>" + gatewaySteps("summary") +
      '<div class="gw-summary">' +
        '<div class="gw-row"><span>Instrument</span><b>' + esc(p.name) + "</b></div>" +
        '<div class="gw-row"><span>Category</span><b>' + esc(p.category) + "</b></div>" +
        '<div class="gw-row"><span>' + priceLbl + '</span><b>' + fmt(price) + "</b></div>" +
        '<div class="gw-row gw-qty-row"><span>' + unit + '</span>' +
          '<input id="gw-qty" type="number" min="1" step="1" value="' + qty + '" class="gw-qty-input"></div>' +
        '<div class="gw-row gw-amount"><span>Estimated amount</span><b id="gw-amount">' + amtRow() + "</b></div>" +
        '<div class="gw-row"><span>Risk</span>' + gradeBadge(p.riskGrade) +
          ' <span class="gw-risk-lbl">' + esc(({ A: "Low", B: "Medium", C: "High", D: "High", E: "Very High" })[p.riskGrade] || "—") + " risk</span></div>" +
        '<div class="gw-row"><span>Suitability</span>' + statusPill(verdict.status, verdict.tone) + "</div>" +
      "</div>" +
      '<p class="gw-note">NiveshOS is an aggregator — it prepares this order and redirects you to a SEBI-registered broker to complete it. No trade is executed here.</p>' +
      '<div class="gw-actions"><button id="gw-back" class="btn btn-ghost">← Back</button>' +
      '<button id="gw-continue" class="btn btn-primary">Choose broker →</button></div></div>';
    openModal(body);
    var qEl = $("gw-qty"), amtEl = $("gw-amount");
    function currentQty() {
      var v = qEl ? Math.floor(parseFloat(qEl.value)) : qty;
      return (!v || v < 1) ? 0 : v;
    }
    function refresh() {
      var q = currentQty();
      if (amtEl) amtEl.textContent = fmt(price * q);
      var cont = $("gw-continue");
      var below = price * q < (p.minInvest || 0);
      if (cont) cont.disabled = q < 1 || below;
      if (amtEl) amtEl.style.color = below ? "var(--serious)" : "";
    }
    if (qEl) qEl.addEventListener("input", refresh);
    refresh();
    var bk = $("gw-back"); if (bk) bk.addEventListener("click", function () { showAssessmentResult(p); });
    var ct = $("gw-continue"); if (ct) ct.addEventListener("click", function () {
      var q = currentQty();
      if (q < 1) { toast("Enter a valid quantity."); return; }
      if (price * q < (p.minInvest || 0)) { toast("Minimum investment is " + fmt(p.minInvest)); return; }
      openBrokerSelection(p, q);
    });
  }

  function openBrokerSelection(p, qty) {
    var price = p.price || 0, amt = price * qty;
    var assetLbl = ASSET_LABEL[p.assetClass] || p.category;
    var cards = (D.brokers || []).map(function (b) {
      var ok = b.supports.indexOf(p.assetClass) >= 0;
      var assets = b.supports.map(function (a) {
        return '<span class="chip broker-asset">' + esc(ASSET_LABEL[a] || a) + "</span>";
      }).join("");
      var cta = ok
        ? '<button class="btn btn-primary broker-continue" type="button" data-broker="' + esc(b.id) + '">Continue with ' + esc(b.name) + "</button>"
        : '<button class="btn btn-ghost" type="button" disabled>No ' + esc(assetLbl) + " support</button>";
      return '<div class="broker-card' + (ok ? "" : " broker-card-off") + '">' +
        '<div class="broker-head"><span class="broker-logo" style="background:' + esc(b.color) + ';">' + esc(b.mark) + "</span>" +
          '<div><div class="broker-name">' + esc(b.name) + "</div>" +
          '<div class="broker-platform">' + esc(b.platform) + "</div></div></div>" +
        '<p class="broker-desc">' + esc(b.desc) + "</p>" +
        '<div class="broker-assets">' + assets + "</div>" + cta + "</div>";
    }).join("");
    var body = '<div class="gateway"><h2 style="margin:0;">Choose your broker</h2>' + gatewaySteps("broker") +
      '<p class="gw-note">Investing <b>' + fmt(amt) + "</b> in <b>" + esc(p.name) + "</b> (" + qty + " " + unitLabel(p).toLowerCase() + "). Pick where to place it — you'll be redirected to complete KYC & payment.</p>" +
      '<div class="broker-grid">' + cards + "</div>" +
      '<div class="gw-actions"><button id="gw-back" class="btn btn-ghost">← Back</button>' +
      '<button id="gw-close" class="btn btn-ghost">Cancel</button></div></div>';
    openModal(body);
    Array.prototype.forEach.call(document.querySelectorAll(".broker-continue"), function (btn) {
      btn.addEventListener("click", function () {
        var b = (D.brokers || []).filter(function (x) { return x.id === btn.getAttribute("data-broker"); })[0];
        if (b) openRedirect(p, qty, b);
      });
    });
    var bk = $("gw-back"); if (bk) bk.addEventListener("click", function () { openInvestSummary(p, qty); });
    var cl = $("gw-close"); if (cl) cl.addEventListener("click", closeModal);
  }

  var BROKER_HOST = { zerodha: "kite.zerodha.com", groww: "groww.in", angelone: "angelone.in", upstox: "upstox.com", paytmmoney: "paytmmoney.com" };
  function brokerDeepLink(b, p, qty) {
    // Placeholder handoff URL. A real integration swaps this for the broker's
    // basket/OAuth deep link (or SmartAPI/Kite Connect order). Never navigated
    // in the demo — shown so the redirect target is explicit and API-ready.
    var host = (b && (b.host || BROKER_HOST[b.id])) || "broker.example";
    return "https://" + host + "/invest?symbol=" + encodeURIComponent(p.symbol || p.id) +
      "&qty=" + qty + "&source=niveshos";
  }

  function openRedirect(p, qty, b) {
    var price = p.price || 0, amt = price * qty;
    var link = brokerDeepLink(b, p, qty);
    audit("gateway", "Investment gateway: " + qty + " × “" + p.name + "” routed to " + b.name +
      " — redirect prepared (" + fmt(amt) + ", no order executed).");
    // Step 1: redirecting spinner
    openModal('<div class="gateway">' + gatewaySteps("redirect") +
      '<div class="redirect-screen"><div class="redirect-spinner" style="border-top-color:' + esc(b.color) + ';"></div>' +
      '<p>Securely handing you off to <b>' + esc(b.name) + "</b>…</p></div></div>");
    setTimeout(function () {
      // Bail if the user cancelled the redirect (or navigated) while the spinner
      // was showing — the spinner is gone from the DOM in that case.
      if (!document.querySelector(".redirect-spinner")) return;
      // Step 2: broker landing placeholder (simulated — no real navigation)
      var body = '<div class="gateway"><div class="broker-landing">' +
        '<div class="broker-landing-head"><span class="broker-logo lg" style="background:' + esc(b.color) + ';">' + esc(b.mark) + "</span>" +
          '<div><div class="broker-name">' + esc(b.name) + "</div>" +
          '<div class="broker-platform">NiveshOS → ' + esc(b.platform) + "</div></div></div>" +
        gatewaySteps("redirect") +
        '<div class="gw-summary">' +
          '<div class="gw-row"><span>Instrument</span><b>' + esc(p.name) + "</b></div>" +
          '<div class="gw-row"><span>' + unitLabel(p) + '</span><b>' + qty + "</b></div>" +
          '<div class="gw-row"><span>Price</span><b>' + fmt(price) + "</b></div>" +
          '<div class="gw-row gw-amount"><span>Amount</span><b>' + fmt(amt) + "</b></div>" +
        "</div>" +
        '<p class="gw-note">Order details are pre-filled for <b>' + esc(b.name) + "</b>. The broker completes KYC, collects payment and places the order — NiveshOS does not execute trades. <b>Demo build:</b> the external redirect is simulated, so no real order is placed.</p>" +
        '<div class="gw-deeplink"><span>Handoff link (demo)</span><code>' + esc(link) + "</code></div>" +
        '<div class="gw-actions"><button id="gw-open" class="btn btn-primary">Open ' + esc(b.name) + " (demo)</button>" +
        '<button id="gw-done" class="btn btn-ghost">Back to NiveshOS</button></div></div></div>';
      openModal(body);
      var op = $("gw-open"); if (op) op.addEventListener("click", function () {
        toast("Demo build — external broker redirect is disabled.", "warn");
      });
      var dn = $("gw-done"); if (dn) dn.addEventListener("click", closeModal);
    }, 1200);
  }

  /* ============================================================ DISCOVER
     Investment Discovery Marketplace. Reuses the whole product engine:
     catalogue `products` carry a real invest flow already; stocks / non-index
     MFs / gold ETFs are pulled (deduped) from every persona's holdings and
     wrapped as product-shaped objects so openProduct/suitability/the gateway
     work on them unchanged. Prices/NAVs read live from the same D.products /
     D.holdings the Yahoo + AMFI pipeline populates, so a NAV refresh re-prices
     these cards too. */
  var DISCOVER_CATS = [
    { key: "stocks", label: "Stocks" },
    { key: "mf", label: "Mutual Funds" },
    { key: "reits", label: "REITs" },
    { key: "invits", label: "InvITs" },
    { key: "gold", label: "Gold ETFs" },
    { key: "index", label: "Index Funds" },
    { key: "cbonds", label: "Corporate Bonds" },
    { key: "gsec", label: "Government Securities" }
  ];
  // catalogue product.category → marketplace category key
  var PRODUCT_CAT = {
    "REIT": "reits", "InvIT": "invits", "Corporate Bond": "cbonds",
    "Index Fund": "index", "Sovereign Gold Bond": "gsec", "Treasury Bill": "gsec"
  };
  var RISK_LEVELS = ["Low", "Medium", "High", "Very High"];
  var GRADE_RISK = { A: "Low", B: "Medium", C: "High", D: "High", E: "Very High" };
  var CLASS_RISK = { equity: "High", mf: "Medium", etf: "Medium" };

  // discover UI state (kept across panel switches, reset on reload/logout)
  var discSearch = "", discRisk = "all", discCat = "all";
  var discCompare = {};      // key → instrument, current compare selection
  var _discIndex = {};       // key → instrument, for the current painted grid
  var _discLoaded = false;   // show the loading state only on first entry

  function catLabelOf(key) {
    var c = DISCOVER_CATS.filter(function (x) { return x.key === key; })[0];
    return c ? c.label : key;
  }
  function riskOf(grade, assetClass) {
    if (grade && GRADE_RISK[grade]) return GRADE_RISK[grade];
    return CLASS_RISK[assetClass] || "Medium";
  }
  function holdingCat(h) {
    if (h.assetClass === "equity") return "stocks";
    if (h.assetClass === "etf") return "gold";
    if (h.assetClass === "mf") {
      return (String(h.schemeCode) === "120716" || /index|nifty|sensex/i.test(h.name)) ? "index" : "mf";
    }
    return null; // bonds / reits / invits are already covered by the catalogue
  }
  function holdingDesc(h) {
    if (h.assetClass === "equity") return (h.sector || "Listed") + " sector · exchange-listed equity share.";
    if (h.assetClass === "etf") return "Exchange-traded fund backed by physical gold, held in demat.";
    if (h.assetClass === "mf") return (h.sector || "Diversified") + " mutual fund — priced at daily NAV.";
    return h.name;
  }
  // wrap a holding as a catalogue-shaped product so the invest engine accepts it
  function synthProduct(h, cat) {
    return {
      id: "disc_" + h.symbol, symbol: h.symbol, name: h.name,
      category: catLabelOf(cat), assetClass: h.assetClass, sector: h.sector,
      schemeCode: h.schemeCode || null,
      riskGrade: h.assetClass === "equity" ? "C" : "B",
      liquidity: "High", complexity: 1,
      minInvest: Math.max(100, Math.round(h.ltp || 100)),
      price: h.ltp,
      yieldOrReturn: h.assetClass === "equity" ? "Market-linked returns"
        : h.assetClass === "etf" ? "Tracks the gold price" : "Market-linked (daily NAV)",
      issuerRating: "NA", registered: true, requiredLesson: null, minTier: "conservative",
      blurb: holdingDesc(h)
    };
  }
  function buildDiscoverUniverse() {
    var out = [], seen = {}, prodKeys = {};
    (D.products || []).forEach(function (p) {
      if (p.schemeCode) prodKeys["sc:" + p.schemeCode] = 1;
      if (p.quoteSym) prodKeys["sy:" + p.quoteSym] = 1;
      var cat = PRODUCT_CAT[p.category];
      if (!cat) return; // unregistered scam / anything unmapped stays out of Discover
      var k = "p:" + p.id;
      seen[k] = 1;
      out.push({
        key: k, name: p.name, cat: cat, catLabel: catLabelOf(cat),
        assetClass: p.assetClass, price: p.price, dayChangePct: null,
        risk: riskOf(p.riskGrade), desc: p.blurb, yield: p.yieldOrReturn, product: p
      });
    });
    (D.users || []).forEach(function (u) {
      (u.holdings || []).forEach(function (h) {
        var cat = holdingCat(h);
        if (!cat) return;
        if (prodKeys["sc:" + h.schemeCode] || prodKeys["sy:" + h.symbol]) return; // already catalogued
        var k = "h:" + h.symbol;
        if (seen[k]) return; // dedupe the same instrument across personas
        seen[k] = 1;
        out.push({
          key: k, name: h.name, cat: cat, catLabel: catLabelOf(cat),
          assetClass: h.assetClass, price: h.ltp, dayChangePct: h.dayChangePct,
          risk: riskOf(null, h.assetClass), desc: holdingDesc(h),
          yield: null, product: synthProduct(h, cat)
        });
      });
    });
    return out;
  }

  function matchesDiscover(inst) {
    if (discCat !== "all" && inst.cat !== discCat) return false;
    if (discRisk !== "all" && inst.risk !== discRisk) return false;
    if (discSearch) {
      var q = discSearch.toLowerCase();
      if ((inst.name + " " + inst.catLabel + " " + inst.desc).toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  }

  function renderDiscover() {
    renderDiscoverToolbar();
    renderDiscoverCats();
    renderCompareBar();
    if (!_discLoaded) {
      paintDiscoverLoading();
      _discLoaded = true;
      setTimeout(paintDiscover, 260); // brief, honest loading state on first open
    } else {
      paintDiscover();
    }
  }

  function renderDiscoverToolbar() {
    // Rebuilt only on panel entry (not on each keystroke) so the search field
    // keeps focus while typing — the input handler repaints the grid alone.
    var host = $("discover-toolbar"); if (!host) return;
    host.innerHTML = '<div class="disc-tools">' +
      '<input id="disc-search" class="chat-input disc-search" type="search" ' +
        'placeholder="Search instruments — HDFC, Nifty, gold…" aria-label="Search instruments" value="' + esc(discSearch) + '">' +
      '<label class="disc-risk-filter">Risk ' +
        '<select id="disc-risk" class="tv-select" aria-label="Filter by risk level">' +
          '<option value="all"' + (discRisk === "all" ? " selected" : "") + '>All levels</option>' +
          RISK_LEVELS.map(function (r) {
            return '<option value="' + r + '"' + (discRisk === r ? " selected" : "") + '>' + r + "</option>";
          }).join("") +
        "</select></label></div>";
    var s = $("disc-search");
    if (s) s.addEventListener("input", function () { discSearch = s.value; paintDiscover(); });
    var rf = $("disc-risk");
    if (rf) rf.addEventListener("change", function () { discRisk = rf.value; paintDiscover(); });
  }

  function renderDiscoverCats() {
    var host = $("discover-categories"); if (!host) return;
    var chips = '<button class="chip category disc-cat' + (discCat === "all" ? " active" : "") +
      '" data-cat="all" type="button">All</button>';
    DISCOVER_CATS.forEach(function (c) {
      chips += '<button class="chip category disc-cat' + (discCat === c.key ? " active" : "") +
        '" data-cat="' + c.key + '" type="button">' + esc(c.label) + "</button>";
    });
    host.innerHTML = chips;
    Array.prototype.forEach.call(host.querySelectorAll(".disc-cat"), function (b) {
      b.addEventListener("click", function () {
        discCat = b.getAttribute("data-cat");
        renderDiscoverCats(); paintDiscover();
      });
    });
  }

  function paintDiscoverLoading() {
    var host = $("discover-grid"); if (!host) return;
    var sk = "";
    for (var i = 0; i < 6; i++) {
      sk += '<div class="product-card disc-skel" aria-hidden="true">' +
        '<div class="skel-line w60"></div><div class="skel-line w35"></div>' +
        '<div class="skel-line w90"></div><div class="skel-line w80"></div>' +
        '<div class="skel-actions"><span class="skel-btn"></span><span class="skel-btn"></span></div></div>';
    }
    host.innerHTML = sk;
  }

  function discoverStateHTML(kind) {
    if (kind === "error") {
      return '<div class="disc-state"><div class="disc-state-icon">' + ic("warning") + "</div>" +
        "<h3>Couldn't load the marketplace</h3>" +
        "<p>Instrument data is unavailable right now. Please try again.</p>" +
        '<button id="disc-retry" class="btn btn-primary" type="button">Retry</button></div>';
    }
    return '<div class="disc-state"><div class="disc-state-icon">' + ic("search") + "</div>" +
      "<h3>No instruments match</h3>" +
      "<p>Try a different category, risk level or search term.</p>" +
      '<button id="disc-reset" class="btn btn-ghost" type="button">Clear filters</button></div>';
  }

  function paintDiscover() {
    var host = $("discover-grid"); if (!host) return;
    var all;
    try {
      all = buildDiscoverUniverse();
    } catch (e) {
      host.innerHTML = discoverStateHTML("error");
      var rb = $("disc-retry");
      if (rb) rb.addEventListener("click", function () { _discLoaded = false; renderDiscover(); });
      return;
    }
    if (!all || !all.length) {
      host.innerHTML = discoverStateHTML("error");
      var rb2 = $("disc-retry");
      if (rb2) rb2.addEventListener("click", function () { _discLoaded = false; renderDiscover(); });
      return;
    }
    var filtered = all.filter(matchesDiscover);
    if (!filtered.length) {
      host.innerHTML = discoverStateHTML("empty");
      var rs = $("disc-reset");
      if (rs) rs.addEventListener("click", function () {
        discSearch = ""; discRisk = "all"; discCat = "all";
        renderDiscoverToolbar(); renderDiscoverCats(); paintDiscover();
      });
      return;
    }
    _discIndex = {};
    filtered.forEach(function (f) { _discIndex[f.key] = f; });
    host.innerHTML = filtered.map(discoverCard).join("");
    wireDiscoverCards(host);
  }

  function discoverCard(inst) {
    var day = inst.dayChangePct == null
      ? '<span class="disc-day neutral">—</span>'
      : '<span class="disc-day ' + cls_dir(inst.dayChangePct) + '" style="color:' + dirColor(inst.dayChangePct) + ';">' + pct(inst.dayChangePct) + "</span>";
    var priceLbl = inst.assetClass === "mf" ? "NAV" : "Price";
    var riskCls = "risk-" + inst.risk.toLowerCase().replace(/\s+/g, "-");
    var checked = discCompare[inst.key] ? " checked" : "";
    return '<div class="product-card discover-card" data-key="' + esc(inst.key) + '">' +
      '<div class="disc-card-head">' +
        '<div><div class="product-name">' + esc(inst.name) + "</div>" +
        '<div class="disc-type">' + esc(inst.catLabel) + "</div></div>" +
        '<span class="disc-risk ' + riskCls + '">' + esc(inst.risk) + "</span>" +
      "</div>" +
      '<div class="disc-price-row">' +
        '<div><span class="disc-price">' + fmt(inst.price) + '</span> <span class="disc-price-lbl">' + priceLbl + "</span></div>" +
        day +
      "</div>" +
      '<p class="disc-desc">' + esc(inst.desc) + "</p>" +
      '<div class="disc-actions">' +
        '<button class="btn btn-ghost disc-details" type="button">View Details</button>' +
        '<label class="disc-compare-toggle"><input type="checkbox" class="disc-compare-cb"' + checked + '> Compare</label>' +
        '<button class="btn btn-primary disc-invest" type="button">Invest</button>' +
      "</div></div>";
  }

  function wireDiscoverCards(host) {
    Array.prototype.forEach.call(host.querySelectorAll(".discover-card"), function (card) {
      var inst = _discIndex[card.getAttribute("data-key")];
      if (!inst) return;
      var det = card.querySelector(".disc-details");
      var inv = card.querySelector(".disc-invest");
      var cb = card.querySelector(".disc-compare-cb");
      if (det) det.addEventListener("click", function () { openProduct(inst.product); });
      if (inv) inv.addEventListener("click", function () { openInvestSummary(inst.product); });
      if (cb) cb.addEventListener("change", function () {
        if (cb.checked) discCompare[inst.key] = inst; else delete discCompare[inst.key];
        renderCompareBar();
      });
    });
  }

  function renderCompareBar() {
    var bar = $("discover-compare-bar"); if (!bar) return;
    var keys = Object.keys(discCompare);
    if (!keys.length) { bar.hidden = true; bar.innerHTML = ""; return; }
    bar.hidden = false;
    bar.innerHTML = '<span class="cmp-count">' + keys.length + " selected to compare</span>" +
      '<div class="cmp-actions">' +
        '<button id="disc-cmp-clear" class="btn btn-ghost" type="button">Clear</button>' +
        '<button id="disc-cmp-go" class="btn btn-primary" type="button"' + (keys.length < 2 ? " disabled" : "") + ">Compare " + keys.length + "</button>" +
      "</div>";
    var c = $("disc-cmp-clear");
    if (c) c.addEventListener("click", function () { discCompare = {}; renderCompareBar(); paintDiscover(); });
    var g = $("disc-cmp-go");
    if (g) g.addEventListener("click", openCompareModal);
  }

  function openCompareModal() {
    // Re-resolve selections against a fresh universe by key so the table shows
    // current prices/NAVs (a NAV refresh may have repriced since selection),
    // falling back to the stored snapshot if a key is no longer present.
    var fresh = {};
    try { buildDiscoverUniverse().forEach(function (i) { fresh[i.key] = i; }); } catch (e) { /* keep snapshot */ }
    var items = Object.keys(discCompare).map(function (k) { return fresh[k] || discCompare[k]; });
    if (items.length < 2) return;
    var head = "<th>Metric</th>" + items.map(function (i) { return "<th>" + esc(i.name) + "</th>"; }).join("");
    function rowR(label, fn) {
      return "<tr><td><b>" + label + "</b></td>" + items.map(function (i) { return "<td>" + fn(i) + "</td>"; }).join("") + "</tr>";
    }
    var body = '<div class="compare-modal"><h2 style="margin:0 0 10px;">Compare instruments</h2>' +
      '<div class="compare-scroll"><table class="data-table compare-table">' +
      "<thead><tr>" + head + "</tr></thead><tbody>" +
      rowR("Category", function (i) { return esc(i.catLabel); }) +
      rowR("Price / NAV", function (i) { return fmt(i.price); }) +
      rowR("Daily change", function (i) { return i.dayChangePct == null ? "—" : '<span style="color:' + dirColor(i.dayChangePct) + ';">' + pct(i.dayChangePct) + "</span>"; }) +
      rowR("Risk level", function (i) { return esc(i.risk); }) +
      rowR("Yield / return", function (i) { return esc(i.yield || "—"); }) +
      rowR("Description", function (i) { return esc(i.desc); }) +
      "</tbody></table></div>" +
      '<button id="cmp-close" class="btn btn-ghost" style="margin-top:12px;">Close</button></div>';
    openModal(body);
    var cl = $("cmp-close"); if (cl) cl.addEventListener("click", closeModal);
  }

  /* -------------------------------------------------------------- copilot */
  var SUGGEST_CHIPS = [
    "Summarize my portfolio",
    "Why did my portfolio change today?",
    "What's my biggest sector exposure?",
    "Which holding contributes most?",
    "How diversified am I?",
    "Explain my risk score",
    "Compare REITs and InvITs",
    "Explain Gold ETFs"
  ];
  var ADVICE_NOTE = '<div class="advice-note" style="font-size:11px;color:var(--ink-muted);margin-top:8px;border-top:1px solid var(--hairline);padding-top:6px;">' + ic("info") + ' Informational &amp; educational only, not investment advice (SEBI RIA boundary).</div>';

  function renderCopilot() {
    var chips = $("chat-suggestions");
    if (chips) {
      chips.innerHTML = SUGGEST_CHIPS.map(function (c) {
        return '<button class="chip" type="button">' + esc(c) + "</button>";
      }).join("");
      Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (b) {
        b.addEventListener("click", function () { sendChat(b.textContent); });
      });
    }
    var form = $("chat-form");
    if (form && !form._wired) {
      form._wired = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = $("chat-input");
        if (inp && inp.value.trim()) { sendChat(inp.value.trim()); inp.value = ""; }
      });
    }
    var log = $("chat-log");
    if (log && !log._greeted) {
      log._greeted = true;
      var firstName = ((D.investor && D.investor.name) || "there").split(" ")[0];
      addMsg("assistant", "<b>Namaste, " + esc(firstName) + ".</b> I read your live portfolio. Ask me why you're down today, where you're overexposed, how healthy your portfolio is, or to explain any instrument. Try a chip below." + ADVICE_NOTE);
    }
  }
  function addMsg(who, html) {
    var log = $("chat-log"); if (!log) return null;
    var m = el("div", "chat-bubble " + (who === "user" ? "user" : "assistant"));
    m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    return m;
  }
  function sendChat(text) {
    addMsg("user", esc(text));
    var typing = addMsg("assistant", '<span class="typing-indicator">thinking…</span>');
    var delay = 600 + Math.random() * 300;
    setTimeout(function () {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      addMsg("assistant", copilotAnswer(text));
    }, delay);
  }

  function copilotAnswer(text) {
    var q = text.toLowerCase();
    var ans;
    // 9. scam check (before generic)
    if (/quickrich|agro gold|assured|guaranteed|24%/.test(q)) {
      ans = "<b>" + ic("ban") + " Red flag.</b> “QuickRich Agro Gold Scheme” promises <b>24% assured returns</b> and is <b>not found in any SEBI or exchange registry</b>. Guaranteed high returns are a classic fraud marker — NiveshOS blocks it. Verified alternatives are in Discover.";
    } else if (/summar|overview|snapshot|tl;? ?dr|brief.*portfolio|portfolio.*brief/.test(q)) {
      var td3 = thirtyDay(), mh3 = mergedHoldings(), se3 = sectorExposure()[0], hr3 = healthReport(), al3 = assetAlloc().slice(0, 3);
      ans = "<b>Portfolio snapshot</b>" +
        '<ul style="margin:6px 0;padding-left:18px;">' +
        "<li><b>Net worth</b> " + fmt(netWorth()) + " — " + pct(td3.pct) + " over 30 days</li>" +
        "<li><b>Mix</b> " + al3.map(function (a) { return esc(a.label) + " " + a.pct.toFixed(0) + "%"; }).join(", ") + "</li>" +
        "<li><b>Top sector</b> " + esc(se3.sector) + " " + se3.pct.toFixed(1) + "%</li>" +
        "<li><b>Largest holding</b> " + esc(mh3[0].name) + " (" + fmt(mh3[0].value) + ")</li>" +
        "<li><b>Health</b> " + hr3.score + "/100 — " + hr3.grade.label + "</li>" +
        "<li><b>Idle cash</b> " + fmt(idleCash()) + "</li>" +
        "</ul>Ask me to drill into any line.";
    } else if (/biggest sector|sector exposure|which sector|largest sector|most.*sector|sector.*(exposure|breakdown|split)/.test(q)) {
      var se = sectorExposure().slice(0, 3);
      ans = "<b>Your biggest sector exposure is " + esc(se[0].sector) + " at " + se[0].pct.toFixed(1) + "%</b> of market value. Top three:" +
        '<ul style="margin:6px 0;padding-left:18px;">' + se.map(function (s) { return "<li><b>" + esc(s.sector) + "</b> — " + s.pct.toFixed(1) + "% (" + fmt(s.value) + ")</li>"; }).join("") + "</ul>" +
        "Any one sector above ~30% means a single shock — say a rate move for banks — can swing your whole portfolio.";
    } else if (/contribut|biggest holding|largest holding|largest position|biggest position|top holding|which holding.*(most|biggest)|most of my portfolio/.test(q)) {
      var mh = mergedHoldings(), topH = mh[0], nwH = netWorth();
      var shareH = nwH ? topH.value / nwH * 100 : 0;
      ans = "<b>" + esc(topH.name) + " is your largest position</b> — " + fmt(topH.value) + ", about " + shareH.toFixed(1) + "% of net worth. " +
        "Next come <b>" + esc(mh[1] ? mh[1].name : "—") + "</b> and <b>" + esc(mh[2] ? mh[2].name : "—") + "</b>. " +
        "The more one holding dominates, the more your returns ride on that single name.";
    } else if (/diversif|how spread|well spread|spread out|balanced.*portfolio/.test(q)) {
      var classesD = diversifiedClassCount(), seD = sectorExposure()[0], ovD = mfOverlap();
      ans = "<b>You hold " + classesD + " asset class" + (classesD === 1 ? "" : "es") + " above 5% weight</b>" +
        (classesD >= 4 ? " — a genuinely broad spread." : classesD >= 2 ? " — a fair spread, with room to broaden." : " — that's concentrated in one place.") +
        " Your largest sector is <b>" + esc(seD.sector) + "</b> at " + seD.pct.toFixed(1) + "%." +
        (ovD && ovD.pct >= 60 ? " Note: your two funds overlap ~" + ovD.pct + "%, so they count as less diversification than they look." : "") +
        " The full five-factor read is in <b>Analytics</b>.";
    } else if (/risk score|risk profile|my risk tier|what'?s my risk\b|explain my risk\b/.test(q)) {
      if (state.riskProfile) {
        var unl = { conservative: "T-Bills, SGBs, AAA bonds and index funds", balanced: "those plus REITs, InvITs and higher-yield bonds", aggressive: "the full multi-asset catalogue" };
        ans = "<b>Your risk profile is " + cap(state.riskProfile) + (state.riskScore != null ? " (score " + state.riskScore + "/24)" : "") + ".</b> " +
          "It comes from a 6-question quiz on your age, time horizon, income stability, knowledge and how you'd react to a fall. " +
          "It sets your <b>suitability tier</b> — you can access " + unl[state.riskProfile] + ". Retake it any time in <b>Profile</b>.";
      } else {
        ans = "<b>You haven't set a risk profile yet.</b> Take the 6-question quiz in <b>Profile</b> — it scores your capacity and willingness to take risk, then unlocks which products are suitable for you.";
      }
    } else if (/(compar|vs|versus|differ).*(reit|invit)|reit.*invit|invit.*reit/.test(q)) {
      ans = "<b>REITs vs InvITs — same idea, different assets:</b>" +
        '<ul style="margin:6px 0;padding-left:18px;">' +
        "<li><b>REIT</b> — owns rent-earning <b>real estate</b> (offices, malls). Distribution ~6–7%, mostly rent.</li>" +
        "<li><b>InvIT</b> — owns <b>infrastructure</b> (power lines, roads, pipelines). Distribution ~9–11%, but part is return of your own capital, so the headline yield overstates true return.</li>" +
        "</ul>Both trade on the exchange, both pay regular distributions, and both move with interest rates. InvIT yields look higher largely because of that capital-return quirk.";
    } else if (/gold etf|goldbees|gold e ?t ?f|gold bees|nippon.*gold|explain gold\b/.test(q)) {
      var gh = mergedHoldings().filter(function (h) { return h.symbol === "GOLDBEES"; })[0];
      ans = "<b>A Gold ETF</b> is an exchange-traded fund that holds physical gold for you — one unit tracks the gold price and you buy or sell it like a share, with no locker or making charges." +
        (gh ? " You hold <b>" + esc(gh.symbol) + "</b> worth " + fmt(gh.value) + " (" + pct(gh.dayChangePct) + " today)." : "") +
        " Gold often rises when equities fall, so a small slice cushions your portfolio on red days — a diversifier, not a growth engine.";
    } else if (/(why).*(change|move|down|drop|fall|red|lower|up|gain)|(change|move|down|up) today|today.*(change|move)/.test(q)) {
      var dp = dayPnL(), rk = riskiestHolding();
      var mhW = mergedHoldings();
      var topUp = mhW.slice().sort(function (a, b) { return (b.dayChangePct || 0) - (a.dayChangePct || 0); })[0];
      var dir = dp.pct > 0 ? "up" : dp.pct < 0 ? "down" : "flat";
      ans = "<b>You're " + pct(dp.pct) + " today (" + fmtSigned(dp.rupees) + ").</b> " +
        "Biggest drag: <b>" + esc(rk.name) + "</b> " + pct(rk.dayChangePct) + ". " +
        "Biggest lift: <b>" + esc(topUp.name) + "</b> " + pct(topUp.dayChangePct) + ". " +
        (dir === "down" ? "Softness in your bank stocks is the usual driver on this book."
          : dir === "up" ? "Green across most of your larger positions today."
          : "Gains and losses roughly cancelled out.");
    } else if (/overexpos|concentrat|too much|overweight|risk.*sector|banks?/.test(q)) {
      var ti = topIssuer();
      ans = "<b>Yes — you're bank-heavy.</b> Financials are <b>" + financialsPct().toFixed(1) + "%</b> of your market value (comfort band is ~30%). Your single largest issuer, <b>" + esc(ti.name) + "</b>, is " + ti.pct.toFixed(1) + "% on its own. Spreading into non-financial or non-equity assets would reduce this.";
    } else if (/overlap|same stocks|two funds|duplicate fund/.test(q)) {
      var ov = mfOverlap();
      ans = ov ? "<b>Your two funds overlap ~" + ov.pct + "%.</b> " + esc(ov.a.name.split(" —")[0]) + " and " + esc(ov.b.name.split(" —")[0]) + " share " + ov.common.length + " of their top 5: <b>" + ov.common.map(function (c) { return esc(c.name); }).join(", ") + "</b>. Holding both gives less diversification than it looks."
        : "I couldn't find two look-through funds to compare.";
    } else if (/idle cash|spare cash|cash lying|do with.*cash|park/.test(q)) {
      var sp = suitableProducts().filter(function (p) { return p.liquidity !== "Low"; }).slice(0, 2);
      var list = sp.length ? sp.map(function (p) { return "<li><b>" + esc(p.name) + "</b> — " + esc(p.yieldOrReturn) + "</li>"; }).join("")
        : "<li>Take the risk quiz to unlock suitable options.</li>";
      ans = "<b>" + fmt(idleCash()) + " is sitting idle</b> at ~0%. Based on your " + (state.riskProfile ? cap(state.riskProfile) + " profile" : "portfolio") + ", suitable low-friction options:<ul style=\"margin:6px 0;padding-left:18px;\">" + list + "</ul>";
    } else if (/riskiest|most risky|biggest risk|volatile|worst holding/.test(q)) {
      var r = riskiestHolding();
      ans = "<b>" + esc(r.name) + "</b> is your sharpest mover today at " + pct(r.dayChangePct) + " (value " + fmt(hv(r)) + "). Single-stock moves like this are why your " + financialsPct().toFixed(0) + "% financials tilt matters — concentrated bets swing hardest.";
    } else if (/what can i buy|what should i buy|suitable|recommend|invest in|buy/.test(q)) {
      var sp2 = suitableProducts().slice(0, 4);
      ans = state.riskProfile
        ? "<b>With your " + cap(state.riskProfile) + " profile</b>, these pass every suitability gate:<ul style=\"margin:6px 0;padding-left:18px;\">" + (sp2.length ? sp2.map(function (p) { return "<li>" + esc(p.name) + " — " + esc(p.yieldOrReturn) + "</li>"; }).join("") : "<li>Complete a required lesson to unlock products.</li>") + "</ul>Open Discover for the full list."
        : "First take the 6-question <b>risk quiz</b> in Profile — suitability gating needs your tier before I can list what you can buy.";
    } else if (/health|healthy|score|check.?up|portfolio grade/.test(q)) {
      var hr = healthReport();
      var weak = hr.factors.slice().sort(function (a, b) { return a.pts / a.max - b.pts / b.max; }).slice(0, 2);
      ans = "<b>Portfolio health: " + hr.score + "/100 — " + hr.grade.label + ".</b> Weakest links:" +
        '<ul style="margin:6px 0;padding-left:18px;">' + weak.map(function (f) {
          return "<li><b>" + f.label + "</b> (" + f.pts + "/" + f.max + ") — " + f.note + "</li>";
        }).join("") + "</ul>The full five-factor breakdown is in <b>Analytics</b>.";
    } else if (/how am i doing|portfolio value|net worth|total value|overall/.test(q)) {
      var td = thirtyDay();
      ans = "<b>Net worth: " + fmt(netWorth()) + ".</b> Over 30 days you're " + pct(td.pct) + " (from " + fmt(td.from) + "). Invested cost is " + fmt(invested()) + ", so you're sitting on " + fmtSigned(marketValue() - invested()) + " unrealised, with " + fmt(idleCash()) + " in cash.";
    } else if (/reit/.test(q)) {
      ans = explainAns("REIT", "A <b>REIT</b> lets you be a tiny landlord: it owns rent-earning offices/malls, trades like a share, and pays out 90%+ of rent as regular distributions.", "reit");
    } else if (/invit/.test(q)) {
      ans = explainAns("InvIT", "An <b>InvIT</b> is the REIT idea for infrastructure — power lines, highways, pipelines. Steady contracted cash flows mean high (9–11%) payouts, but part is return of capital.", "invit");
    } else if (/\bbond\b|corporate bond|debenture|ncd|coupon/.test(q)) {
      ans = explainAns("Corporate bonds", "A <b>bond</b> is a loan to a company: fixed coupon, principal back at maturity. Ratings (AAA safest) grade the risk — a higher coupon means higher risk, not free money.", "bonds");
    } else if (/\bsgb\b|gold bond|sovereign gold/.test(q)) {
      ans = explainAns("Sovereign Gold Bonds", "An <b>SGB</b> is RBI-issued, tracks gold, pays 2.5% interest a year, and is tax-free on maturity — gold exposure without lockers or making charges.", "sgb");
    } else {
      var g = glossaryLookup(q);
      ans = g || "I can help with your <b>live portfolio</b>. Try:<ul style=\"margin:6px 0;padding-left:18px;\"><li>How healthy is my portfolio?</li><li>Why am I down today?</li><li>Am I overexposed anywhere?</li><li>Explain REITs / InvITs / bonds / SGBs</li><li>What is NAV / NCD / drawdown?</li><li>What should I do with idle cash?</li></ul>";
    }
    return ans + ADVICE_NOTE;
  }
  function glossaryLookup(q) {
    var hit = (D.glossary || []).filter(function (t) {
      return q.indexOf(t.term.toLowerCase()) >= 0;
    }).sort(function (a, b) { return b.term.length - a.term.length; })[0];
    if (!hit) return null;
    return "<b>" + esc(hit.term) + "</b> — " + esc(hit.def) +
      '<div style="margin-top:6px;font-size:12px;color:var(--ink-muted);">More terms in the Jargon buster under Learn.</div>';
  }
  function explainAns(name, body, lessonId) {
    var done = state.completedLessons.indexOf(lessonId) >= 0;
    return body + '<div style="margin-top:6px;"><a href="#" data-lesson-link="' + lessonId + '" style="color:var(--accent);">' + (done ? "Revisit" : "Open") + " the " + esc(name) + " lesson →</a></div>";
  }

  /* -------------------------------------------------------------- trust */
  function renderTrust() {
    var cl = $("consent-ledger");
    if (cl) {
      cl.innerHTML = state.consents.length ? state.consents.map(function (c, i) {
        return '<div class="consent-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--hairline);">' +
          '<div><div style="font-weight:600;font-size:13px;">' + esc(c.scope) + "</div>" +
          '<div style="font-size:11px;color:var(--ink-muted);">Granted ' + esc(c.grantedOn) + " &middot; expires " + esc(c.expiry) + "</div></div>" +
          (c.active
            ? '<button class="btn-ghost revoke-btn" data-idx="' + i + '" style="font-size:12px;">Revoke</button>'
            : '<span style="color:var(--ink-muted);font-size:12px;">Revoked</span>') + "</div>";
      }).join("") : '<p style="color:var(--ink-muted);">No consents on record.</p>';
      Array.prototype.forEach.call(cl.querySelectorAll(".revoke-btn"), function (b) {
        b.addEventListener("click", function () {
          var idx = parseInt(b.getAttribute("data-idx"), 10);
          state.consents[idx].active = false; save("consents");
          audit("consent", "Consent revoked: " + state.consents[idx].scope + ".");
          renderTrust();
        });
      });
    }
    var at = $("audit-trail");
    if (at) {
      at.innerHTML = state.auditTrail.length ? state.auditTrail.slice().reverse().map(function (a) {
        return '<div class="audit-item" style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--hairline);font-size:12px;">' +
          '<span style="color:var(--ink-muted);white-space:nowrap;font-variant-numeric:tabular-nums;">' + esc(a.ts) + "</span>" +
          '<span class="audit-kind" style="text-transform:uppercase;font-size:10px;color:var(--accent);white-space:nowrap;">' + esc(a.kind) + "</span>" +
          '<span style="color:var(--ink-2);">' + esc(a.text) + "</span></div>";
      }).join("") : '<p style="color:var(--ink-muted);">Audit trail is empty.</p>';
    }
    var rc = $("registry-card");
    if (rc) {
      var verified = (D.products || []).filter(function (p) { return p.registered; }).length;
      var blocked = (D.products || []).length - verified;
      rc.innerHTML = '<h3 style="margin:0 0 8px;">Registry check</h3>' +
        '<p style="font-size:13px;color:var(--ink-2);">Every product is checked against a mock SEBI / exchange registry before it can be shown as investable.</p>' +
        '<div style="display:flex;gap:16px;margin-top:8px;">' +
        '<div><div style="font-size:1.6rem;font-weight:700;color:var(--good);">' + verified + '</div><div style="font-size:11px;color:var(--ink-muted);">Verified</div></div>' +
        '<div><div style="font-size:1.6rem;font-weight:700;color:var(--critical);">' + blocked + '</div><div style="font-size:11px;color:var(--ink-muted);">Blocked</div></div></div>';
    }
  }

  /* ========================================================= CAS PDF IMPORT
     Import a Consolidated Account Statement (CAMS / KFintech, or an NSDL/CDSL
     depository statement) and merge its holdings into the portfolio.
       upload PDF (or sample/paste) → extract text → parse (pluggable parser)
       → resolve each row against the ISIN master → review & correct unknowns
       → confirm → merge → recompute all analytics.
     Nothing is written until the user confirms. Existing holdings are never
     overwritten — a row whose instrument is already held is reported as a
     duplicate and consolidated, not added again (so it can't double-count).
     New depository formats plug in via registerCASParser(); everything after
     parsing (resolution, review, merge) is format-agnostic.                   */
  var CAS_ACCT = { id: "acc_cas", broker: "CAS Import", depository: "CAMS / NSDL / CDSL", type: "Imported statement" };
  var CAS_CLASS_OPTS = [
    { v: "equity", t: "Equity / Stock" }, { v: "mf", t: "Mutual Fund" },
    { v: "bond", t: "Bond / NCD" }, { v: "reit", t: "REIT" },
    { v: "invit", t: "InvIT" }, { v: "etf", t: "ETF" }
  ];
  var CAS_TYPE_CLASS = { EQ: "equity", EQUITY: "equity", MF: "mf", BND: "bond", BOND: "bond", NCD: "bond", ETF: "etf", REIT: "reit", INVIT: "invit", GOLD: "etf" };
  var casRows = null;   // parsed + working rows for the open import session
  var casSourceLabel = "";

  function casNum(s) {
    if (s == null) return null;
    var n = parseFloat(String(s).replace(/,/g, "").trim());
    return isFinite(n) ? n : null;
  }
  function ensureCasAccount() {
    if (!(D.accounts || []).some(function (a) { return a.id === CAS_ACCT.id; })) {
      var c = { id: CAS_ACCT.id, broker: CAS_ACCT.broker, depository: CAS_ACCT.depository, type: CAS_ACCT.type, lastSync: nowStamp() };
      (D.accounts = D.accounts || []).push(c);
    }
  }

  /* --- parser registry: each parser detects its format and returns raw rows.
     Add NSDL/CDSL by registering another parser with detect()+parse(); the
     rest of the pipeline is format-agnostic.                                  */
  var CAS_PARSERS = [];
  function registerCASParser(p) { CAS_PARSERS.push(p); }
  function pickCASParser(text) {
    for (var i = 0; i < CAS_PARSERS.length; i++) {
      try { if (CAS_PARSERS[i].detect(text)) return CAS_PARSERS[i]; } catch (e) { /* try next */ }
    }
    return CAS_PARSERS[0] || null;
  }
  // Generic ISIN-row parser — CAMS/KFintech CAS and depository dumps where each
  // holding line begins with an ISIN. Prefers 2+-space columns (clean text);
  // falls back to a whitespace-tolerant regex for messy PDF-extracted text.
  registerCASParser({
    id: "isin-rows", label: "CAMS / KFintech / Depository CAS",
    detect: function (t) { return /IN[EF][0-9A-Z]{9}/.test(t); },
    parse: function (text) {
      var rows = casLineRows(text);
      if (!rows.length) rows = casRegexRows(text);
      return rows;
    }
  });
  function casLineRows(text) {
    var rows = [];
    String(text).split(/\r?\n/).forEach(function (line) {
      var t = line.replace(/ /g, " ").trim();
      var m = /^(IN[EF][0-9A-Z]{9,10})\b/.exec(t);
      if (!m) return;
      var cols = t.slice(m[0].length).trim().split(/\s{2,}|\t+/).filter(Boolean);
      rows.push({ isin: m[1], name: cols[0] || "", type: (cols[1] || "").toUpperCase(), qty: casNum(cols[2]), value: casNum(cols[3]), raw: t });
    });
    return rows;
  }
  function casRegexRows(text) {
    var rows = [], re = /(IN[EF][0-9A-Z]{9,10})\s+(.+?)\s+(EQ|EQUITY|MF|BND|BOND|NCD|ETF|REIT|INVIT|GOLD)\s+([\d.,]+)\s+([\d.,]+)/gi, m;
    var flat = String(text).replace(/\s+/g, " ");
    while ((m = re.exec(flat))) {
      rows.push({ isin: m[1], name: m[2].trim(), type: m[3].toUpperCase(), qty: casNum(m[4]), value: casNum(m[5]), raw: m[0] });
    }
    return rows;
  }

  /* --- instrument resolution against the ISIN master (+ a name fallback) --- */
  var _casMaster = null;
  function instrumentMaster() {
    if (_casMaster) return _casMaster;
    var seen = {}, out = [];
    (D.users || []).forEach(function (u) {
      (u.holdings || []).forEach(function (h) {
        if (h.assetClass === "cash" || seen[h.symbol]) return;
        seen[h.symbol] = 1;
        out.push({ symbol: h.symbol, name: h.name, assetClass: h.assetClass, sector: h.sector, ltp: h.ltp, dayChangePct: h.dayChangePct });
      });
    });
    _casMaster = out; return out;
  }
  function normName(s) {
    return String(s || "").toLowerCase().replace(/\b(ltd|limited|the|fund|direct|growth|plan|india)\b/g, "").replace(/[^a-z0-9]/g, "");
  }
  function resolveInstrument(row) {
    var map = D.isinMap || {};
    if (row.isin && map[row.isin]) return map[row.isin];
    var norm = normName(row.name);
    if (norm) {
      var hit = instrumentMaster().filter(function (x) { return normName(x.name) === norm; })[0];
      if (hit) return { symbol: hit.symbol, name: hit.name, assetClass: hit.assetClass, sector: hit.sector };
    }
    return null;
  }
  function slugSym(name) { return String(name || "NEW").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || "NEW"; }
  function symbolHeld(sym) { return allHoldings().some(function (h) { return h.symbol === sym; }); }
  function ltpForSymbol(sym) {
    var h = instrumentMaster().filter(function (x) { return x.symbol === sym; })[0];
    return h ? h.ltp : null;
  }
  function dayChangeForSymbol(sym) {
    var h = instrumentMaster().filter(function (x) { return x.symbol === sym; })[0];
    return h && h.dayChangePct != null ? h.dayChangePct : 0;
  }

  /* --- classify the working rows into the four import buckets -------------- */
  function casPlan() {
    var plan = { imported: [], duplicates: [], unknown: [], errors: [] };
    (casRows || []).forEach(function (r) {
      var qty = r.correctedQty != null ? r.correctedQty : r.qty;
      if (qty == null || qty <= 0) { r._bucket = "errors"; plan.errors.push(r); return; }
      var resolved = r.resolved;
      var cls = r.correctedClass || (resolved && resolved.assetClass) || null;
      if (!resolved && !r.correctedClass) { r._bucket = "unknown"; plan.unknown.push(r); return; }
      var symbol = (resolved && resolved.symbol) || slugSym(r.name);
      r._built = { symbol: symbol, cls: cls, qty: qty, resolved: resolved };
      if (symbolHeld(symbol)) { r._bucket = "duplicates"; plan.duplicates.push(r); }
      else { r._bucket = "imported"; plan.imported.push(r); }
    });
    return plan;
  }
  function casToHolding(r) {
    var b = r._built, qty = b.qty;
    var value = r.correctedValue != null ? r.correctedValue : r.value;
    var price = (value != null && qty) ? value / qty : (ltpForSymbol(b.symbol) || 0);
    var meta = b.resolved || {};
    var ltp = ltpForSymbol(b.symbol) || price;
    return {
      id: "cas_" + b.symbol + "_" + Math.random().toString(36).slice(2, 7),
      accountId: CAS_ACCT.id, symbol: b.symbol,
      name: meta.name || r.name || b.symbol,
      assetClass: b.cls, sector: meta.sector || "Other",
      qty: qty, avgPrice: price, ltp: ltp,
      dayChangePct: dayChangeForSymbol(b.symbol), source: "cas"
    };
  }

  /* --- entry point card on the dashboard ---------------------------------- */
  function renderCasEntry() {
    var host = $("cas-import"); if (!host) return;
    var n = (state.importedHoldings || []).length;
    host.innerHTML =
      '<div class="cas-entry">' +
        '<div class="cas-entry-txt"><h3>Import a CAS statement</h3>' +
          '<p>Upload your CAMS / KFintech or NSDL/CDSL Consolidated Account Statement (PDF) to pull in holdings this app hasn’t seen yet. You review everything before anything is added.' +
          (n ? " <b>" + n + "</b> holding" + (n === 1 ? "" : "s") + " currently imported." : "") + "</p></div>" +
        '<button id="cas-import-btn" class="btn btn-primary" type="button">+ Import CAS</button>' +
      "</div>";
    var b = $("cas-import-btn"); if (b) b.addEventListener("click", openCasImport);
  }

  /* --- step 1: upload / sample / paste ------------------------------------ */
  function openCasImport() {
    var body = '<div class="cas-modal"><h2 style="margin:0;">Import CAS statement</h2>' +
      casSteps("upload") +
      '<p class="gw-note">NiveshOS reads the statement locally in your browser — nothing is uploaded to a server. We support CAMS/KFintech and NSDL/CDSL formats; unrecognised rows are flagged for you to fix before anything merges.</p>' +
      '<div class="cas-drop" id="cas-drop">' +
        '<div class="cas-drop-icon" aria-hidden="true">' + ic("file") + "</div>" +
        '<div class="cas-drop-main">Choose your CAS PDF</div>' +
        '<div class="cas-drop-sub">PDF, or a plain-text / CSV export</div>' +
        '<input id="cas-file" type="file" accept="application/pdf,.pdf,.txt,.csv,text/plain" hidden>' +
        '<button id="cas-pick" class="btn btn-primary" type="button">Choose file…</button>' +
      "</div>" +
      '<div class="cas-alt"><button id="cas-sample" class="btn btn-ghost" type="button">Use a sample CAS</button>' +
        '<button id="cas-paste-toggle" class="btn btn-ghost" type="button">Paste text instead</button></div>' +
      '<div id="cas-paste-wrap" hidden><textarea id="cas-paste" class="cas-paste" rows="6" placeholder="Paste the holdings section of your CAS here…"></textarea>' +
        '<button id="cas-paste-go" class="btn btn-primary" type="button">Parse pasted text</button></div>' +
      '<div id="cas-status" class="cas-status" hidden></div>' +
      '<div class="gw-actions"><button id="cas-cancel" class="btn btn-ghost">Cancel</button></div></div>';
    openModal(body);
    var pick = $("cas-pick"), file = $("cas-file");
    if (pick && file) pick.addEventListener("click", function () { file.click(); });
    if (file) file.addEventListener("change", function () { if (file.files && file.files[0]) handleCasFile(file.files[0]); });
    var samp = $("cas-sample");
    if (samp) samp.addEventListener("click", function () { parseAndReview(D.sampleCAS || "", "Sample CAS (demo)"); });
    var pt = $("cas-paste-toggle"), pw = $("cas-paste-wrap");
    if (pt && pw) pt.addEventListener("click", function () { pw.hidden = !pw.hidden; });
    var pg = $("cas-paste-go");
    if (pg) pg.addEventListener("click", function () {
      var v = ($("cas-paste") || {}).value || "";
      if (v.trim()) parseAndReview(v, "Pasted text"); else casStatus("Paste some statement text first.", "warn");
    });
    var c = $("cas-cancel"); if (c) c.addEventListener("click", closeModal);
  }
  function casStatus(msg, kind) {
    var s = $("cas-status"); if (!s) return;
    s.hidden = false; s.className = "cas-status cas-status-" + (kind || "info"); s.innerHTML = msg;
  }
  function handleCasFile(f) {
    casStatus("Reading “" + esc(f.name) + "”…", "info");
    var isPdf = /\.pdf$/i.test(f.name) || f.type === "application/pdf";
    if (!isPdf) {
      var fr = new FileReader();
      fr.onload = function () { parseAndReview(String(fr.result || ""), f.name); };
      fr.onerror = function () { casStatus("Couldn’t read that file.", "warn"); };
      fr.readAsText(f);
      return;
    }
    var rd = new FileReader();
    rd.onload = function () {
      extractPdfText(rd.result).then(function (text) {
        if (!text || !/IN[EF][0-9A-Z]{9}/.test(text)) {
          casStatus("Couldn’t read holdings from this PDF (it may be scanned or password-protected). Try <b>Use a sample CAS</b> or paste the holdings text.", "warn");
          return;
        }
        parseAndReview(text, f.name);
      });
    };
    rd.onerror = function () { casStatus("Couldn’t read that PDF.", "warn"); };
    rd.readAsArrayBuffer(f);
  }

  /* --- best-effort PDF text extraction (zero-dependency) ------------------
     Uses the browser-native DecompressionStream to inflate FlateDecode content
     streams, then pulls text from ( )Tj / [ ]TJ operators. Not a full PDF
     engine — enough for text-based statements; anything else falls back to the
     sample / paste path. Always resolves (never rejects).                     */
  function extractPdfText(buf) {
    return new Promise(function (resolve) {
      try {
        var bytes = new Uint8Array(buf), latin = "";
        for (var i = 0; i < bytes.length; i++) latin += String.fromCharCode(bytes[i]);
        var segs = [], re = /stream\r?\n/g, m;
        while ((m = re.exec(latin))) {
          var start = m.index + m[0].length, end = latin.indexOf("endstream", start);
          if (end > start) segs.push(bytes.subarray(start, end));
        }
        if (typeof DecompressionStream === "undefined" || !segs.length) { resolve(pdfOps(latin)); return; }
        var pending = segs.length, decoded = [];
        segs.forEach(function (s, idx) {
          casInflate(s).then(function (str) { decoded[idx] = str; })
            .catch(function () { decoded[idx] = ""; })
            .then(function () { if (--pending === 0) resolve(pdfOps(decoded.join(" ")) || pdfOps(latin)); });
        });
      } catch (e) { resolve(""); }
    });
  }
  function casInflate(u8) {
    function run(fmt) {
      var ds = new DecompressionStream(fmt);
      return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function (ab) {
        var b = new Uint8Array(ab), s = "";
        for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
        return s;
      });
    }
    return run("deflate").catch(function () { return run("deflate-raw"); });
  }
  function pdfStr(s) { return String(s).replace(/\\([nrt()\\])/g, function (_, c) { return c === "n" ? " " : c === "r" ? " " : c === "t" ? " " : c; }); }
  function pdfOps(content) {
    var out = [];
    content.replace(/\(((?:\\.|[^\\()])*)\)\s*Tj/g, function (_, s) { out.push(pdfStr(s)); return _; });
    content.replace(/\[((?:[^\]\\]|\\.)*)\]\s*TJ/g, function (_, arr) {
      var parts = []; arr.replace(/\(((?:\\.|[^\\()])*)\)/g, function (__, s) { parts.push(pdfStr(s)); return __; });
      out.push(parts.join(""));
      return _;
    });
    return out.join(" ");
  }

  /* --- step 2: parse + review --------------------------------------------- */
  function parseAndReview(text, sourceLabel) {
    casSourceLabel = sourceLabel || "CAS";
    var parser = pickCASParser(text);
    var rows = parser ? parser.parse(text) : [];
    if (!rows.length) {
      casStatus("No holdings found in that statement. Try <b>Use a sample CAS</b> or paste the holdings table.", "warn");
      return;
    }
    rows.forEach(function (r) { r.resolved = resolveInstrument(r); r.correctedClass = null; r.correctedQty = null; r.correctedValue = null; });
    casRows = rows;
    renderCasReview();
  }

  function casSummaryStrip(plan) {
    var cells = [
      { n: plan.imported.length, label: "To import", tone: "good" },
      { n: plan.duplicates.length, label: "Duplicates", tone: "neutral" },
      { n: plan.unknown.length, label: "Unknown", tone: "warn" },
      { n: plan.errors.length, label: "Errors", tone: "critical" }
    ];
    return '<div class="cas-summary">' + cells.map(function (c) {
      return '<div class="cas-sum-cell cas-sum-' + c.tone + '"><div class="cas-sum-n">' + c.n + "</div>" +
        '<div class="cas-sum-l">' + c.label + "</div></div>";
    }).join("") + "</div>";
  }

  function casBucketBadge(r) {
    if (r._bucket === "errors") return '<span class="badge badge-critical">Error</span>';
    if (r._bucket === "unknown") return '<span class="badge badge-warn">Unknown</span>';
    if (r._bucket === "duplicates") return '<span class="badge badge-neutral">Duplicate</span>';
    return '<span class="badge badge-good">New</span>';
  }
  function casFixCell(r, idx) {
    if (r._bucket === "unknown") {
      var suggest = CAS_TYPE_CLASS[r.type] || "";
      var opts = '<option value="">— Skip —</option>' + CAS_CLASS_OPTS.map(function (o) {
        return '<option value="' + o.v + '"' + (r.correctedClass === o.v ? " selected" : (!r.correctedClass && o.v === suggest ? "" : "")) + ">" + esc(o.t) + "</option>";
      }).join("");
      return '<select class="cas-fix-class tv-select" data-idx="' + idx + '" aria-label="Assign asset class">' + opts + "</select>";
    }
    if (r._bucket === "errors") {
      var q = r.correctedQty != null ? r.correctedQty : "";
      return '<input class="cas-fix-qty gw-qty-input" type="number" min="1" step="any" value="' + q + '" data-idx="' + idx + '" placeholder="Qty" aria-label="Enter quantity">';
    }
    return '<span class="cas-fix-none">—</span>';
  }

  function renderCasReview() {
    var plan = casPlan();
    var rowsHtml = casRows.map(function (r, idx) {
      var qty = r.correctedQty != null ? r.correctedQty : r.qty;
      var val = r.correctedValue != null ? r.correctedValue : r.value;
      var nm = (r.resolved && r.resolved.name) || r.name || "—";
      return "<tr class=\"cas-row cas-row-" + r._bucket + "\">" +
        "<td><b>" + esc(nm) + "</b><div class=\"cas-isin\">" + esc(r.isin || "") + (r.type ? " · " + esc(r.type) : "") + "</div></td>" +
        '<td class="num">' + (qty != null ? _inr.format(qty) : "—") + "</td>" +
        '<td class="num">' + (val != null ? fmt(val) : "—") + "</td>" +
        "<td>" + casBucketBadge(r) + "</td>" +
        "<td>" + casFixCell(r, idx) + "</td></tr>";
    }).join("");
    var canImport = plan.imported.length > 0;
    var body = '<div class="cas-modal cas-review"><h2 style="margin:0;">Review — ' + esc(casSourceLabel) + "</h2>" +
      casSteps("review") +
      casSummaryStrip(plan) +
      '<p class="gw-note">Check what will be added. <b>Duplicates</b> are already in your portfolio and are consolidated (never overwritten). Give <b>Unknown</b> rows an asset class, or fix an <b>Error</b> row’s quantity, to include them. Anything left as “Skip” is ignored.</p>' +
      '<div class="cas-table-wrap"><table class="data-table cas-table"><thead><tr>' +
        "<th>Instrument</th><th class=\"num\">Qty</th><th class=\"num\">Value</th><th>Status</th><th>Fix</th>" +
      "</tr></thead><tbody>" + rowsHtml + "</tbody></table></div>" +
      '<div class="gw-actions"><button id="cas-back" class="btn btn-ghost">← Back</button>' +
        '<button id="cas-confirm" class="btn btn-primary"' + (canImport ? "" : " disabled") + ">Import " + plan.imported.length + " holding" + (plan.imported.length === 1 ? "" : "s") + "</button></div></div>";
    openModal(body);
    Array.prototype.forEach.call(document.querySelectorAll(".cas-fix-class"), function (sel) {
      sel.addEventListener("change", function () {
        casRows[parseInt(sel.getAttribute("data-idx"), 10)].correctedClass = sel.value || null;
        renderCasReview();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".cas-fix-qty"), function (inp) {
      inp.addEventListener("change", function () {
        var v = casNum(inp.value);
        casRows[parseInt(inp.getAttribute("data-idx"), 10)].correctedQty = (v && v > 0) ? v : null;
        renderCasReview();
      });
    });
    var bk = $("cas-back"); if (bk) bk.addEventListener("click", openCasImport);
    var cf = $("cas-confirm"); if (cf) cf.addEventListener("click", confirmCasImport);
  }

  /* --- step 3: merge + summary -------------------------------------------- */
  function confirmCasImport() {
    var plan = casPlan();
    if (!plan.imported.length) return;                 // nothing new — guard
    var classesBefore = diversifiedClassCount();
    var topSecBefore = (sectorExposure().filter(function (s) { return s.sector !== "Diversified"; })[0] || { pct: 0 }).pct;
    ensureCasAccount();
    var added = plan.imported.map(casToHolding);
    state.importedHoldings = (state.importedHoldings || []).concat(added);
    save("importedHoldings");
    var classesAfter = diversifiedClassCount();
    var topSecAfter = (sectorExposure().filter(function (s) { return s.sector !== "Diversified"; })[0] || { pct: 0 }).pct;
    if (classesAfter > classesBefore || topSecAfter < topSecBefore - 1) {
      logAlert("diversify", "info", "Portfolio more diversified",
        (classesAfter > classesBefore ? "Asset-class spread rose to <b>" + classesAfter + "</b> classes" : "Top-sector weight eased to <b>" + topSecAfter.toFixed(1) + "%</b>") +
        " after the import — concentration risk is lower.", "analytics");
    }
    audit("import", "CAS import (" + casSourceLabel + "): " + added.length + " holding(s) merged, " +
      plan.duplicates.length + " duplicate(s) consolidated, " + plan.unknown.length + " unknown, " + plan.errors.length + " error(s).");
    // recompute every analytic surface off the new holdings
    renderDashboard();
    if (isActive("analytics")) renderAnalytics();
    if (isActive("invest")) renderInvest();
    if (isActive("discover")) paintDiscover();
    renderCasSummary(plan, added);
    toast("CAS imported — " + added.length + " holding(s) added.", "success");
  }

  function renderCasSummary(plan, added) {
    var addedRows = added.length ? added.map(function (h) {
      return '<div class="cas-added-row"><span><b>' + esc(h.name) + "</b> <span class=\"cas-isin\">" + esc(TYPE_LABEL[h.assetClass] || h.assetClass) + "</span></span>" +
        '<b class="num">' + fmt(hv(h)) + "</b></div>";
    }).join("") : '<p style="color:var(--ink-muted);font-size:13px;">No new holdings were added.</p>';
    var body = '<div class="cas-modal"><div class="gw-modal-head"><h2 style="margin:0;">Import complete</h2>' +
      '<span class="badge badge-good">' + ic("check") + ' Merged</span></div>' +
      casSteps("done") +
      casSummaryStrip(plan) +
      '<div class="cas-added-list">' + addedRows + "</div>" +
      '<p class="gw-note">Your dashboard, analytics and health score have been recalculated to include these holdings. The import is logged in Trust → Audit trail. Educational demo — no live brokerage data was accessed.</p>' +
      '<div class="gw-actions"><button id="cas-done" class="btn btn-primary">Done</button></div></div>';
    openModal(body);
    var d = $("cas-done"); if (d) d.addEventListener("click", function () { closeModal(); switchPanel("dashboard"); });
  }

  var CAS_STEPS = [{ k: "upload", t: "Upload" }, { k: "review", t: "Review" }, { k: "done", t: "Merge" }];
  function casSteps(active) {
    var reached = true;
    return '<div class="gw-steps">' + CAS_STEPS.map(function (s) {
      var isA = s.k === active, cls = isA ? "gw-step active" : (reached ? "gw-step done" : "gw-step");
      if (isA) reached = false;
      return '<span class="' + cls + '">' + esc(s.t) + "</span>";
    }).join('<span class="gw-step-sep">›</span>') + "</div>";
  }

  /* ====================================================== GOAL-BASED PLANNER
     Plan financial goals (retirement, emergency fund, education, home, vacation,
     vehicle) against the live portfolio. Every number is computed from plain,
     visible formulas — no black box:
       Target corpus     = today's cost × (1 + inflation)^years   (future value)
       Suggested mix     = a horizon glide path (long → equity, short → cash)
       Expected return   = the mix's blended return, shown to the user
       Monthly SIP       = the annuity payment that closes the shortfall
       Progress          = what you've earmarked ÷ the target corpus
     "Use existing portfolio" links a goal to a % of net worth, so progress
     tracks the real book. Inputs are stored in state.goals; everything else is
     derived on render so the plan always reflects current prices.             */
  var GOAL_TYPES = [
    { type: "retirement", label: "Retirement",      icon: "palm",     defTarget: 20000000, defYears: 25 },
    { type: "emergency",  label: "Emergency Fund",   icon: "lifebuoy", defTarget: 300000,   defYears: 1 },
    { type: "education",  label: "Child Education",  icon: "grad",     defTarget: 4000000,  defYears: 15 },
    { type: "home",       label: "Home Purchase",    icon: "home",     defTarget: 8000000,  defYears: 7 },
    { type: "vacation",   label: "Vacation",         icon: "umbrella", defTarget: 400000,   defYears: 2 },
    { type: "vehicle",    label: "Vehicle",          icon: "car",      defTarget: 1200000,  defYears: 3 }
  ];
  var GOAL_ALLOC_ORDER = ["Equity", "Debt", "Gold", "Cash"];
  var GOAL_RET = { Equity: 11, Debt: 7, Gold: 7.5, Cash: 4 };   // assumed annual %, shown to the user
  var NOW_YEAR = parseInt(TODAY.slice(0, 4), 10);

  function goalMeta(type) { return GOAL_TYPES.filter(function (t) { return t.type === type; })[0] || GOAL_TYPES[0]; }
  function gid() { return "g_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function defaultSeedGoals() {
    // two universally-relevant starters, linked to the portfolio so they're live
    return [
      { id: gid(), type: "emergency",  name: "Emergency Fund", targetToday: 300000,   years: 1,  inflation: 6, portfolioPct: 0,  currentSaved: 200000 },
      { id: gid(), type: "retirement", name: "Retirement",     targetToday: 5000000,  years: 25, inflation: 6, portfolioPct: 25, currentSaved: 0 }
    ];
  }

  // horizon glide path — longer to go, more growth; emergency fund stays liquid
  function goalAlloc(type, years) {
    if (type === "emergency") return { Equity: 0, Debt: 40, Gold: 0, Cash: 60 };
    if (years >= 12) return { Equity: 70, Debt: 20, Gold: 7, Cash: 3 };
    if (years >= 8)  return { Equity: 60, Debt: 28, Gold: 8, Cash: 4 };
    if (years >= 5)  return { Equity: 50, Debt: 35, Gold: 10, Cash: 5 };
    if (years >= 3)  return { Equity: 35, Debt: 45, Gold: 12, Cash: 8 };
    if (years >= 1)  return { Equity: 20, Debt: 50, Gold: 10, Cash: 20 };
    return { Equity: 0, Debt: 30, Gold: 0, Cash: 70 };
  }
  function blendedReturn(a) {
    var t = 0, w = 0;
    GOAL_ALLOC_ORDER.forEach(function (k) { t += (a[k] || 0) * (GOAL_RET[k] || 0); w += (a[k] || 0); });
    return w ? t / w : 0;
  }
  function goalSaved(g) {
    return g.portfolioPct > 0 ? netWorth() * g.portfolioPct / 100 : (g.currentSaved || 0);
  }
  function goalCompute(g) {
    var years = Math.max(0, g.years || 0);
    var infl = (g.inflation != null ? g.inflation : 6) / 100;
    var targetCorpus = (g.targetToday || 0) * Math.pow(1 + infl, years);
    var alloc = goalAlloc(g.type, years);
    var rAnnual = blendedReturn(alloc);
    var r = rAnnual / 100;
    var saved = goalSaved(g);
    var n = Math.round(years * 12), i = r / 12;
    var existingFV = saved * Math.pow(1 + i, n);
    var gap = Math.max(0, targetCorpus - existingFV);
    var sip = n <= 0 ? gap : (i === 0 ? gap / n : gap * i / (Math.pow(1 + i, n) - 1));
    // progress = how much of the target your current savings are projected to
    // cover (their future value ÷ corpus). Consistent with the SIP, which funds
    // exactly the remaining gap — so 100% projected ⇒ ₹0/month needed.
    var progress = targetCorpus > 0 ? Math.min(100, existingFV / targetCorpus * 100) : 0;
    return {
      years: years, infl: g.inflation != null ? g.inflation : 6, targetToday: g.targetToday || 0,
      targetCorpus: targetCorpus, alloc: alloc, rAnnual: rAnnual, saved: saved,
      existingFV: existingFV, gap: gap, sip: sip, progress: progress, n: n, i: i
    };
  }
  function goalStatus(pct) {
    if (pct >= 100) return { label: "Achieved", status: "good" };
    if (pct >= 60) return { label: "On track", status: "good" };
    if (pct >= 30) return { label: "Building", status: "warn" };
    return { label: "Needs attention", status: "serious" };
  }
  function statusColor(s) { return s === "good" ? "var(--good)" : s === "warn" ? "var(--warn)" : "var(--serious)"; }

  /* --- small reusable SVG bits -------------------------------------------- */
  function goalRing(pct, color, size) {
    size = size || 92;
    var sw = 9, r = size / 2 - sw, C = 2 * Math.PI * r, cx = size / 2;
    var dash = Math.max(0, Math.min(100, pct)) / 100 * C;
    return '<svg class="goal-ring" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Goal progress ' + Math.round(pct) + '%">' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="var(--grid)" stroke-width="' + sw + '"></circle>' +
      '<circle class="goal-ring-fill" cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw +
        '" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(2) + ' ' + (C - dash).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cx + ')"></circle>' +
      '<text x="' + cx + '" y="' + (cx + 5) + '" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="700">' + Math.round(pct) + '%</text></svg>';
  }
  function goalAllocBar(alloc, withText) {
    var out = '<div class="goal-abar">';
    GOAL_ALLOC_ORDER.forEach(function (k, i) {
      var w = alloc[k] || 0; if (w <= 0) return;
      out += '<span class="goal-abar-seg" style="width:' + w + '%;background:' + sv(i) + ';" title="' + esc(k) + ' ' + w + '%">' +
        (withText && w >= 12 ? '<span class="goal-abar-t">' + w + '%</span>' : '') + '</span>';
    });
    return out + '</div>';
  }
  function goalAllocLegend() {
    return '<ul class="goal-alloc-legend">' + GOAL_ALLOC_ORDER.map(function (k, i) {
      return '<li><span class="dot" style="background:' + sv(i) + ';"></span>' + esc(k) + ' <span class="goal-alloc-r">~' + GOAL_RET[k] + '%</span></li>';
    }).join("") + '</ul>';
  }

  /* --- panel + card render ------------------------------------------------ */
  function renderGoals() {
    renderGoalsHead();
    var host = $("goals-grid"); if (!host) return;
    var goals = state.goals || [];
    if (!goals.length) {
      host.innerHTML = '<div class="goals-empty"><div class="goals-empty-icon">' + ic("target") + "</div>" +
        '<h3>Plan your first goal</h3><p>Turn “₹ someday” into a monthly number. Pick a goal and NiveshOS shows the target corpus, the SIP to get there and a suggested mix.</p>' +
        '<button id="goals-empty-add" class="btn btn-primary" type="button">+ Add a goal</button></div>';
      var ea = $("goals-empty-add"); if (ea) ea.addEventListener("click", function () { openGoalForm(null); });
      return;
    }
    host.innerHTML = goals.map(goalCard).join("");
    Array.prototype.forEach.call(host.querySelectorAll(".goal-card"), function (card) {
      var id = card.getAttribute("data-goal");
      card.addEventListener("click", function () { openGoalDetail(id); });
      var ed = card.querySelector(".goal-edit"), dl = card.querySelector(".goal-del");
      if (ed) ed.addEventListener("click", function (e) { e.stopPropagation(); openGoalForm(id); });
      if (dl) dl.addEventListener("click", function (e) { e.stopPropagation(); deleteGoal(id); });
    });
  }
  function renderGoalsHead() {
    var host = $("goals-summary"); if (!host) return;
    var goals = state.goals || [];
    var totalSip = 0, onTrack = 0;
    goals.forEach(function (g) { var c = goalCompute(g); totalSip += c.sip; if (c.progress >= 60) onTrack++; });
    host.innerHTML = '<div class="goals-head">' +
      '<div class="goals-head-stats">' +
        goalStat(goals.length, "Active goals") +
        goalStat(onTrack + " / " + goals.length, "On track") +
        goalStat(fmt(totalSip) + "<span class=\"goals-perm\">/mo</span>", "Total monthly plan") +
      '</div>' +
      '<button id="goals-add" class="btn btn-primary" type="button">+ Add goal</button></div>';
    var a = $("goals-add"); if (a) a.addEventListener("click", function () { openGoalForm(null); });
  }
  function goalStat(val, label) {
    return '<div class="goals-stat"><div class="goals-stat-v">' + val + '</div><div class="goals-stat-l">' + esc(label) + '</div></div>';
  }
  function goalCard(g) {
    var m = goalMeta(g.type), c = goalCompute(g), st = goalStatus(c.progress), col = statusColor(st.status);
    return '<div class="goal-card" data-goal="' + esc(g.id) + '" tabindex="0" role="button">' +
      '<div class="goal-card-actions">' +
        '<button class="goal-edit" type="button" aria-label="Edit goal" title="Edit">' + ic("pencil") + "</button>" +
        '<button class="goal-del" type="button" aria-label="Delete goal" title="Delete">' + ic("trash") + "</button></div>" +
      '<div class="goal-card-head"><span class="goal-emoji" aria-hidden="true">' + ic(m.icon) + "</span>" +
        '<div class="goal-card-title"><div class="goal-name">' + esc(g.name) + '</div>' +
        '<div class="goal-sub">' + fmt(c.targetCorpus) + ' · ' + (c.years > 0 ? c.years + ' yr' + (c.years === 1 ? '' : 's') + ' left' : 'due now') + '</div></div>' +
        '<span class="badge badge-' + st.status + '">' + st.label + '</span></div>' +
      '<div class="goal-card-body">' + goalRing(c.progress, col) +
        '<div class="goal-metrics">' +
          '<div class="goal-metric"><span>Monthly SIP</span><b>' + fmt(c.sip) + '</b></div>' +
          '<div class="goal-metric"><span>Saved so far</span><b>' + fmt(c.saved) + '</b></div>' +
          '<div class="goal-metric"><span>Expected return</span><b>~' + c.rAnnual.toFixed(1) + '%</b></div>' +
        '</div></div>' +
      '<div class="goal-alloc-mini"><span class="goal-alloc-lbl">Suggested mix</span>' + goalAllocBar(c.alloc, false) + '</div>' +
      '</div>';
  }

  /* --- dashboard summary card --------------------------------------------- */
  function renderGoalsSummary() {
    var host = $("goals-summary-dash"); if (!host) return;
    var goals = state.goals || [];
    if (!goals.length) {
      host.innerHTML = '<div class="goals-dash-empty"><div><h3 style="margin:0 0 3px;">Goal planner</h3>' +
        '<p style="margin:0;font-size:12.5px;color:var(--ink-muted);">Set a target — retirement, a home, an emergency fund — and see the monthly plan.</p></div>' +
        '<button id="goals-dash-add" class="btn btn-primary" type="button">Plan a goal →</button></div>';
      var a = $("goals-dash-add"); if (a) a.addEventListener("click", function () { switchPanel("goals"); openGoalForm(null); });
      return;
    }
    var totalSip = goals.reduce(function (s, g) { return s + goalCompute(g).sip; }, 0);
    var rows = goals.slice(0, 3).map(function (g) {
      var m = goalMeta(g.type), c = goalCompute(g), st = goalStatus(c.progress), col = statusColor(st.status);
      return '<div class="goals-dash-row" data-goal="' + esc(g.id) + '">' +
        '<span class="goals-dash-emoji" aria-hidden="true">' + ic(m.icon) + "</span>" +
        '<span class="goals-dash-name">' + esc(g.name) + '</span>' +
        '<span class="goals-dash-track"><span style="width:' + c.progress.toFixed(0) + '%;background:' + col + ';"></span></span>' +
        '<span class="goals-dash-pct">' + Math.round(c.progress) + '%</span></div>';
    }).join("");
    host.innerHTML = '<div class="goals-dash-head"><h3 style="margin:0;">Your goals</h3>' +
      '<span class="goals-dash-sip">' + fmt(totalSip) + '/mo planned</span></div>' + rows +
      '<button id="goals-dash-open" class="btn-ghost goals-dash-open" type="button">Open Goal Planner →</button>';
    Array.prototype.forEach.call(host.querySelectorAll(".goals-dash-row"), function (r) {
      r.addEventListener("click", function () { switchPanel("goals"); openGoalDetail(r.getAttribute("data-goal")); });
    });
    var o = $("goals-dash-open"); if (o) o.addEventListener("click", function () { switchPanel("goals"); });
  }

  /* --- detail modal: transparent math + interactive projection ------------ */
  function openGoalDetail(id) {
    var g = (state.goals || []).filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    var m = goalMeta(g.type), c = goalCompute(g), st = goalStatus(c.progress), col = statusColor(st.status);
    var steps = [
      "Today’s cost of this goal: <b>" + fmt(c.targetToday) + "</b>",
      "Grown by <b>" + c.infl + "% inflation</b> for <b>" + c.years + " year" + (c.years === 1 ? "" : "s") + "</b> → target corpus <b>" + fmt(c.targetCorpus) + "</b><span class=\"goal-formula\">" + fmt(c.targetToday) + " × (1 + " + (c.infl / 100).toFixed(2) + ")<sup>" + c.years + "</sup></span>",
      "The suggested mix earns about <b>" + c.rAnnual.toFixed(1) + "%</b> a year (blended, below)",
      "You’ve earmarked <b>" + fmt(c.saved) + "</b>" + (g.portfolioPct > 0 ? " (" + g.portfolioPct + "% of your ₹" + _inr.format(Math.round(netWorth())) + " portfolio)" : "") + " → grows to <b>" + fmt(c.existingFV) + "</b>",
      "Shortfall to fund: <b>" + fmt(c.gap) + "</b>",
      "Invest <b>" + fmt(c.sip) + "/month</b> for " + c.years + " year" + (c.years === 1 ? "" : "s") + " to close it<span class=\"goal-formula\">SIP = gap × i ÷ ((1+i)<sup>n</sup> − 1), i = " + c.rAnnual.toFixed(1) + "%/12, n = " + c.n + "</span>"
    ];
    var allocRows = GOAL_ALLOC_ORDER.filter(function (k) { return c.alloc[k] > 0; }).map(function (k, i) {
      var idx = GOAL_ALLOC_ORDER.indexOf(k);
      return '<div class="alloc-row"><span class="alloc-lbl">' + esc(k) + '</span>' +
        '<span class="alloc-track"><span style="width:' + c.alloc[k] + '%;background:' + sv(idx) + ';"></span></span>' +
        '<span class="alloc-pct">' + c.alloc[k] + '%</span></div>';
    }).join("");
    var body = '<div class="goal-detail"><div class="gw-modal-head"><h2 style="margin:0;">' + ic(m.icon) + " " + esc(g.name) + "</h2>" +
      '<span class="badge badge-' + st.status + '">' + st.label + '</span></div>' +
      '<div class="goal-detail-top">' + goalRing(c.progress, col, 116) +
        '<div class="goal-detail-kpis">' +
          goalKpi("Target corpus", fmt(c.targetCorpus), "inflation-adjusted") +
          goalKpi("Monthly SIP", fmt(c.sip), "to stay on plan") +
          goalKpi("Years remaining", c.years + "", "at " + c.infl + "% inflation") +
          goalKpi("Saved so far", fmt(c.saved), "projected to " + fmt(c.existingFV)) +
        '</div></div>' +
      '<div class="goal-section-h">Projected growth</div>' +
      '<div id="goal-projection" class="goal-projection"></div>' +
      '<div class="goal-section-h">How this is calculated</div>' +
      '<ol class="goal-steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join("") + '</ol>' +
      '<div class="goal-section-h">Suggested asset allocation</div>' +
      '<div class="alloc-block">' + allocRows + '</div>' + goalAllocLegend() +
      '<p class="gw-note">A horizon-based suggestion for education — longer goals lean to growth, near-term goals to safety. Not personalised investment advice (SEBI RIA boundary).</p>' +
      '<div class="gw-actions"><button id="goal-explore" class="btn btn-ghost">Explore investments →</button>' +
        '<button id="goal-edit-d" class="btn btn-ghost">Edit</button>' +
        '<button id="goal-close" class="btn btn-primary">Done</button></div></div>';
    openModal(body);
    renderGoalProjection($("goal-projection"), c);
    var ex = $("goal-explore"); if (ex) ex.addEventListener("click", function () { closeModal(); switchPanel("discover"); });
    var ed = $("goal-edit-d"); if (ed) ed.addEventListener("click", function () { openGoalForm(id); });
    var cl = $("goal-close"); if (cl) cl.addEventListener("click", closeModal);
  }
  function goalKpi(label, value, sub) {
    return '<div class="goal-kpi"><div class="goal-kpi-l">' + esc(label) + '</div><div class="goal-kpi-v">' + value + '</div>' +
      '<div class="goal-kpi-s">' + esc(sub) + '</div></div>';
  }

  // corpus growth year-by-year (existing savings compounding + SIP annuity),
  // with the target line — interactive crosshair tooltip.
  function renderGoalProjection(container, c) {
    if (!container) return;
    var yrs = Math.max(1, c.years);
    var pts = [];
    for (var k = 0; k <= yrs; k++) {
      var months = k * 12;
      var fv = c.saved * Math.pow(1 + c.i, months) + (c.i === 0 ? c.sip * months : c.sip * (Math.pow(1 + c.i, months) - 1) / c.i);
      pts.push({ year: NOW_YEAR + k, k: k, v: fv });
    }
    var W = 640, H = 200, pL = 8, pR = 8, pT = 14, pB = 22, iw = W - pL - pR, ih = H - pT - pB;
    var maxV = Math.max(c.targetCorpus, pts[pts.length - 1].v) * 1.08, minV = 0;
    function X(k) { return pL + (k / yrs) * iw; }
    function Y(v) { return pT + (1 - (v - minV) / (maxV - minV)) * ih; }
    var line = pts.map(function (p) { return X(p.k).toFixed(1) + "," + Y(p.v).toFixed(1); });
    var area = "M" + X(0) + "," + (pT + ih) + " L" + line.join(" L") + " L" + X(yrs) + "," + (pT + ih) + " Z";
    var grid = "";
    for (var gg = 0; gg <= 3; gg++) { var gy = pT + gg / 3 * ih; grid += '<line x1="' + pL + '" y1="' + gy + '" x2="' + (W - pR) + '" y2="' + gy + '" stroke="var(--grid)" stroke-width="1"></line>'; }
    var ty = Y(c.targetCorpus);
    var dots = pts.map(function (p) {
      return '<circle class="goal-proj-dot" data-tip="<b>' + p.year + '</b><br>Corpus ' + fmt(p.v) + '" cx="' + X(p.k).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="7" fill="transparent"></circle>' +
        '<circle cx="' + X(p.k).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="2.4" fill="var(--s1)"></circle>';
    }).join("");
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="none" role="img" aria-label="Projected corpus growth">' +
      grid +
      '<line x1="' + pL + '" y1="' + ty.toFixed(1) + '" x2="' + (W - pR) + '" y2="' + ty.toFixed(1) + '" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="5 4"></line>' +
      '<text x="' + (W - pR) + '" y="' + (ty - 5).toFixed(1) + '" text-anchor="end" fill="var(--good)" font-size="10.5">Target ' + fmt(c.targetCorpus) + '</text>' +
      '<path d="' + area + '" fill="var(--s1)" opacity="0.08"></path>' +
      '<path class="anim-line" d="M' + line.join(" L") + '" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round"></path>' +
      dots + '</svg>' +
      '<div class="goal-proj-axis"><span>' + NOW_YEAR + '</span><span>Projected corpus vs target</span><span>' + (NOW_YEAR + yrs) + '</span></div>';
    wireTips(container);
  }

  /* --- add / edit form ---------------------------------------------------- */
  function openGoalForm(id) {
    var editing = !!id;
    var g = editing ? (state.goals || []).filter(function (x) { return x.id === id; })[0] : null;
    if (editing && !g) return;
    var draft = g ? {
      type: g.type, name: g.name, targetToday: g.targetToday, years: g.years,
      inflation: g.inflation != null ? g.inflation : 6, portfolioPct: g.portfolioPct || 0, currentSaved: g.currentSaved || 0
    } : { type: "retirement", name: "", targetToday: null, years: null, inflation: 6, portfolioPct: 0, currentSaved: 0 };
    goalFormBody(draft, editing, id);
  }
  function goalFormBody(d, editing, id) {
    var typeChips = GOAL_TYPES.map(function (t) {
      return '<button type="button" class="goal-type-chip' + (d.type === t.type ? " active" : "") + '" data-type="' + t.type + '">' +
        '<span aria-hidden="true">' + ic(t.icon) + "</span>" + esc(t.label) + "</button>";
    }).join("");
    var meta = goalMeta(d.type);
    var name = d.name || (editing ? "" : meta.label);
    var target = d.targetToday != null ? d.targetToday : meta.defTarget;
    var years = d.years != null ? d.years : meta.defYears;
    var linked = d.portfolioPct > 0;
    var body = '<div class="goal-form"><h2 style="margin:0 0 4px;">' + (editing ? "Edit goal" : "New goal") + '</h2>' +
      '<div class="goal-type-grid">' + typeChips + '</div>' +
      '<label class="goal-field"><span>Goal name</span><input id="gf-name" type="text" value="' + esc(name) + '" placeholder="e.g. Retirement"></label>' +
      '<div class="goal-field-row">' +
        '<label class="goal-field"><span>Target amount (today’s cost)</span><input id="gf-target" type="number" min="0" step="1000" value="' + target + '"></label>' +
        '<label class="goal-field goal-field-sm"><span>Years to goal</span><input id="gf-years" type="number" min="0" step="1" value="' + years + '"></label>' +
      '</div>' +
      '<label class="goal-field goal-field-sm"><span>Inflation assumption (%/yr)</span><input id="gf-infl" type="number" min="0" step="0.5" value="' + d.inflation + '"></label>' +
      '<div class="goal-fund">' +
        '<label class="goal-fund-opt"><input type="radio" name="gf-fund" value="portfolio"' + (linked ? " checked" : "") + '> Fund from my portfolio ' +
          '<input id="gf-pct" type="number" min="0" max="100" step="1" value="' + (linked ? d.portfolioPct : 20) + '" class="goal-pct-input"> % of ₹' + _inr.format(Math.round(netWorth())) + '</label>' +
        '<label class="goal-fund-opt"><input type="radio" name="gf-fund" value="manual"' + (linked ? "" : " checked") + '> I’ve saved ' +
          '<input id="gf-saved" type="number" min="0" step="1000" value="' + (d.currentSaved || 0) + '" class="goal-saved-input"> already</label>' +
      '</div>' +
      '<p id="gf-err" class="assess-err" hidden>Give the goal a name, a target above ₹0 and a year count.</p>' +
      '<div class="gw-actions">' + (editing ? '<button id="gf-delete" class="btn btn-danger">Delete</button>' : '<button id="gf-cancel" class="btn btn-ghost">Cancel</button>') +
        '<button id="gf-save" class="btn btn-primary">' + (editing ? "Save changes" : "Create goal") + '</button></div></div>';
    openModal(body);
    Array.prototype.forEach.call(document.querySelectorAll(".goal-type-chip"), function (ch) {
      ch.addEventListener("click", function () {
        // switch type, refresh preset name/target/years if untouched-ish
        var t = ch.getAttribute("data-type"), tm = goalMeta(t);
        var cur = collectGoalForm();
        goalFormBody({ type: t, name: (cur.name && cur.name !== meta.label) ? cur.name : tm.label,
          targetToday: cur.targetToday || tm.defTarget, years: cur.years != null ? cur.years : tm.defYears,
          inflation: cur.inflation, portfolioPct: cur.portfolioPct, currentSaved: cur.currentSaved }, editing, id);
      });
    });
    var sv2 = $("gf-save"); if (sv2) sv2.addEventListener("click", function () { saveGoal(editing, id, d.type); });
    var cn = $("gf-cancel"); if (cn) cn.addEventListener("click", closeModal);
    var dl = $("gf-delete"); if (dl) dl.addEventListener("click", function () { deleteGoal(id); });
  }
  function currentGoalType() {
    var a = document.querySelector(".goal-type-chip.active");
    return a ? a.getAttribute("data-type") : "retirement";
  }
  function collectGoalForm() {
    function val(idv) { var e = $(idv); return e ? e.value : ""; }
    var fund = (document.querySelector('input[name="gf-fund"]:checked') || {}).value;
    return {
      type: currentGoalType(),
      name: (val("gf-name") || "").trim(),
      targetToday: parseFloat(val("gf-target")) || 0,
      years: val("gf-years") === "" ? null : Math.max(0, parseInt(val("gf-years"), 10) || 0),
      inflation: parseFloat(val("gf-infl")),
      portfolioPct: fund === "portfolio" ? (parseFloat(val("gf-pct")) || 0) : 0,
      currentSaved: fund === "manual" ? (parseFloat(val("gf-saved")) || 0) : 0
    };
  }
  function saveGoal(editing, id, fallbackType) {
    var f = collectGoalForm();
    if (isNaN(f.inflation)) f.inflation = 6;
    if (!f.name || f.targetToday <= 0 || f.years == null) { var e = $("gf-err"); if (e) e.hidden = false; return; }
    if (f.portfolioPct <= 0 && f.currentSaved < 0) f.currentSaved = 0;
    if (editing) {
      state.goals = (state.goals || []).map(function (g) {
        return g.id === id ? { id: id, type: f.type, name: f.name, targetToday: f.targetToday, years: f.years, inflation: f.inflation, portfolioPct: f.portfolioPct, currentSaved: f.currentSaved } : g;
      });
      audit("goal", "Goal updated: “" + f.name + "” — target " + fmt(f.targetToday) + " in " + f.years + "y.");
    } else {
      state.goals = (state.goals || []).concat([{ id: gid(), type: f.type, name: f.name, targetToday: f.targetToday, years: f.years, inflation: f.inflation, portfolioPct: f.portfolioPct, currentSaved: f.currentSaved }]);
      audit("goal", "Goal created: “" + f.name + "” — target " + fmt(f.targetToday) + " in " + f.years + "y.");
    }
    save("goals");
    closeModal();
    if (isActive("goals")) renderGoals();
    renderGoalsSummary();
    toast(editing ? "Goal updated." : "Goal added — " + f.name, "success");
  }
  function deleteGoal(id) {
    var g = (state.goals || []).filter(function (x) { return x.id === id; })[0];
    state.goals = (state.goals || []).filter(function (x) { return x.id !== id; });
    save("goals");
    if (g) audit("goal", "Goal removed: “" + g.name + "”.");
    closeModal();
    if (isActive("goals")) renderGoals();
    renderGoalsSummary();
    toast("Goal removed.", "warn");
  }

  /* ============================================================ MODAL / TOAST */
  function openModal(html) {
    var root = $("modal-root"); if (!root) return;
    root.hidden = false;
    root.innerHTML = '<div class="modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:5vh 16px;z-index:1000;">' +
      '<div class="modal-card" style="max-width:480px;width:100%;">' + html + "</div></div>";
    var bd = root.querySelector(".modal-backdrop");
    if (bd) bd.addEventListener("click", function (e) { if (e.target === bd) closeModal(); });
  }
  function closeModal() { var root = $("modal-root"); if (root) { root.hidden = true; root.innerHTML = ""; } }

  function toast(msg, type) {
    var root = $("toast-root"); if (!root) return;
    var cls = "toast toast-" + (type || "success");
    var t = el("div", cls, esc(msg));
    root.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }

  /* ============================================================ ROUTER */
  var PANELS = ["dashboard", "discover", "analytics", "learn", "profile", "invest", "goals", "copilot", "trust"];
  var current = "dashboard";
  function isActive(name) { return current === name; }
  function renderPanel(name) {
    switch (name) {
      case "dashboard": renderDashboard(); break;
      case "discover": renderDiscover(); break;
      case "analytics": renderAnalytics(); break;
      case "learn": renderLearn(); break;
      case "profile": renderProfile(); break;
      case "invest": renderInvest(); break;
      case "goals": renderGoals(); break;
      case "copilot": renderCopilot(); break;
      case "trust": renderTrust(); break;
    }
  }
  function switchPanel(name) {
    if (PANELS.indexOf(name) < 0) return;
    current = name;
    PANELS.forEach(function (p) {
      var sec = $("panel-" + p);
      if (sec) sec.classList.toggle("active", p === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".nav-btn"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-panel") === name);
    });
    renderPanel(name);
    window.dispatchEvent(new CustomEvent("panelchange", { detail: { panel: name } }));
  }

  function renderAll() {
    PANELS.forEach(renderPanel);
  }

  /* ============================================================ THEME */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme === "light" ? "light" : "dark");
  }
  function wireChrome() {
    Array.prototype.forEach.call(document.querySelectorAll(".nav-btn"), function (b) {
      b.addEventListener("click", function () { switchPanel(b.getAttribute("data-panel")); });
    });
    var tt = $("theme-toggle");
    if (tt) tt.addEventListener("click", function () {
      state.theme = state.theme === "light" ? "dark" : "light"; save("theme"); applyTheme();
    });
    var lo = $("logout-btn");
    if (lo) lo.addEventListener("click", logout);
    var bell = $("notif-bell");
    if (bell) bell.addEventListener("click", function () {
      var panel = $("notif-panel");
      if (panel && !panel.hidden) closeNotifCenter(); else openNotifCenter();
    });
    var scrim = $("notif-scrim");
    if (scrim) scrim.addEventListener("click", closeNotifCenter);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNotifCenter(); });
    // delegated: "open the X lesson" links inside chat bubbles or modals
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("[data-lesson-link]") : null;
      if (!a) return;
      e.preventDefault();
      closeModal(); switchPanel("learn"); openLesson(a.getAttribute("data-lesson-link"));
    });
  }

  /* ============================================================ ONBOARDING */
  var CONSENT_SCOPES = [
    { id: "nsdl", scope: "NSDL demat holdings", desc: "Read-only equity & bond holdings from your NSDL demat." },
    { id: "cdsl", scope: "CDSL demat holdings", desc: "Read-only holdings from your CDSL demat account." },
    { id: "mf", scope: "MF folios (CAMS / KFintech)", desc: "Mutual-fund folios and NAVs via RTA feeds." },
    { id: "bank", scope: "Bank balance (AA)", desc: "Idle/settlement cash balance via Account Aggregator." }
  ];
  var CONSENT_MAP = [["consent-nsdl", "nsdl"], ["consent-cdsl", "cdsl"], ["consent-mf", "mf"], ["consent-bank", "bank"]];
  // Agent B ships the full static 3-step markup in #onboarding; we only DRIVE it.
  function initOnboarding() {
    var root = $("onboarding");
    if (!root) { finishBoot(); return; }
    root.hidden = false;
    showOnbStep(1);
    bindNext("onboarding-next-1", function () { showOnbStep(2); });
    bindNext("onboarding-back-2", function () { showOnbStep(1); });
    bindNext("grant-consent-btn", function () { grantFromCheckboxes(); showOnbStep(3); runFetch(root); });
    bindNext("onboarding-done", function () { completeOnboarding(root); });
    var skip = $("onboarding-skip");
    if (skip) skip.addEventListener("click", function (e) {
      e.preventDefault();
      if (!state.consents.length) grantConsents(CONSENT_SCOPES.map(function (c) { return c.id; }));
      completeOnboarding(root);
    });
  }
  function showOnbStep(n) {
    Array.prototype.forEach.call(document.querySelectorAll(".onboarding-step"), function (s) {
      s.classList.toggle("active", s.getAttribute("data-step") === String(n));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".onboarding-dot"), function (d) {
      d.classList.toggle("active", d.getAttribute("data-dot") === String(n));
    });
  }
  function grantFromCheckboxes() {
    var ids = [];
    CONSENT_MAP.forEach(function (pair) { var cb = $(pair[0]); if (!cb || cb.checked) ids.push(pair[1]); });
    if (!ids.length) ids = CONSENT_SCOPES.map(function (c) { return c.id; });
    grantConsents(ids);
  }
  function runFetch(root) {
    var rowIds = ["fetch-nsdl", "fetch-cdsl", "fetch-mf", "fetch-bank"];
    var done = $("onboarding-done"); if (done) done.disabled = true;
    var i = 0;
    var timer = setInterval(function () {
      if (i < rowIds.length) {
        var r = $(rowIds[i]);
        if (r) {
          r.classList.remove("loading"); r.classList.add("done");
          var st = r.querySelector(".fetch-status, .status, .fetch-state");
          if (st) st.innerHTML = ic("check") + " synced";
        }
        i++;
      } else {
        clearInterval(timer);
        if (done) done.disabled = false; else completeOnboarding(root);
      }
    }, 500);
  }
  function bindNext(id, fn) { var b = $(id); if (b) b.addEventListener("click", fn); }
  function grantConsents(ids) {
    state.consents = ids.map(function (id) {
      var c = CONSENT_SCOPES.filter(function (x) { return x.id === id; })[0] || { scope: id };
      return { scope: c.scope, grantedOn: TODAY, expiry: "2027-07-06", active: true };
    });
    save("consents");
    state.consents.forEach(function (c) { audit("consent", "AA consent granted: " + c.scope + " (expires " + c.expiry + ")."); });
  }
  function completeOnboarding(root) {
    if (!state.onboarded) {
      state.onboarded = true; save("onboarded");
      audit("onboard", "Onboarding complete — 4 sources linked, portfolio consolidated.");
      window.dispatchEvent(new CustomEvent("niveshos:onboarded", {}));
    }
    if (root) { root.hidden = true; }
    finishBoot();
  }

  /* ============================================================ BOOT */
  function finishBoot() {
    if (D.investor) D.investor.riskProfile = state.riskProfile;
    if ((state.importedHoldings || []).length) ensureCasAccount();  // restore synthetic CAS account after reload
    renderAll();
    switchPanel("dashboard");
    refreshAlertsUI();
    if (!_rendered) {
      _rendered = true;
      window.dispatchEvent(new CustomEvent("niveshos:rendered", {}));
    }
  }
  /* ============================================================ LOGIN */
  function showLogin() {
    var ov = $("login-overlay");
    if (!ov) return;
    var cards = (D.users || []).map(function (u) {
      return '<button type="button" class="login-user" data-user="' + esc(u.id) + '">' +
        '<span class="login-user-av">' + esc(u.avatar || "") + "</span>" +
        '<span class="login-user-info"><span class="login-user-name">' + esc(u.name) + "</span>" +
        '<span class="login-user-persona">' + esc(u.persona || "") + "</span>" +
        '<span class="login-user-creds">' + esc(u.username) + " · " + esc(u.password) + "</span></span></button>";
    }).join("");
    ov.innerHTML =
      '<div class="login-card" role="dialog" aria-modal="true" aria-labelledby="login-title">' +
        '<div class="login-brand">' +
          '<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true">' +
            '<path d="M16 10 L7 21 M16 10 L25 21 M7 23 L25 23" stroke="var(--hairline)" stroke-width="1.5" fill="none"/>' +
            '<circle cx="16" cy="7" r="3.2" fill="var(--accent)"/><circle cx="7" cy="23" r="3.2" fill="var(--s2)"/>' +
            '<circle cx="25" cy="23" r="3.2" fill="var(--s5)"/><circle cx="16" cy="16" r="3.6" fill="var(--ink)"/></svg>' +
          '<div><h2 id="login-title" style="margin:0;">Sign in to NiveshOS</h2>' +
          '<p style="margin:2px 0 0;font-size:12px;color:var(--ink-muted);">Local demo login — runs entirely in your browser, no server.</p></div>' +
        "</div>" +
        '<form id="login-form" class="login-form" autocomplete="off">' +
          '<label class="login-field"><span>Username</span><input id="login-username" type="text" autocomplete="username" placeholder="e.g. priya"></label>' +
          '<label class="login-field"><span>Password</span><input id="login-password" type="password" autocomplete="current-password" placeholder="••••••••"></label>' +
          '<p id="login-error" class="login-error" hidden></p>' +
          '<button type="submit" class="btn btn-primary login-submit">Sign in</button>' +
        "</form>" +
        '<div class="login-divider"><span>or pick a demo profile</span></div>' +
        '<div class="login-users">' + cards + "</div>" +
      "</div>";
    ov.hidden = false;

    var form = $("login-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      attemptLogin(($("login-username") || {}).value, ($("login-password") || {}).value);
    });
    Array.prototype.forEach.call(ov.querySelectorAll(".login-user"), function (b) {
      b.addEventListener("click", function () {
        var u = userById(b.getAttribute("data-user"));
        if (!u) return;
        var un = $("login-username"), pw = $("login-password");
        if (un) un.value = u.username;
        if (pw) pw.value = u.password;
        attemptLogin(u.username, u.password);
      });
    });
  }
  function attemptLogin(username, password) {
    var u = (D.users || []).filter(function (x) {
      return x.username === String(username || "").trim() && x.password === String(password || "");
    })[0];
    var err = $("login-error");
    if (!u) {
      if (err) { err.textContent = "Incorrect username or password."; err.hidden = false; }
      return;
    }
    setSession(u.id);
    enterApp(u.id, false);
  }
  function hideLogin() { var ov = $("login-overlay"); if (ov) ov.hidden = true; }

  function enterApp(id, forceOnboarded) {
    setActiveUser(id);
    var u = userById(id);
    if (hasSavedState()) loadState();
    else seedUserState(u);
    if (forceOnboarded && !state.onboarded) {
      state.onboarded = true;
      grantConsents(CONSENT_SCOPES.map(function (c) { return c.id; }));
      saveAll();
    }
    hideLogin();
    if (state.onboarded) {
      var ob = $("onboarding"); if (ob) ob.hidden = true;
      finishBoot();
    } else {
      initOnboarding();
    }
    var p = new URLSearchParams(window.location.search).get("panel");
    if (p) switchPanel(p);
  }
  function logout() {
    clearSession();
    window.location.reload();
  }

  function boot() {
    loadTheme();
    applyTheme();
    wireChrome();
    var params = new URLSearchParams(window.location.search);
    var forced = params.get("user");
    if (params.get("demo") === "1") { setSession("priya"); enterApp("priya", true); return; }
    if (forced && userById(forced)) { setSession(forced); enterApp(forced, true); return; }
    var sess = getSession();
    if (sess && userById(sess)) { enterApp(sess, false); return; }
    showLogin();
  }

  // expose for anim.js / debug
  window.NIVESH = { switchPanel: switchPanel, state: state, fmt: fmt };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})();
