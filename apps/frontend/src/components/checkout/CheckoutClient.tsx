"use client";

import { CreditCard, Landmark, PackageCheck, QrCode, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import {
  checkoutPreview,
  createCheckoutOrder,
  type CheckoutAddress,
  type CheckoutPayload,
  type CheckoutPaymentMethod,
  type CheckoutPreview,
  type CheckoutShippingMethod,
} from "@/lib/checkout";
import { formatMoney } from "@/lib/commerce";
import { uploadPaymentScreenshot } from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

const paymentMethods: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  icon: LucideIcon;
}> = [
  { icon: CreditCard, label: "Razorpay", value: "razorpay" },
  { icon: Truck, label: "COD", value: "cod" },
  { icon: Landmark, label: "Bank Transfer", value: "manual_bank_transfer" },
  { icon: QrCode, label: "UPI", value: "upi" },
];

export function CheckoutClient() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("razorpay");
  const [preview, setPreview] = useState<CheckoutPreview>();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAddress = useMemo<CheckoutAddress>(
    () => ({
      city: "",
      countryCode: "IN",
      fullName: "",
      line1: "",
      phone: "",
      postalCode: "",
      region: "",
    }),
    [],
  );

  useEffect(() => {
    setMessage("");
  }, [paymentMethod, shippingMethod]);

  async function refreshPreview(formData: FormData) {
    setMessage("Refreshing total...");
    try {
      const payload = buildPayload(formData, defaultAddress, shippingMethod, paymentMethod);
      const result = await checkoutPreview(
        {
          couponCode: payload.couponCode,
          notes: payload.notes,
          rewardValueRequested: payload.rewardValueRequested,
          shippingAddress: payload.shippingAddress,
          shippingMethod: payload.shippingMethod,
          storeCreditRequested: payload.storeCreditRequested,
        },
        accessToken,
      );
      setPreview(result.checkout);
      setMessage("Total refreshed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout preview failed");
    }
  }

  async function placeOrder(formData: FormData) {
    setIsSubmitting(true);
    setMessage("Creating order...");
    try {
      const payload = buildPayload(formData, defaultAddress, shippingMethod, paymentMethod);
      const file = formData.get("manualScreenshot");

      if (payload.paymentMethod === "manual_bank_transfer") {
        if (!(file instanceof File) || file.size === 0) {
          setMessage("Manual payment screenshot is required");
          setIsSubmitting(false);
          return;
        }

        const uploadForm = new FormData();
        uploadForm.set("file", file);
        uploadForm.set(
          "altText",
          `Payment proof ${payload.shippingAddress.fullName || "checkout"}`,
        );
        const upload = await uploadPaymentScreenshot(uploadForm, accessToken);
        payload.manualScreenshot = {
          altText: upload.media.altText,
          aspectRatio: upload.media.selectedAspectRatio,
          type: "image",
          url: upload.media.secureUrl,
        };
      }

      const result = await createCheckoutOrder(payload, accessToken);
      router.push(`/checkout/confirmation/${result.order.orderNumber}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order creation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <form action={placeOrder} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="text-accent" size={20} />
              <h2 className="text-lg font-semibold">Address</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field defaultValue={defaultAddress.fullName} label="Full name" name="fullName" />
              <Field defaultValue={defaultAddress.phone} label="Phone" name="phone" />
              <Field
                className="sm:col-span-2"
                defaultValue={defaultAddress.line1}
                label="Address line 1"
                name="line1"
                required
              />
              <Field className="sm:col-span-2" label="Address line 2" name="line2" />
              <Field defaultValue={defaultAddress.city} label="City" name="city" required />
              <Field defaultValue={defaultAddress.region} label="State" name="region" />
              <Field
                defaultValue={defaultAddress.postalCode}
                label="Postal code"
                name="postalCode"
              />
              <Field
                defaultValue={defaultAddress.countryCode}
                label="Country"
                maxLength={2}
                name="countryCode"
                required
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Truck aria-hidden="true" className="text-accent" size={20} />
              <h2 className="text-lg font-semibold">Shipping</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionButton
                checked={shippingMethod === "standard"}
                label="Standard"
                name="shippingMethod"
                onChange={() => setShippingMethod("standard")}
                value="standard"
              />
              <OptionButton
                checked={shippingMethod === "express"}
                label="Express"
                name="shippingMethod"
                onChange={() => setShippingMethod("express")}
                value="express"
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard aria-hidden="true" className="text-accent" size={20} />
              <h2 className="text-lg font-semibold">Payment</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;

                return (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm font-semibold ${
                      paymentMethod === method.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border"
                    }`}
                    key={method.value}
                  >
                    <input
                      checked={paymentMethod === method.value}
                      className="sr-only"
                      name="paymentMethod"
                      onChange={() => setPaymentMethod(method.value)}
                      type="radio"
                      value={method.value}
                    />
                    <Icon aria-hidden="true" size={17} />
                    {method.label}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Payment mode
                <select
                  className="mt-2 h-11 w-full rounded-md border border-border px-3"
                  name="paymentMode"
                >
                  <option value="full">Full</option>
                  <option value="advance">Advance</option>
                  <option value="balance">Balance</option>
                </select>
              </label>
              <Field label="Payable now" min={1} name="payableNow" type="number" />
              {paymentMethod === "manual_bank_transfer" ? (
                <label className="text-sm font-medium sm:col-span-2">
                  Payment proof
                  <input
                    className="mt-2 block w-full rounded-md border border-border p-2"
                    name="manualScreenshot"
                    type="file"
                  />
                </label>
              ) : null}
              {paymentMethod === "upi" ? (
                <Field className="sm:col-span-2" label="UPI reference" name="upiReference" />
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Review</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Coupon" name="couponCode" />
              <Field label="Store credit" min={0} name="storeCreditRequested" type="number" />
              <Field label="Reward value" min={0} name="rewardValueRequested" type="number" />
              <label className="text-sm font-medium sm:col-span-3">
                Notes
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border p-3"
                  name="notes"
                />
              </label>
            </div>
            {preview?.items.length ? (
              <div className="mt-5 overflow-hidden rounded-md border border-border">
                {preview.items.map((item) => (
                  <div
                    className="grid gap-2 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                    key={item.sku}
                  >
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-muted-foreground">
                        {item.sku} · Qty {item.quantity} · GST {item.gstRate}%
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatMoney(item.lineSubtotal, item.currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Review total"
                  message="Refresh the order total before placing the order."
                />
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          {preview ? (
            <dl className="mt-5 grid gap-3 text-sm">
              <TotalRow
                label="Items"
                value={formatMoney(preview.totals.itemSubtotal, preview.totals.currencyCode)}
              />
              <TotalRow
                label="GST"
                value={formatMoney(preview.totals.gstAmount, preview.totals.currencyCode)}
              />
              <TotalRow
                label="Shipping"
                value={formatMoney(preview.totals.shippingFee, preview.totals.currencyCode)}
              />
              <TotalRow
                label="Gift packaging"
                value={formatMoney(preview.totals.giftPackagingFee, preview.totals.currencyCode)}
              />
              <TotalRow
                label="Discounts"
                value={`-${formatMoney(preview.totals.discountTotal + preview.totals.giftCardDiscount + preview.totals.storeCreditApplied + preview.totals.rewardValueApplied, preview.totals.currencyCode)}`}
              />
              <div className="border-t border-border pt-3">
                <TotalRow
                  label="Total"
                  strong
                  value={formatMoney(preview.totals.grandTotal, preview.totals.currencyCode)}
                />
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Server total pending.</p>
          )}
          <button
            className="mt-5 h-11 w-full rounded-md border border-primary px-4 font-semibold text-primary"
            formAction={refreshPreview}
            type="submit"
          >
            Refresh Total
          </button>
          <button
            className="mt-3 h-12 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            Place Order
          </button>
          {message ? <p className="mt-4 text-sm font-semibold text-accent">{message}</p> : null}
        </aside>
      </form>
    </ProtectedRoute>
  );
}

function Field({
  className = "",
  label,
  ...props
}: Readonly<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  }
>) {
  return (
    <label className={`text-sm font-medium ${className}`}>
      {label}
      <input className="mt-2 h-11 w-full rounded-md border border-border px-3" {...props} />
    </label>
  );
}

function OptionButton({
  checked,
  label,
  name,
  onChange,
  value,
}: Readonly<{
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}>) {
  return (
    <label
      className={`cursor-pointer rounded-md border p-4 text-sm font-semibold ${
        checked ? "border-primary bg-primary/5 text-primary" : "border-border"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      {label}
    </label>
  );
}

function TotalRow({
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

function buildPayload(
  formData: FormData,
  fallbackAddress: CheckoutAddress,
  shippingMethod: CheckoutShippingMethod,
  paymentMethod: CheckoutPaymentMethod,
): CheckoutPayload {
  const shippingAddress = {
    city: text(formData, "city") || fallbackAddress.city,
    countryCode: (text(formData, "countryCode") || fallbackAddress.countryCode).toUpperCase(),
    fullName: text(formData, "fullName") || undefined,
    line1: text(formData, "line1") || fallbackAddress.line1,
    line2: text(formData, "line2") || undefined,
    phone: text(formData, "phone") || undefined,
    postalCode: text(formData, "postalCode") || undefined,
    region: text(formData, "region") || undefined,
  };

  return {
    couponCode: text(formData, "couponCode") || undefined,
    notes: text(formData, "notes") || undefined,
    payableNow: numberOrUndefined(formData, "payableNow"),
    paymentMethod,
    paymentMode: (text(formData, "paymentMode") || "full") as "full" | "advance" | "balance",
    rewardValueRequested: numberOrUndefined(formData, "rewardValueRequested"),
    shippingAddress,
    shippingMethod,
    storeCreditRequested: numberOrUndefined(formData, "storeCreditRequested"),
    upiReference: text(formData, "upiReference") || undefined,
  };
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberOrUndefined(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
