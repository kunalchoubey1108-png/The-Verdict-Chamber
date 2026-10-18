import { useState, useEffect } from "react";
import { playAlarmBeep } from "@/lib/utils/audio";

/**
 * Props required from the verdict context.
 * - entryPrice: price at which the position was opened
 * - positionSize: capital invested (numeric)
 */
export interface ThesisKillerSimulatorProps {
  entryPrice?: number;
  positionSize?: number;
}

/**
 * Renders an adversarial price‑slider that simulates capital preservation.
 * When the price breaches stop‑loss (10% drop), audio alert and visual warning trigger.
 */
export default function ThesisKillerSimulator({
  entryPrice,
  positionSize,
}: ThesisKillerSimulatorProps) {
  const safeEntry = typeof entryPrice === "number" && !isNaN(entryPrice) && entryPrice > 0 ? entryPrice : 1000;
  const safeSize = typeof positionSize === "number" && !isNaN(positionSize) && positionSize > 0 ? positionSize : 50000;

  const [price, setPrice] = useState(safeEntry);
  const [preserved, setPreserved] = useState(safeSize);
  const stopLoss = safeEntry * 0.9; // 10% drop → kill thesis

  // Sync when prop updates (e.g. telemetry arrives)
  useEffect(() => {
    if (safeEntry > 0) setPrice(safeEntry);
  }, [safeEntry]);

  // Update preserved capital safely
  useEffect(() => {
    if (safeEntry <= 0) return;
    const dropRatio = Math.max(0, 1 - (price / safeEntry));
    const loss = safeSize * dropRatio;
    const remaining = Math.max(0, safeSize - loss);
    setPreserved(Math.round(remaining));
  }, [price, safeEntry, safeSize]);

  // Alarm when price crosses stop‑loss
  useEffect(() => {
    if (price <= stopLoss && price > 0) {
      try {
        playAlarmBeep();
      } catch {}
    }
  }, [price, stopLoss]);

  const isKilled = price <= stopLoss;

  return (
    <div className={`mt-8 p-6 rounded-[18px] border-2 transition-all duration-300 ${
      isKilled ? "bg-red-950/40 border-cb-red shadow-[0_0_20px_rgba(214,64,56,0.3)]" : "bg-carbon border-graphite hover:border-cb-orange/40"
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isKilled ? "bg-cb-red animate-ping" : "bg-cb-orange"}`} />
          <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
            📉 THESIS-KILLER STRESS SIMULATOR
          </h3>
        </div>
        <span className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase rounded-md border ${
          isKilled ? "bg-cb-red text-white border-cb-red" : "bg-black text-fog border-graphite"
        }`}>
          {isKilled ? "THESIS INVALIDATED" : "ADVERSARIAL STRESS TEST"}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono">
          <span className="text-fog">
            Simulated Price: <strong className="text-white text-base">₹{Number(price || 0).toFixed(2)}</strong>
          </span>
          <span className="text-fog">
            Baseline Entry: <strong className="text-bone">₹{safeEntry.toFixed(2)}</strong> (Stop: ₹{stopLoss.toFixed(2)})
          </span>
        </div>

        <input
          type="range"
          min={Math.round(safeEntry * 0.5 * 100) / 100}
          max={Math.round(safeEntry * 1.25 * 100) / 100}
          step={Math.max(0.05, Math.round(safeEntry * 0.002 * 100) / 100)}
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || safeEntry)}
          className="w-full accent-cb-orange cursor-pointer"
        />

        <div className="flex items-center justify-between pt-2 border-t border-graphite/60">
          <span className="font-tech text-xs uppercase tracking-wider text-fog">
            Capital Preserved:
          </span>
          <span className={`font-mono text-lg font-bold tabular ${
            isKilled ? "text-cb-red animate-pulse" : "text-cb-green"
          }`}>
            ₹{preserved.toLocaleString("en-IN")}
          </span>
        </div>

        {isKilled && (
          <div className="p-3 bg-cb-red/20 border-2 border-cb-red text-white rounded-lg font-mono text-xs flex items-center gap-2.5 animate-slide-down">
            <span className="text-lg">🚨</span>
            <div>
              <strong className="tracking-wide">STOP-LOSS BREACHED:</strong> The trade thesis is mathematically killed. Veto triggered before capital allocation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
