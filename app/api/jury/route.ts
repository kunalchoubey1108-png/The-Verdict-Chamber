// ── POST /api/jury ────────────────────────────────────────────────────────────
// Accepts a validated money decision, recomputes evidence server-side, and
// streams deliberation as Server-Sent Events (SSE). One event per agent_start /
// agent_chunk / agent_done / verdict. Client reads via ReadableStream.

import { NextRequest } from "next/server";
import type { JuryEvent } from "@/lib/types/verdict";
import { runJury } from "@/lib/agents/orchestrate";
import { buildEvidence } from "@/lib/decision/evidence";
import { juryRequestSchema } from "@/lib/validation/decision";
import { readJsonBody } from "@/lib/utils/readJsonBody";

// Bound jury streams; raise only when the deployment plan and UX require it.
export const maxDuration = 60;
const MAX_REQUEST_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req, MAX_REQUEST_BYTES);
    if (!body.ok) {
      return Response.json({ error: body.error }, { status: body.status });
    }

    const parsed = juryRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return Response.json({ error: "Invalid decision. Check the amount, budget and fields." }, { status: 400 });
    }
    const { decision } = parsed.data;
    const evidence = buildEvidence(decision);

    // ── Set up SSE stream ─────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: JuryEvent) {
          if (abortController.signal.aborted) return;
          const data = `data: ${JSON.stringify(event)}\n\n`;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            abortController.abort(new Error("Jury client disconnected."));
          }
        }
        function sendDone() {
          if (abortController.signal.aborted) return;
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            abortController.abort(new Error("Jury client disconnected."));
          }
        }

        try {
          await runJury(decision, evidence, send, abortController.signal);
          sendDone();
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error("[/api/jury stream]", err);
            send({ type: "error", error: "Jury deliberation failed. Please try again." });
            sendDone();
          }
        } finally {
          if (!abortController.signal.aborted) {
            controller.close();
          }
        }
      },
      cancel() {
        abortController.abort(new Error("Jury client disconnected."));
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
