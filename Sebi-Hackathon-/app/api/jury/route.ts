// ── POST /api/jury ────────────────────────────────────────────────────────────
// Accepts an EvidencePack and streams the full multi-agent jury deliberation
// as Server-Sent Events (SSE). One event per agent_start / agent_chunk /
// agent_done / verdict. Client reads via ReadableStream.

import { NextRequest } from "next/server";
import type { EvidencePack } from "@/lib/types/evidence";
import type { JuryEvent } from "@/lib/types/verdict";
import { runJury } from "@/lib/agents/orchestrate";

export const maxDuration = 120; // Vercel max for Hobby plan = 60s; Pro = 300s

export async function POST(req: NextRequest) {
  try {
    const { evidencePack } = (await req.json()) as { evidencePack: EvidencePack };

    if (!evidencePack?.thesis?.instrument) {
      return new Response(JSON.stringify({ error: "Missing evidencePack" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Set up SSE stream ─────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: JuryEvent) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        try {
          await runJury(evidencePack, send);
          // Signal stream completion
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Jury orchestration failed";
          send({ type: "error", error: msg });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no", // disable Nginx buffering on Vercel
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/jury]", err);
    return new Response(JSON.stringify({ error: "Failed to start jury" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
