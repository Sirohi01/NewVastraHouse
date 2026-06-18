"use client";

import { CreditCard, Landmark, QrCode, Truck } from "lucide-react";
import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  formatPaymentMoney,
  paymentFetch,
  uploadPaymentScreenshot,
  type PaymentSession,
} from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

type RazorpayCreateResponse = {
  gatewayOrder: { id: string; amount: number; currency: string; status?: string };
  session: PaymentSession;
};

export function PaymentMethodClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<PaymentSession>();
  const [gatewayOrderId, setGatewayOrderId] = useState("");

  async function createPayment(formData: FormData) {
    setMessage("Creating payment...");
    const method = String(formData.get("method"));
    const payload = {
      amount: Number(formData.get("amount")),
      currencyCode: "INR",
      orderReference: String(formData.get("orderReference")),
      payableNow: Number(formData.get("payableNow") || formData.get("amount")),
      paymentMode: String(formData.get("paymentMode")),
    };

    try {
      if (method === "razorpay") {
        const result = await paymentFetch<RazorpayCreateResponse>(
          "/payments/razorpay/orders",
          accessToken,
          {
            body: JSON.stringify(payload),
            method: "POST",
          },
        );
        setSession(result.session);
        setGatewayOrderId(result.gatewayOrder.id);
        setMessage(`Razorpay order created: ${result.gatewayOrder.id}`);
        return;
      }

      if (method === "manual_bank_transfer") {
        const uploadForm = new FormData();
        const file = formData.get("screenshot");
        if (file instanceof File && file.size > 0) {
          uploadForm.set("file", file);
          uploadForm.set("altText", `Payment proof ${payload.orderReference}`);
          const upload = await uploadPaymentScreenshot(uploadForm, accessToken);
          const result = await paymentFetch<{ session: PaymentSession }>(
            "/payments/manual",
            accessToken,
            {
              body: JSON.stringify({
                ...payload,
                manualScreenshot: {
                  altText: upload.media.altText,
                  aspectRatio: upload.media.selectedAspectRatio,
                  type: "image",
                  url: upload.media.secureUrl,
                },
              }),
              method: "POST",
            },
          );
          setSession(result.session);
          setMessage("Manual payment submitted for verification");
          return;
        }
        setMessage("Screenshot is required for manual payment");
        return;
      }

      const endpoint = method === "cod" ? "/payments/cod" : "/payments/upi";
      const result = await paymentFetch<{ session: PaymentSession }>(endpoint, accessToken, {
        body: JSON.stringify({
          ...payload,
          ...(method === "upi" ? { upiReference: formData.get("upiReference") || undefined } : {}),
        }),
        method: "POST",
      });
      setSession(result.session);
      setMessage(`${method.toUpperCase()} payment flow created`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment request failed");
    }
  }

  async function confirmRazorpay(formData: FormData) {
    setMessage("Verifying Razorpay payment...");
    try {
      const result = await paymentFetch<{ session: PaymentSession }>(
        "/payments/razorpay/confirm",
        accessToken,
        {
          body: JSON.stringify({
            razorpayOrderId: formData.get("razorpayOrderId"),
            razorpayPaymentId: formData.get("razorpayPaymentId"),
            razorpaySignature: formData.get("razorpaySignature"),
          }),
          method: "POST",
        },
      );
      setSession(result.session);
      setMessage("Razorpay payment verified server-side");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed");
    }
  }

  return (
    <ProtectedRoute>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          action={createPayment}
          className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-soft"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Order Reference
              <input
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                name="orderReference"
                required
              />
            </label>
            <label className="text-sm font-medium">
              Method
              <select
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                name="method"
              >
                <option value="razorpay">Razorpay</option>
                <option value="cod">COD</option>
                <option value="manual_bank_transfer">Manual Bank Transfer</option>
                <option value="upi">Direct UPI</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Total Amount
              <input
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                min="1"
                name="amount"
                required
                type="number"
              />
            </label>
            <label className="text-sm font-medium">
              Payable Now
              <input
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                min="1"
                name="payableNow"
                type="number"
              />
            </label>
            <label className="text-sm font-medium">
              Payment Mode
              <select
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                name="paymentMode"
              >
                <option value="full">Full</option>
                <option value="advance">Advance</option>
                <option value="balance">Balance</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Manual Screenshot
              <input
                className="mt-2 block w-full rounded-md border border-border p-2"
                name="screenshot"
                type="file"
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              UPI Reference
              <input
                className="mt-2 h-11 w-full rounded-md border border-border px-3"
                name="upiReference"
              />
            </label>
          </div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <CreditCard aria-hidden="true" size={18} />
            Create Payment
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">
            Payment Status
          </h2>
          {session ? (
            <dl className="mt-4 grid gap-3 text-sm">
              <StatusRow label="Order" value={session.orderReference} />
              <StatusRow label="Method" value={session.method} />
              <StatusRow label="Status" value={session.status} />
              <StatusRow
                label="Payable"
                value={formatPaymentMoney(session.payableNow, session.currencyCode)}
              />
              <StatusRow
                label="Paid"
                value={formatPaymentMoney(session.paidAmount, session.currencyCode)}
              />
              <StatusRow
                label="Outstanding"
                value={formatPaymentMoney(session.outstandingAmount, session.currencyCode)}
              />
              {session.upiId ? <StatusRow label="UPI ID" value={session.upiId} /> : null}
              {session.codManualReviewRequired ? (
                <StatusRow label="COD Review" value="Required" />
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No payment session yet.</p>
          )}
          <div className="mt-5 grid grid-cols-4 gap-2 text-muted-foreground">
            <CreditCard aria-hidden="true" />
            <Truck aria-hidden="true" />
            <Landmark aria-hidden="true" />
            <QrCode aria-hidden="true" />
          </div>
          {message ? <p className="mt-4 text-sm font-semibold text-accent">{message}</p> : null}
        </aside>

        <form
          action={confirmRazorpay}
          className="rounded-lg border border-border bg-card p-5 shadow-soft lg:col-span-2"
        >
          <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">
            Razorpay Server Verification
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className="h-11 rounded-md border border-border px-3"
              defaultValue={gatewayOrderId}
              name="razorpayOrderId"
              placeholder="Order ID"
            />
            <input
              className="h-11 rounded-md border border-border px-3"
              name="razorpayPaymentId"
              placeholder="Payment ID"
            />
            <input
              className="h-11 rounded-md border border-border px-3"
              name="razorpaySignature"
              placeholder="Signature"
            />
          </div>
          <button className="mt-4 h-11 rounded-md border border-primary px-4 font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
            Verify
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}

function StatusRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
