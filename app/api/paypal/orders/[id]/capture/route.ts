// ── POST /api/paypal/orders/[id]/capture ──────────────────────────────────────
// Captures an order the buyer approved in the PayPal popup. PayPal only lets
// this app capture orders created with its own credentials.

import { captureOrder, PayPalError } from "@/lib/payments/paypal";

const ORDER_ID = /^[A-Z0-9]{5,36}$/;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ORDER_ID.test(id)) return Response.json({ error: "Invalid order id." }, { status: 400 });

  try {
    return Response.json(await captureOrder(id));
  } catch (err) {
    console.error("[/api/paypal/orders/capture]", err);
    const status = err instanceof PayPalError ? err.status : 500;
    return Response.json({ error: "Could not capture the payment. Please try again." }, { status });
  }
}
