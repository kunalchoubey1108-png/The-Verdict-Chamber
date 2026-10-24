import { afterEach, describe, expect, it, vi } from "vitest";
import { captureOrder, createOrder, paypalConfigured } from "./paypal";
import type { Approval } from "./approval";

const approval: Approval = {
  decisionId: "decision-1",
  amount: 99,
  outcome: "MODIFY",
  title: "Design app",
  merchant: "Acme Design Co.",
  expiresAt: Date.now() + 60_000,
};

function mockPayPal(responses: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    const body = path === "/v1/oauth2/token" ? { access_token: "tok", expires_in: 3600 } : responses[path];
    return new Response(JSON.stringify(body ?? {}), { status: body ? 200 : 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("PayPal client", () => {
  it("treats missing or placeholder credentials as not configured", () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "your_paypal_sandbox_client_id_here");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "secret");
    expect(paypalConfigured()).toBe(false);
  });

  it("creates a sandbox order for exactly the approved amount with an idempotency key, then reuses the token", async () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "id");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "secret");
    const fetchMock = mockPayPal({ "/v2/checkout/orders": { id: "ORDER123" } });

    await expect(createOrder(approval)).resolves.toBe("ORDER123");
    await createOrder(approval);

    const orderCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/v2/checkout/orders"));
    const [url, init] = orderCalls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    expect(headers["PayPal-Request-Id"]).toBe("vp-order-decision-1-99.00");
    expect(JSON.parse(init.body as string).purchase_units[0].amount).toEqual({ currency_code: "USD", value: "99.00" });
    // One OAuth call for two orders: the access token is cached.
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/v1/oauth2/token"))).toHaveLength(1);
  });

  it("parses the capture result", async () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "id");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "secret");
    mockPayPal({
      "/v2/checkout/orders/ORDER123/capture": {
        id: "ORDER123",
        status: "COMPLETED",
        purchase_units: [{ payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { value: "99.00" } }] } }],
      },
    });

    await expect(captureOrder("ORDER123")).resolves.toEqual({
      orderId: "ORDER123",
      status: "COMPLETED",
      captureId: "CAP1",
      amount: "99.00",
    });
  });
});
