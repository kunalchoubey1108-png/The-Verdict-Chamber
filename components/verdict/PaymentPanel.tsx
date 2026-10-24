"use client";

import { useEffect, useRef, useState } from "react";
import type { PaymentRecord, VerdictCard } from "@/lib/types/verdict";
import type { MoneyDecision } from "@/lib/validation/decision";
import { fmtDateTime, fmtUSD } from "@/lib/utils/format";

// ── PayPal JS SDK (loaded once, sandbox via the sandbox client ID) ────────────

interface PayPalButtons {
  render(container: HTMLElement): Promise<void>;
  close(): Promise<void>;
}
interface PayPalNamespace {
  Buttons(options: {
    style?: Record<string, string>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }): PayPalButtons;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const PAYPAL_READY = CLIENT_ID !== "" && !CLIENT_ID.startsWith("your_");

let sdkPromise: Promise<PayPalNamespace> | null = null;
function loadPayPal(): Promise<PayPalNamespace> {
  sdkPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=USD&intent=capture`;
    script.onload = () => resolve((window as unknown as { paypal: PayPalNamespace }).paypal);
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Could not load PayPal. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Payment request failed.");
  return json;
}

// ── Receipt ───────────────────────────────────────────────────────────────────

export function PaymentReceipt({ payment }: { payment: PaymentRecord }) {
  const simulated = payment.status === "SIMULATED";
  const ok = simulated || payment.status === "COMPLETED";
  return (
    <section className="rounded-[18px] border-2 border-graphite bg-carbon p-5 space-y-3" aria-label="Payment receipt">
      <div className="flex items-center justify-between">
        <span className="font-tech text-[10px] uppercase tracking-widest text-raw-dim">
          {simulated ? "Payment // demo mode" : "Payment // PayPal sandbox"}
        </span>
        <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${ok ? "bg-cb-green text-white" : "bg-cb-amber text-black"}`}>
          {payment.status}
        </span>
      </div>
      <div className="font-display text-3xl text-paper-white tabular">{fmtUSD(payment.amount)}</div>
      <dl className="space-y-1 font-mono text-[11px] text-fog">
        {payment.orderId && <div>Order: <span className="text-bone">{payment.orderId}</span></div>}
        {payment.captureId && <div>Capture: <span className="text-bone">{payment.captureId}</span></div>}
        <div>{fmtDateTime(payment.at)}</div>
      </dl>
      {simulated && <p className="text-[11px] text-cb-amber">Simulated: PayPal credentials are not configured, so no order was created.</p>}
    </section>
  );
}

// ── Payment panel ─────────────────────────────────────────────────────────────

interface PaymentPanelProps {
  decision: MoneyDecision;
  verdict: VerdictCard;
  approvalToken: string | null;
  payment?: PaymentRecord;
  onPaid: (payment: PaymentRecord) => void;
}

export function PaymentPanel({ decision, verdict, approvalToken, payment, onPaid }: PaymentPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const amount = verdict.approvedAmount;

  useEffect(() => {
    if (!confirmed || !PAYPAL_READY || !approvalToken) return;
    let cancelled = false;
    let buttons: PayPalButtons | null = null;

    loadPayPal()
      .then((paypal) => {
        if (cancelled || !buttonsRef.current) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", label: "pay", shape: "rect" },
          createOrder: async () => {
            setError(null);
            try {
              return (await postJson<{ id: string }>("/api/paypal/orders", { approvalToken })).id;
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not create the PayPal order.");
              throw e;
            }
          },
          onApprove: async ({ orderID }) => {
            setBusy(true);
            try {
              const r = await postJson<{ orderId: string; status: string; captureId: string | null; amount: string | null }>(
                `/api/paypal/orders/${encodeURIComponent(orderID)}/capture`
              );
              onPaid({
                status: r.status,
                amount: r.amount ? Number(r.amount) : amount,
                orderId: r.orderId,
                captureId: r.captureId,
                at: new Date().toISOString(),
              });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not capture the payment.");
            } finally {
              setBusy(false);
            }
          },
          onCancel: () => setError("PayPal checkout was cancelled. Nothing was charged."),
          onError: () => setError((prev) => prev ?? "PayPal reported an error. Nothing was charged."),
        });
        return buttons.render(buttonsRef.current);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load PayPal."));

    return () => {
      cancelled = true;
      buttons?.close().catch(() => undefined);
    };
  }, [confirmed, approvalToken, amount, onPaid]);

  if (payment) return <PaymentReceipt payment={payment} />;

  if (verdict.outcome === "REJECT" || amount <= 0) {
    return (
      <section className="rounded-[18px] border-2 border-cb-red/40 bg-cb-red/10 p-5 space-y-1" aria-label="Payment">
        <div className="font-tech text-[10px] font-bold uppercase tracking-wider text-cb-red">No payment</div>
        <p className="text-sm text-bone">The jury rejected this decision, so no PayPal order can be created.</p>
        <p className="font-mono text-xs text-fog">{fmtUSD(decision.amount)} not spent.</p>
      </section>
    );
  }

  const misconfigured = PAYPAL_READY && !approvalToken;

  return (
    <section className="rounded-[18px] border-2 border-graphite bg-carbon p-5 space-y-4" aria-label="Payment">
      <div className="flex items-center justify-between">
        <span className="font-tech text-[10px] uppercase tracking-widest text-raw-dim">Step 2 // Confirm & pay</span>
        <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${PAYPAL_READY ? "bg-[#0070ba] text-white" : "bg-cb-amber text-black"}`}>
          {PAYPAL_READY ? "PayPal sandbox" : "Demo mode"}
        </span>
      </div>

      {!confirmed ? (
        <>
          <label className="flex items-start gap-3 text-sm text-bone">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#E28743]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>
              I confirm paying <strong>{fmtUSD(amount)}</strong> to <strong>{decision.merchant}</strong> for {decision.title}
              {verdict.outcome === "MODIFY" && <> on the jury&apos;s modified terms</>}.
            </span>
          </label>
          {misconfigured && (
            <p className="vc-error" role="alert">Payments are disabled: the server has no VERDICT_SIGNING_SECRET to sign this approval.</p>
          )}
          <button
            type="button"
            disabled={!checked || misconfigured}
            onClick={() =>
              PAYPAL_READY
                ? setConfirmed(true)
                : onPaid({ status: "SIMULATED", amount, orderId: null, captureId: null, at: new Date().toISOString() })
            }
            className="neo-btn-primary w-full justify-center py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PAYPAL_READY ? `Continue to PayPal (${fmtUSD(amount)})` : `Simulate payment of ${fmtUSD(amount)}`}
          </button>
          {!PAYPAL_READY && (
            <p className="text-[11px] text-fog">PayPal credentials are not configured, so this records a simulated payment only.</p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-fog">Pay {fmtUSD(amount)} with a PayPal sandbox buyer account.</p>
          <div ref={buttonsRef} className="min-h-[50px] rounded bg-white p-2" />
          {busy && <p className="font-mono text-xs text-cb-orange" role="status">Capturing payment…</p>}
        </div>
      )}

      {error && <p className="vc-error" role="alert">{error}</p>}
    </section>
  );
}
