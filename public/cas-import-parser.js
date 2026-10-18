(function (root, factory) {
  var parser = factory();
  if (typeof module === "object" && module.exports) module.exports = parser;
  else root.CASImportParser = parser;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var MAX_ROWS = 1000;
  var ALIASES = {
    isin: ["isin", "security isin"],
    symbol: ["symbol", "ticker", "security symbol"],
    name: ["name", "instrument", "security name", "scheme name", "company"],
    type: ["type", "asset type", "asset class", "category"],
    qty: ["qty", "quantity", "units", "units held", "closing balance"],
    value: ["value", "market value", "current value", "closing value"],
  };

  function parseCsvRows(text) {
    var rows = [], row = [], cell = "", quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') {
        if (cell.length) throw new Error("Unexpected quote in CSV.");
        quoted = true;
      } else if (ch === "," || ch === ";") {
        row.push(cell.trim()); cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell.trim()); cell = "";
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (rows.length > MAX_ROWS + 1) throw new Error("CSV contains too many rows (maximum 1,000 holdings).");
      } else cell += ch;
    }
    if (quoted) throw new Error("CSV has an unclosed quoted field.");
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function normalizeHeader(value) {
    return String(value || "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  }

  function parseAmount(value) {
    var raw = String(value || "").replace(/[,₹$€£\s]/g, "").trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    var amount = Number(raw);
    return Number.isFinite(amount) ? amount : null;
  }

  function parseCsv(text) {
    var rows = parseCsvRows(String(text || ""));
    if (rows.length < 2) throw new Error("CSV needs a header and at least one holding row.");
    var headers = rows[0].map(normalizeHeader);
    var columns = {};
    Object.keys(ALIASES).forEach(function (key) {
      var index = headers.findIndex(function (header) { return ALIASES[key].indexOf(header) >= 0; });
      if (index >= 0) columns[key] = index;
    });
    if (columns.qty == null || columns.value == null || (columns.name == null && columns.symbol == null && columns.isin == null)) {
      throw new Error("CSV must include a name, symbol, or ISIN column plus quantity and market value columns.");
    }
    var result = rows.slice(1).filter(function (cells) { return cells.some(Boolean); }).map(function (cells) {
      function get(key) { return columns[key] == null ? "" : (cells[columns[key]] || "").trim(); }
      var isin = get("isin").toUpperCase();
      return {
        isin: isin,
        symbol: get("symbol").toUpperCase(),
        name: get("name") || get("symbol") || isin,
        type: get("type").toUpperCase(),
        qty: parseAmount(get("qty")),
        value: parseAmount(get("value")),
        requiresValue: true,
        raw: cells.join(", "),
      };
    });
    if (!result.length) throw new Error("No holding rows found in the CSV.");
    if (result.length > MAX_ROWS) throw new Error("CSV contains too many rows (maximum 1,000 holdings).");
    return result;
  }

  function hasCsvHeader(text) {
    var firstLine = String(text || "").split(/\r?\n/, 1)[0];
    if (!firstLine || !/[;,]/.test(firstLine)) return false;
    var headers = parseCsvRows(firstLine)[0].map(normalizeHeader);
    var hasQty = headers.some(function (header) { return ALIASES.qty.indexOf(header) >= 0; });
    var hasValue = headers.some(function (header) { return ALIASES.value.indexOf(header) >= 0; });
    return hasQty && hasValue;
  }

  return { parseCsv: parseCsv, hasCsvHeader: hasCsvHeader, MAX_ROWS: MAX_ROWS };
});
