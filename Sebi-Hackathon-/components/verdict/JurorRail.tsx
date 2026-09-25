"use client";

import type { AgentId } from "@/lib/types/verdict";
import { AGENTS } from "@/lib/types/verdict";

interface JurorRailProps {
  activeSpeaker?: AgentId | null;
  onSelectSpeaker?: (speaker: AgentId) => void;
}

const JUROR_SVGS: Record<AgentId, { bg: string; fill: string; secondary: string; tag: string; code: string }> = {
  judge: {
    bg: "#181B22",
    fill: "#EFEFEB",
    secondary: "#E28743",
    tag: "JUDGE",
    code: "UA 570-B",
  },
  quant: {
    bg: "#181B22",
    fill: "#3370FF",
    secondary: "#10223F",
    tag: "QUANT",
    code: "ADSR-01",
  },
  bull: {
    bg: "#181B22",
    fill: "#5B8E69",
    secondary: "#09271C",
    tag: "BULL",
    code: "CBRPNK",
  },
  bear: {
    bg: "#181B22",
    fill: "#D64038",
    secondary: "#290D11",
    tag: "BEAR",
    code: "DPM-TS26",
  },
  risk: {
    bg: "#181B22",
    fill: "#F2A900",
    secondary: "#2B200B",
    tag: "RISK",
    code: "SPEC-05",
  },
};

export function JurorRail({ activeSpeaker, onSelectSpeaker }: JurorRailProps) {
  const jurors: AgentId[] = ["judge", "quant", "bull", "bear", "risk"];

  return (
    <section className="flex flex-col space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="decal-orange px-2 py-0.5 text-[9px]">
            PANEL ACTIVE
          </span>
          <span className="font-tech text-xs tracking-wider text-bone uppercase">
            5-LLM Adversarial Chamber
          </span>
        </div>
        <span className="font-mono text-[10px] text-cb-amber flex items-center gap-1.5 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-cb-amber animate-pulse" />
          Cross-Exam Active
        </span>
      </div>

      {/* Horizontal Scrolling Avatars */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {jurors.map((id) => {
          const meta = AGENTS[id];
          const visuals = JUROR_SVGS[id];
          const isSpeaking = activeSpeaker === id;

          return (
            <button
              type="button"
              key={id}
              onClick={() => onSelectSpeaker?.(id)}
              className={`flex flex-col items-center min-w-[90px] p-2.5 rounded-[14px] transition-all text-left cursor-pointer border-2 ${
                isSpeaking
                  ? "bg-onyx border-cb-orange shadow-[3px_3px_0px_#E28743] -translate-y-0.5"
                  : "bg-surface border-graphite hover:border-cb-orange/50 hover:bg-carbon"
              }`}
            >
              <div className="relative w-12 h-12 rounded-full p-0.5 flex items-center justify-center">
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-orange opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cb-orange" />
                  </span>
                )}

                {/* Minimalist Vector Character SVG */}
                <svg className="w-10 h-10 rounded-full" fill="none" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" fill={visuals.bg} stroke="#262A34" strokeWidth="2" r="22" />
                  <path
                    d="M24 10C20.134 10 17 13.134 17 17C17 20.866 20.134 24 24 24C27.866 24 31 20.866 31 17C31 13.134 27.866 10 24 10Z"
                    fill={visuals.fill}
                  />
                  <path
                    d="M12 38C12 31.3726 17.3726 26 24 26C30.6274 26 36 31.3726 36 38V40H12V38Z"
                    fill={visuals.secondary}
                  />
                  {id === "bull" && (
                    <path d="M21 21L24 18L27 21" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2" />
                  )}
                  {id === "bear" && (
                    <path d="M21 19L24 22L27 19" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2" />
                  )}
                </svg>
              </div>

              <div className="pt-2 text-center w-full">
                <div className="font-tech text-xs font-bold text-white uppercase tracking-wider truncate">
                  {visuals.tag}
                </div>
                <div className="font-mono text-[9px] text-raw-dim tracking-tight truncate">
                  {visuals.code}
                </div>
              </div>

              <div className={`mt-1 font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 ${
                isSpeaking ? "text-cb-orange font-bold" : "text-raw-dim"
              }`}>
                {isSpeaking ? (
                  <>
                    <span className="material-symbols-outlined text-[10px] animate-spin">graphic_eq</span>
                    Active
                  </>
                ) : (
                  "Ready"
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
