"use client";

import { AGENTS, type AgentId, type AgentMessage } from "@/lib/types/verdict";
import { cn } from "@/lib/utils/cn";
import ReactMarkdown from "react-markdown";

interface AgentCardProps {
  message: AgentMessage;
  isLatest?: boolean;
}

const AGENT_SPEC: Record<AgentId, { border: string; badge: string; text: string; role: string; decal: string; stamp: string }> = {
  judge: {
    border: "border-l-4 border-l-cb-orange border-t-2 border-r-2 border-b-2 border-graphite bg-surface",
    badge: "bg-cb-orange text-black font-bold",
    text: "text-cb-orange",
    role: "PRESIDING JUDGE",
    decal: "UA 570-B",
    stamp: "CHAMBER_DECREE",
  },
  quant: {
    border: "border-l-4 border-l-cb-blue border-t-2 border-r-2 border-b-2 border-graphite bg-surface",
    badge: "bg-cb-blue text-white font-bold",
    text: "text-cb-blue",
    role: "QUANT ANALYST",
    decal: "ADSR // NUM-03",
    stamp: "VOLATILITY_MATRIX",
  },
  bull: {
    border: "border-l-4 border-l-cb-green border-t-2 border-r-2 border-b-2 border-graphite bg-surface",
    badge: "bg-cb-green text-white font-bold",
    text: "text-cb-green",
    role: "BULL COUNSEL",
    decal: "CBRPNK // 01",
    stamp: "MOMENTUM_RUN",
  },
  bear: {
    border: "border-l-4 border-l-cb-red border-t-2 border-r-2 border-b-2 border-graphite bg-surface",
    badge: "bg-cb-red text-white font-bold",
    text: "text-cb-red",
    role: "BEAR COUNSEL",
    decal: "DPM SYSTM TS26",
    stamp: "DRAWDOWN_TRAP",
  },
  risk: {
    border: "border-l-4 border-l-cb-amber border-t-2 border-r-2 border-b-2 border-graphite bg-surface",
    badge: "bg-cb-amber text-black font-bold",
    text: "text-cb-amber",
    role: "RISK OFFICER",
    decal: "SPEC // 25-VAR",
    stamp: "LIMIT_ENFORCED",
  },
};

export function AgentCard({ message, isLatest }: AgentCardProps) {
  const meta = AGENTS[message.agent];
  const spec = AGENT_SPEC[message.agent] || AGENT_SPEC.judge;
  const isThinking = message.status === "thinking";
  const isStreaming = message.status === "streaming";
  const isJudge = message.agent === "judge";

  return (
    <article
      className={cn(
        "p-6 rounded-[16px] relative transition-all duration-200 animate-slide-up",
        spec.border,
        isLatest && isStreaming
          ? "border-cb-orange shadow-[4px_4px_0px_#E28743] bg-carbon"
          : "hover:border-graphite/90"
      )}
    >
      {/* Agent Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-graphite/70">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "px-3 py-1 rounded-[6px] text-[10px] font-tech uppercase tracking-wider flex items-center gap-1.5 border border-black",
              spec.badge
            )}
          >
            {isStreaming ? (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
            {spec.role}
          </span>
          <span className="font-tech text-xs text-bone tracking-wide">
            {meta.name}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-raw-dim">
            // {spec.decal}
          </span>
        </div>

        {/* Status / Timestamp */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-raw-dim shrink-0">
          {isThinking && (
            <span className="flex items-center gap-1 text-cb-amber font-tech">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="text-[10px] uppercase tracking-wider">Evaluating</span>
            </span>
          )}
          {isStreaming && (
            <span className="text-cb-orange font-tech uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] animate-spin">graphic_eq</span>
              Transmitting
            </span>
          )}
          {message.status === "done" && (
            <span className="font-mono text-[10px] bg-carbon px-2 py-0.5 rounded border border-graphite text-raw-dim">
              {new Date(message.timestamp || Date.now()).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Deliberation Body */}
      <div className="font-sans text-sm text-bone leading-relaxed">
        {isThinking ? (
          <div className="flex items-center gap-2 text-raw-dim py-3 text-xs">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="ml-1 font-mono">{meta.name} is computing order book depth &amp; downside risks…</span>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:font-tech prose-headings:text-white prose-strong:text-cb-orange prose-code:text-cb-amber prose-code:font-mono prose-code:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-cb-orange ml-1 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* Tech Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-4 border-t border-graphite/50 text-[10px] font-mono text-raw-dim">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-black/60 border border-graphite flex items-center gap-1 uppercase tracking-wider">
            <span className="text-cb-green">●</span> EVID-VERIFIED
          </span>
          <span className="px-2 py-0.5 rounded bg-black/60 border border-graphite flex items-center gap-1 uppercase tracking-wider">
            <span className="text-cb-orange">■</span> {spec.stamp}
          </span>
        </div>
        {isJudge && message.status === "done" && (
          <span className="text-cb-orange font-bold uppercase tracking-wider flex items-center gap-1">
            ⚖️ VERDICT ENTERED
          </span>
        )}
      </div>
    </article>
  );
}
