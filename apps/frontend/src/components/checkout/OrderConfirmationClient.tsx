"use client";

import { CheckCircle2, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorState } from "@/components/states/ErrorState";
import {
  confirmCheckoutRazorpayPayment,
  createOrderBalancePayment,
  fetchCheckoutOrder,
  fetchRazorpayCheckoutConfig,
  type CheckoutOrder,
} from "@/lib/checkout";
import { formatMoney } from "@/lib/commerce";
import type { PaymentSession } from "@/lib/payments";
import { loadRazorpayScript } from "@/lib/razorpay";
import { createReturnRequest } from "@/lib/returns";
import { useAuthStore } from "@/stores/authStore";

export function OrderConfirmationClient({ orderNumber }: Readonly<{ orderNumber: string }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [order, setOrder] = useState<CheckoutOrder>();
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>();
  const [message, setMessage] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [isPayingBalance, setIsPayingBalance] = useState(false);

  async function loadOrder() {
    try {
      const result = await fetchCheckoutOrder(orderNumber, accessToken);
      setOrder(result.order);
      setPaymentSession(result.paymentSession ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not load");
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [accessToken, orderNumber]);

  async function payBalanceNow() {
    setIsPayingBalance(true);
    setMessage("");
    try {
      const result = await createOrderBalancePayment(orderNumber, undefined, accessToken);
      const config = await fetchRazorpayCheckoutConfig();

      if (!config.keyId) {
        setMessage("Razorpay key is not configured. Add RAZORPAY_KEY_ID in settings or .env.");
        return;
      }

      if (!config.gatewayEnabled || result.gatewayOrder.id.startsWith("rzp_dev_")) {
        setMessage(
          "Razorpay gateway calls are disabled. Set RAZORPAY_ENABLE_GATEWAY_CALLS=true and restart backend.",
        );
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        setMessage("Razorpay checkout could not load. Please try again.");
        return;
      }

      const checkout = new window.Razorpay({
        amount: result.gatewayOrder.amount,
        currency: result.gatewayOrder.currency,
        description: `Balance payment for ${orderNumber}`,
        handler: (response) => {
          void (async () => {
            setMessage("Verifying balance payment...");
            await confirmCheckoutRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setMessage("Balance payment received. Thank you!");
            await loadOrder();
          })().catch((error: unknown) => {
            setMessage(
              error instanceof Error ? error.message : "Balance payment verification failed",
            );
          });
        },
        key: config.keyId,
        modal: {
          ondismiss: () => {
            setMessage("Balance payment was closed before completion.");
          },
        },
        name: "The Vastra House",
        order_id: result.gatewayOrder.id,
        prefill: {
          name: order?.shippingAddress.fullName,
        },
        theme: { color: "#8b1e2d" },
      });

      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start balance payment");
    } finally {
      setIsPayingBalance(false);
    }
  }

  async function submitReturn(formData: FormData) {
    if (!order) {
      return;
    }

    try {
      const result = await createReturnRequest(
        {
          items: [
            {
              quantity: Number(formData.get("quantity")),
              reason: String(formData.get("reason")),
              sku: String(formData.get("sku")),
            },
          ],
          orderNumber: order.orderNumber,
        },
        accessToken,
      );
      setReturnMessage(`Return requested: ${result.returnRequest.returnNumber}`);
    } catch (error) {
      setReturnMessage(error instanceof Error ? error.message : "Return request failed");
    }
  }

  return (
    <ProtectedRoute>
      {message ? <ErrorState title="Order unavailable" message={message} /> : null}
      {order ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <CheckCircle2 aria-hidden="true" className="text-success" size={34} />
            <h1 className="mt-4 font-serif text-3xl uppercase tracking-wide text-[#3d1620]">
              Order Confirmed
            </h1>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <InfoRow label="Order" value={order.orderNumber} />
              <InfoRow label="Status" value={order.status} />
              <InfoRow label="Payment" value={order.paymentMethod} />
              <InfoRow
                label="Payment mode"
                value={paymentSession?.paymentMode ?? order.paymentMode}
              />
              <InfoRow label="Shipping" value={order.shippingMethod} />
            </dl>
            <div className="mt-6 overflow-hidden rounded-md border border-border">
              {order.items.map((item) => (
                <div
                  className="grid gap-2 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                  key={item.sku}
                >
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {item.sku} · Qty {item.quantity} · HSN {item.hsnCode}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatMoney(item.lineSubtotal, item.currencyCode)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="text-primary" size={20} />
              <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">Summary</h2>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <InfoRow
                label="Items"
                value={formatMoney(order.totals.itemSubtotal, order.totals.currencyCode)}
              />
              <InfoRow
                label="GST"
                value={formatMoney(order.totals.gstAmount, order.totals.currencyCode)}
              />
              <InfoRow
                label="Shipping"
                value={formatMoney(order.totals.shippingFee, order.totals.currencyCode)}
              />
              <InfoRow
                label="Discounts"
                value={`-${formatMoney(
                  order.totals.discountTotal +
                    order.totals.giftCardDiscount +
                    order.totals.storeCreditApplied +
                    order.totals.rewardValueApplied,
                  order.totals.currencyCode,
                )}`}
              />
              <div className="border-t border-border pt-3">
                {paymentSession ? (
                  <>
                    <InfoRow
                      label="Full order value"
                      value={formatMoney(paymentSession.amount, paymentSession.currencyCode)}
                    />
                    <InfoRow
                      label="Payable now"
                      value={formatMoney(paymentSession.payableNow, paymentSession.currencyCode)}
                    />
                    <InfoRow
                      label="Paid received"
                      strong
                      value={formatMoney(paymentSession.paidAmount, paymentSession.currencyCode)}
                    />
                    <InfoRow
                      label="Remaining balance"
                      value={formatMoney(
                        paymentSession.outstandingAmount,
                        paymentSession.currencyCode,
                      )}
                    />
                    {paymentSession.outstandingAmount > 0 && order.paymentMethod === "razorpay" ? (
                      <button
                        className="mt-3 h-10 w-full rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPayingBalance}
                        onClick={() => void payBalanceNow()}
                        type="button"
                      >
                        {isPayingBalance ? "Starting payment..." : "Pay Balance Now"}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <InfoRow
                    label="Total"
                    strong
                    value={formatMoney(order.totals.grandTotal, order.totals.currencyCode)}
                  />
                )}
              </div>
            </dl>
            <Link
              className="mt-5 block h-11 rounded-md bg-primary px-4 py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              href="/shop"
            >
              Shop
            </Link>
          </aside>

          {order.status === "delivered" ? (
            <section className="rounded-lg border border-border bg-card p-5 shadow-soft lg:col-span-2">
              <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">
                Return Request
              </h2>
              <form
                action={submitReturn}
                className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_1fr_auto]"
              >
                <label className="text-sm font-medium">
                  Item
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-border px-3"
                    name="sku"
                  >
                    {order.items.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Qty
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border px-3"
                    min={1}
                    name="quantity"
                    required
                    type="number"
                  />
                </label>
                <label className="text-sm font-medium">
                  Reason
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border px-3"
                    name="reason"
                    required
                  />
                </label>
                <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Request
                </button>
              </form>
              {returnMessage ? (
                <p className="mt-3 text-sm text-muted-foreground">{returnMessage}</p>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : message ? null : (
        <p className="text-sm text-muted-foreground">Loading order...</p>
      )}
    </ProtectedRoute>
  );
}

function InfoRow({
  label,
  strong = false,
  value,
}: Readonly<{ label: string; strong?: boolean; value: string }>) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
