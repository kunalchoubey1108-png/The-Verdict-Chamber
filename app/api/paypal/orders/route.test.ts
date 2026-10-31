import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as createOrderRoute } from "./route";
import { POST as captureRoute } from "./[id]/capture/route";
import { captureOrder, createOrder, PayPalError } from "@/lib/payments/paypal";
import { signApproval } from "@/lib/payments/approval";
import { makeDecision, makeVerdictCard } from "@/lib/test/fixtures";

vi.mock("@/lib/payments/paypal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments/paypal")>()),
  createOrder: vi.fn(),
  captureOrder: vi.fn(),
}));

const decision = makeDecision();

const modify = makeVerdictCard();

const postOrder = (body: unknown) =>
  createOrderRoute(
    new NextRequest("http://localhost/api/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

const postCapture = (id: string) =>
  captureRoute(new Request(`http://localhost/api/paypal/orders/x/capture`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => vi.stubEnv("VERDICT_SIGNING_SECRET", "a".repeat(64)));
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/paypal/orders", () => {
  it("refuses missing, forged, expired and foreign-secret approvals without creating an order", async () => {
    const valid = signApproval(decision, modify)!;
    const [payload, sig] = valid.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), amount: 1_188 })).toString("base64url");
    const expired = signApproval(decision, modify, Date.now() - 31 * 60 * 1000)!;
    vi.stubEnv("VERDICT_SIGNING_SECRET", "b".repeat(64));
    const foreign = signApproval(decision, modify)!;
    vi.stubEnv("VERDICT_SIGNING_SECRET", "a".repeat(64));

    for (const body of [{}, { approvalToken: "" }, { approvalToken: `${forged}.${sig}` }, { approvalToken: expired }, { approvalToken: foreign }]) {
      expect((await postOrder(body)).status).toBe(403);
    }
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("creates the order for the signed amount, ignoring any amount in the request body", async () => {
    vi.mocked(createOrder).mockResolvedValue("ORDER123");
    const res = await postOrder({ approvalToken: signApproval(decision, modify), amount: 99_999 });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "ORDER123" });
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ decisionId: "decision-1", amount: 99 }));
  });

  it("maps a PayPal failure to its status with a generic message", async () => {
    vi.mocked(createOrder).mockRejectedValue(new PayPalError("PayPal INTERNAL_SERVER_ERROR (500)", 502));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await postOrder({ approvalToken: signApproval(decision, modify) });

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Could not create the PayPal order. Please try again." });
  });
});

describe("POST /api/paypal/orders/[id]/capture", () => {
  it("rejects malformed order ids before calling PayPal", async () => {
    for (const id of ["../x", "abc", "A".repeat(40), "ORDER 123"]) {
      expect((await postCapture(id)).status).toBe(400);
    }
    expect(captureOrder).not.toHaveBeenCalled();
  });

  it("captures a well-formed order id", async () => {
    vi.mocked(captureOrder).mockResolvedValue({ orderId: "ORDER123", status: "COMPLETED", captureId: "CAP1", amount: "99.00" });
    const res = await postCapture("ORDER123");

    expect(res.status).toBe(200);
    expect(captureOrder).toHaveBeenCalledWith("ORDER123");
  });
});
