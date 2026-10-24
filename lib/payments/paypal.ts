// ── PayPal Orders v2 client (sandbox only) ────────────────────────────────────
// Server-side only: the client secret never reaches the browser.

import type { Approval } from "./approval";

// shortcut: hard-wired to the sandbox host; add a PAYPAL_ENV switch before any live use.
const BASE = "https://api-m.sandbox.paypal.com";

export class PayPalError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function credentials(): { id: string; secret: string } | null {
  const id = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  if (!id || !secret || id.startsWith("your_") || secret.startsWith("your_")) return null;
  return { id, secret };
}

export const paypalConfigured = () => credentials() !== null;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const creds = credentials();
  if (!creds) throw new PayPalError("PayPal is not configured", 503);

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new PayPalError(`PayPal authentication failed (${res.status})`, 502);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

async function post<T>(path: string, body: unknown, requestId: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      // Idempotency: retries and double clicks return the same order/capture.
      "PayPal-Request-Id": requestId,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { name?: string };
  if (!res.ok) throw new PayPalError(`PayPal ${json.name ?? "error"} (${res.status})`, res.status >= 500 ? 502 : 422);
  return json;
}

/** Create a CAPTURE order for exactly the approved amount. Returns the order id. */
export async function createOrder(a: Approval): Promise<string> {
  const amount = a.amount.toFixed(2);
  const order = await post<{ id: string }>(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: a.decisionId,
          description: `${a.title} — ${a.merchant}`.slice(0, 127),
          amount: { currency_code: "USD", value: amount },
        },
      ],
    },
    `vp-order-${a.decisionId}-${amount}`
  );
  return order.id;
}

export interface CaptureResult {
  orderId: string;
  status: string;
  captureId: string | null;
  amount: string | null;
}

interface CaptureResponse {
  id: string;
  status: string;
  purchase_units?: { payments?: { captures?: { id: string; status: string; amount?: { value: string } }[] } }[];
}

/** Capture a buyer-approved order. */
export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const r = await post<CaptureResponse>(`/v2/checkout/orders/${orderId}/capture`, {}, `vp-capture-${orderId}`);
  const capture = r.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    orderId: r.id,
    status: capture?.status ?? r.status,
    captureId: capture?.id ?? null,
    amount: capture?.amount?.value ?? null,
  };
}
