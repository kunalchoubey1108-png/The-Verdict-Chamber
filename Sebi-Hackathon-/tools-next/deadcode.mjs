import fs from "node:fs";

const app = fs.readFileSync("app.js", "utf8");
const others = ["data.js", "anim.js", "real-quotes.js", "index.html", "styles.css"]
  .filter((f) => fs.existsSync(f))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");
const all = app + "\n" + others;

const esc = (s) => s.replace(/[$]/g, "\\$");
const names = [...app.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
const uniq = [...new Set(names)];

const dead = [];
for (const n of uniq) {
  const total = (all.match(new RegExp("\\b" + esc(n) + "\\b", "g")) || []).length;
  const defs = (app.match(new RegExp("function\\s+" + esc(n) + "\\s*\\(", "g")) || []).length;
  if (total <= defs) dead.push({ n, total, defs });
}

console.log("total functions:", uniq.length, " dead candidates:", dead.length);
for (const d of dead) console.log(`  ${d.n}  refs=${d.total} defs=${d.defs}`);
