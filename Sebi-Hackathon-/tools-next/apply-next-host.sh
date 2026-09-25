#!/usr/bin/env bash
# Apply the engine-agnostic Next.js host onto a vanilla NiveshOS working dir.
# Run FROM the target dir (a branch worktree). Reuses the verified host files
# from KIT_DIR and generates the branch-specific markup + script loader.
#
#   usage: bash apply-next-host.sh <KIT_DIR>
#     KIT_DIR = a dir that already contains package.json, next.config.mjs,
#               app/layout.jsx, app/api/quotes/route.js  (the main repo)
set -euo pipefail

KIT="${1:?usage: apply-next-host.sh <KIT_DIR>}"
TARGET="$PWD"

[ -f "$TARGET/index.html" ] || { echo "no index.html in $TARGET — nothing to host"; exit 2; }

echo "[next-host] target: $TARGET"
mkdir -p "$TARGET/app/api/quotes" "$TARGET/public/vendor"

# reuse verified host files
cp "$KIT/package.json"            "$TARGET/package.json"
cp "$KIT/next.config.mjs"         "$TARGET/next.config.mjs"
cp "$KIT/app/layout.jsx"          "$TARGET/app/layout.jsx"
cp "$KIT/app/api/quotes/route.js" "$TARGET/app/api/quotes/route.js"

# global stylesheet
cp "$TARGET/styles.css" "$TARGET/app/styles.css"

# engine scripts -> public/ (only those present)
for f in real-quotes.js data.js app.js anim.js; do
  [ -f "$TARGET/$f" ] && cp "$TARGET/$f" "$TARGET/public/$f"
done
[ -d "$TARGET/vendor" ] && cp "$TARGET"/vendor/*.min.js "$TARGET/public/vendor/" 2>/dev/null || true

# generate appMarkup.js (exact body markup, scripts stripped) + page.jsx
TARGET="$TARGET" node -e '
const fs=require("fs");
const T=process.env.TARGET;
let h=fs.readFileSync(T+"/index.html","utf8");
let inner=h.split("<body>")[1].split("</body>")[0].replace(/<script[\s\S]*?<\/script>\s*/g,"").trim();
fs.writeFileSync(T+"/app/appMarkup.js",
  "// AUTO-GENERATED from index.html — do not edit by hand.\n"+
  "export const APP_MARKUP = "+JSON.stringify(inner)+";\n");

// build the <Script> loader from files that actually exist, in canonical order
const order=[
  ["gsap","/vendor/gsap.min.js","public/vendor/gsap.min.js"],
  ["scrolltrigger","/vendor/ScrollTrigger.min.js","public/vendor/ScrollTrigger.min.js"],
  ["real-quotes","/real-quotes.js","public/real-quotes.js"],
  ["nivesh-data","/data.js","public/data.js"],
  ["nivesh-app","/app.js","public/app.js"],
  ["nivesh-anim","/anim.js","public/anim.js"],
];
const tags=order.filter(([,,p])=>fs.existsSync(T+"/"+p))
  .map(([id,src])=>`      <Script id="${id}" src="${src}" strategy="afterInteractive" />`)
  .join("\n");
const page=`"use client";

import Script from "next/script";
import { APP_MARKUP } from "./appMarkup";

// Next.js hosts the NiveshOS engine unchanged: exact legacy markup injected
// once, then the vendored GSAP + engine scripts load in original order after
// hydration, so the engine boots exactly as it did on the static site.
export default function Page() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: APP_MARKUP }} />

${tags}
    </>
  );
}
`;
fs.writeFileSync(T+"/app/page.jsx",page);
console.log("[next-host] appMarkup bytes:",inner.length);
'

# ignore node/next build artifacts
{ echo ""; echo "node_modules/"; echo ".next/"; echo "next-env.d.ts"; } >> "$TARGET/.gitignore"

echo "[next-host] done."
