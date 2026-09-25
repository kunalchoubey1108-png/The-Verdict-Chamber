"use client";

import { useState, useEffect, useRef } from "react";
import type { TradeThesis } from "@/lib/types/thesis";
import type { EvidencePack } from "@/lib/types/evidence";
import type { AgentMessage, VerdictCard as VerdictCardType, AgentId, JuryEvent, FullVerdict } from "@/lib/types/verdict";
import { AgentCard } from "./AgentCard";
import { VerdictCard } from "./VerdictCard";
import { StockCockpit } from "./StockCockpit";
import { JurorRail } from "./JurorRail";
import { saveVerdict } from "@/lib/utils/storage";
import { nanoid } from "nanoid";

type Phase = "loading-evidence" | "ready" | "deliberating" | "verdict" | "error";

interface JuryRoomProps {
  thesis: TradeThesis;
}

export function JuryRoom({ thesis }: JuryRoomProps) {
  const [phase, setPhase] = useState<Phase>("loading-evidence");
  const [evidencePack, setEvidencePack] = useState<EvidencePack | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [verdictCard, setVerdictCard] = useState<VerdictCardType | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<AgentId | null>(null);
  const [speakerFilter, setSpeakerFilter] = useState<AgentId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  // Auto-scroll gently as new tokens arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Step 1: Fetch evidence pack
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function fetchEvidence() {
      try {
        const res = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(thesis),
        });
        if (!res.ok) throw new Error("Failed to assemble market telemetry");
        const ep: EvidencePack = await res.json();
        setEvidencePack(ep);
        setPhase("ready");
        setTimeout(() => startJury(ep), 600);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Evidence fetch failed");
        setPhase("error");
      }
    }

    fetchEvidence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startJury(ep: EvidencePack) {
    setPhase("deliberating");
    setMessages([]);

    const agentOrder: AgentId[] = ["bull", "bear", "risk", "quant", "judge"];
    const messageMap: Map<AgentId, AgentMessage> = new Map();

    try {
      const res = await fetch("/api/jury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidencePack: ep }),
      });

      if (!res.ok || !res.body) throw new Error("Jury stream failed to open");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          let event: JuryEvent;
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.type === "agent_start" && event.agent) {
            setCurrentSpeaker(event.agent);
            const msg: AgentMessage = {
              agent: event.agent,
              content: "",
              timestamp: new Date().toISOString(),
              status: "thinking",
            };
            messageMap.set(event.agent, msg);
            setMessages([...agentOrder
              .filter((a) => messageMap.has(a))
              .map((a) => ({ ...messageMap.get(a)! }))]);
          }

          if (event.type === "agent_chunk" && event.agent && event.chunk != null) {
            const msg = messageMap.get(event.agent);
            if (msg) {
              msg.content += event.chunk;
              msg.status = "streaming";
              setMessages([...agentOrder
                .filter((a) => messageMap.has(a))
                .map((a) => ({ ...messageMap.get(a)! }))]);
            }
          }

          if (event.type === "agent_done" && event.agent) {
            const msg = messageMap.get(event.agent);
            if (msg) {
              msg.status = "done";
              setMessages([...agentOrder
                .filter((a) => messageMap.has(a))
                .map((a) => ({ ...messageMap.get(a)! }))]);
            }
          }

          if (event.type === "verdict" && event.verdict) {
            setCurrentSpeaker(null);
            setVerdictCard(event.verdict);
            setPhase("verdict");

            const finalMessages = [...agentOrder
              .filter((a) => messageMap.has(a))
              .map((a) => ({ ...messageMap.get(a)! }))];

            const fullVerdict: FullVerdict = {
              id: nanoid(10),
              thesisId: thesis.id,
              createdAt: new Date().toISOString(),
              deliberation: finalMessages,
              verdict: event.verdict,
              thesisSnapshot: {
                instrument: thesis.instrument.name,
                direction: thesis.direction,
                entryPrice: thesis.entryPrice || (ep ? ep.quote.ltp : 0),
                target: thesis.target || (ep ? ep.quote.ltp * 1.08 : 0),
                stopLoss: thesis.stopLoss || (ep ? ep.quote.ltp * 0.96 : 0),
              },
            };
            saveVerdict(fullVerdict);
          }

          if (event.type === "error") {
            console.error("Jury error:", event.error);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Jury deliberation failed");
      setPhase("error");
    }
  }

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  if (phase === "loading-evidence") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-[16px] bg-carbon border-2 border-graphite flex items-center justify-center" style={{ boxShadow: '4px 4px 0px 0px #E28743' }}>
            <span className="font-display text-3xl text-cb-orange">⚖</span>
          </div>
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cb-orange" />
          </span>
        </div>
        <div className="space-y-2">
          <div className="font-display text-3xl text-white uppercase tracking-wider">Assembling Docket</div>
          <div className="text-xs font-mono text-raw-dim max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
            Querying market quotes for {thesis.instrument.symbol} · Calibrating risk models · Summoning 5-Agent Chamber
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="neo-card text-center space-y-5 py-14 max-w-lg mx-auto animate-slide-up" style={{ boxShadow: '4px 4px 0px 0px #D64038' }}>
        <div className="w-16 h-16 rounded-[12px] bg-cb-red/10 border-2 border-cb-red/40 flex items-center justify-center mx-auto text-2xl">⚠️</div>
        <h2 className="font-display text-2xl text-white uppercase tracking-wider">Chamber Interrupted</h2>
        <div className="text-xs font-mono text-raw-dim max-w-sm mx-auto leading-relaxed">{error}</div>
        <div className="pt-2">
          <a href="/verdict/new" className="neo-btn-primary inline-flex text-xs px-8 py-3">
            ← RESUBMIT INQUIRY
          </a>
        </div>
      </div>
    );
  }

  const displayedMessages = speakerFilter
    ? messages.filter((m) => m.agent === speakerFilter)
    : messages;

  return (
    <div className="space-y-7">
      {/* 1. TOP SECTION: Stock Context Cockpit */}
      {evidencePack && <StockCockpit evidencePack={evidencePack} />}

      {/* 2. MIDDLE SECTION: Interactive Juror Rail */}
      <JurorRail
        activeSpeaker={currentSpeaker}
        onSelectSpeaker={(speaker) => {
          setSpeakerFilter((prev) => (prev === speaker ? null : speaker));
        }}
      />

      {/* 3. MAIN SECTION: Deliberation Transcript & Sticky Verdict HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-7 items-start pt-2">
        {/* Transcript Timeline */}
        <section className="flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-graphite">
            <div className="flex items-center gap-2.5">
              <span className="decal-orange px-2 py-0.5 text-[9px]">LIVE</span>
              <h2 className="font-display text-xl text-white uppercase tracking-wider">Deliberation Transcript</h2>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-[11px]">
              {speakerFilter && (
                <button
                  onClick={() => setSpeakerFilter(null)}
                  className="text-cb-orange hover:underline uppercase flex items-center gap-1 bg-cb-orange/10 px-2.5 py-1 rounded-[6px] border border-cb-orange/30 font-tech"
                >
                  <span>Filter: {speakerFilter}</span>
                  <span>[✕]</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 bg-carbon px-2.5 py-1 rounded-[6px] border border-graphite text-raw-dim">
                <span className="w-2 h-2 rounded-full bg-cb-green" />
                <span className="font-tech uppercase tracking-wider">{messages.length} Arguments Logged</span>
              </div>
            </div>
          </div>

          {messages.length === 0 && phase === "deliberating" && (
            <div className="p-8 rounded-[16px] border-2 border-graphite bg-carbon flex flex-col items-center justify-center gap-3 text-center animate-pulse-soft">
              <span className="font-display text-4xl text-cb-orange">⏳</span>
              <span className="font-display text-lg text-white uppercase tracking-wider">Convening the Adversarial Panel</span>
              <span className="text-xs text-raw-dim font-mono uppercase tracking-wider">The first juror is currently reviewing order book depth</span>
            </div>
          )}

          {displayedMessages.map((msg, i) => (
            <AgentCard
              key={msg.agent}
              message={msg}
              isLatest={i === displayedMessages.length - 1}
            />
          ))}

          <div ref={bottomRef} />
        </section>

        {/* 4. SIDEBAR: Sticky Verdict HUD */}
        <div className="lg:sticky lg:top-24 space-y-4">
          {verdictCard && evidencePack ? (
            <VerdictCard verdict={verdictCard} evidencePack={evidencePack} />
          ) : (
            <div className="rounded-[18px] bg-carbon border-2 border-graphite p-6 text-center space-y-4" style={{ boxShadow: '4px 4px 0px 0px #262A34' }}>
              <div className="w-14 h-14 rounded-[12px] bg-black border-2 border-graphite mx-auto flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <div className="space-y-2">
                <div className="font-display text-lg text-white uppercase tracking-wider">
                  {phase === "deliberating"
                    ? "Chamber in Session"
                    : "Decision Docket"}
                </div>
                <p className="text-xs font-mono text-raw-dim leading-relaxed uppercase tracking-wider">
                  The Presiding Judge will deliver the final binding decree once cross-examination concludes.
                </p>
              </div>

              {phase === "deliberating" && (
                <div className="pt-2 flex flex-col items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <span className="text-[10px] font-tech text-cb-orange uppercase tracking-widest">
                    Hearing Testimonies…
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          {phase === "verdict" && (
            <div className="flex flex-col sm:flex-row gap-2 font-mono text-xs pt-1">
              <a
                href="/verdict/new"
                className="neo-btn-primary flex-1 justify-center py-3 text-center text-xs"
              >
                ASSESS ANOTHER STOCK →
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="neo-btn-ghost justify-center py-3 text-xs px-4"
                title="Copy share link"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedLink ? "check" : "share"}
                </span>
                <span>{copiedLink ? "Copied" : "Share"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
