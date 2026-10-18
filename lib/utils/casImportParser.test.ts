import { describe, expect, it } from "vitest";
import parser from "../../public/cas-import-parser.js";

describe("CAS CSV parser", () => {
  it("parses common statement column names and quoted names", () => {
    const rows = parser.parseCsv('ISIN,Scheme Name,Asset Class,Units Held,Market Value\nINF123456789,"Example, Equity Fund",MF,12.5,"1,234.50"');

    expect(rows).toEqual([{
      isin: "INF123456789",
      symbol: "",
      name: "Example, Equity Fund",
      type: "MF",
      qty: 12.5,
      value: 1234.5,
      requiresValue: true,
      raw: "INF123456789, Example, Equity Fund, MF, 12.5, 1,234.50",
    }]);
  });

  it("recognizes valid CSV headers and rejects missing required columns", () => {
    expect(parser.hasCsvHeader("Symbol,Quantity,Market Value")).toBe(true);
    expect(parser.hasCsvHeader("Symbol,Price,Market Value")).toBe(false);
    expect(() => parser.parseCsv("Symbol,Quantity,Price\nABC,2,50")).toThrow(/market value columns/);
  });

  it("rejects malformed quoting and excessive holding rows", () => {
    expect(() => parser.parseCsv('Name,Quantity,Value\n"Unclosed,1,5')).toThrow(/unclosed quoted/);

    const lines = ["Symbol,Quantity,Value"];
    for (let i = 0; i <= parser.MAX_ROWS; i++) lines.push(`S${i},1,10`);
    expect(() => parser.parseCsv(lines.join("\n"))).toThrow(/maximum 1,000/);
  });
});
