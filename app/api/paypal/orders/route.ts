// ── POST /api/paypal/orders ───────────────────────────────────────────────────
// Creates a PayPal sandbox order from a server-signed jury approval. The amount
// and description come from the signature, never from the client.

import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyApproval } from "@/lib/payments/approval";
import { createOrder, PayPalError } from "@/lib/payments/paypal";
import { readJsonBody } from "@/lib/utils/readJsonBody";

const bodySchema = z.object({ approvalToken: z.string().min(1).max(4_096) });

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req, 8 * 1024);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });

  const parsed = bodySchema.safeParse(body.value);
  const approval = parsed.success ? verifyApproval(parsed.data.approvalToken) : null;
  if (!approval) {
    return Response.json({ error: "This approval is invalid or expired. Run the review again." }, { status: 403 });
  }

  try {
    return Response.json({ id: await createOrder(approval) });
  } catch (err) {
    console.error("[/api/paypal/orders]", err);
    const status = err instanceof PayPalError ? err.status : 500;
    return Response.json({ error: "Could not create the PayPal order. Please try again." }, { status });
  }
}
