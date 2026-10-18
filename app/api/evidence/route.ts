import { NextRequest, NextResponse } from "next/server";
import { assembleEvidence } from "@/lib/signals/assembleEvidence";
import { evidenceRequestSchema } from "@/lib/validation/api";
import type { TradeThesis } from "@/lib/types/thesis";
import { readJsonBody } from "@/lib/utils/readJsonBody";

const MAX_REQUEST_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req, MAX_REQUEST_BYTES);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

    const parsed = evidenceRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid thesis. Check the instrument and allocation details." },
        { status: 400 }
      );
    }

    return NextResponse.json(await assembleEvidence(parsed.data as TradeThesis));
  } catch (err) {
    console.error("[/api/evidence]", err);
    return NextResponse.json(
      { error: "Failed to assemble evidence pack. Please try again." },
      { status: 500 }
    );
  }
}
