"use client";

import { CreditCard, Landmark, PackageCheck, QrCode, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
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
import { commerceFetch, formatMoney, type Cart } from "@/lib/commerce";
import {
  fetchPaymentSettings,
  uploadPaymentScreenshot,
  type PaymentSettings,
} from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const steps = ["Order Type", "Address", "Payment", "Review"] as const;

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
  const setCartStore = useCartStore((state) => state.setCart);
  const [cart, setCart] = useState<Cart>();
  const [step, setStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("razorpay");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>();
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

  const hasPreOrder = cart?.items.some((item) => item.preOrder?.enabled) ?? false;
  const hasReadyStock = cart?.items.some((item) => !item.preOrder?.enabled) ?? false;
  const requiredPaymentMode =
    cart?.items.find((item) => item.preOrder?.enabled)?.preOrder?.paymentMode ?? "full";

  useEffect(() => {
    async function loadCart() {
      try {
        const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart", { accessToken });
        setCart(payload.cart);
        setCartStore(payload.cart);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Cart could not load");
      }
    }

    void loadCart();
  }, [accessToken, setCartStore]);

  useEffect(() => {
    async function loadPaymentSettings() {
      try {
        const payload = await fetchPaymentSettings();
        setPaymentSettings(payload.settings);
      } catch {
        setPaymentSettings(undefined);
      }
    }

    void loadPaymentSettings();
  }, []);

  useEffect(() => {
    setMessage("");
  }, [paymentMethod, shippingMethod, step]);

  async function refreshPreview(formData: FormData) {
    setMessage("Refreshing total...");
    try {
      const payload = buildPayload(
        formData,
        defaultAddress,
        shippingMethod,
        paymentMethod,
        hasPreOrder ? requiredPaymentMode : undefined,
      );
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
      setStep(3);
      setMessage("Total refreshed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout preview failed");
    }
  }

  async function placeOrder(formData: FormData) {
    setIsSubmitting(true);
    setMessage("Creating order...");
    try {
      const payload = buildPayload(
        formData,
        defaultAddress,
        shippingMethod,
        paymentMethod,
        hasPreOrder ? requiredPaymentMode : undefined,
      );
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
    <form action={placeOrder} className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <div className="rounded-lg border border-border bg-card p-3 shadow-soft">
        <div className="grid gap-2 sm:grid-cols-4">
          {steps.map((label, index) => (
            <button
              className={`rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors ${
                step === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/70"
              }`}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span className="mr-2 opacity-70">{index + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4">
          <section className={step === 0 ? "block" : "hidden"}>
            <SectionTitle icon={PackageCheck} title="Order Type" />
            <div className="grid gap-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm font-semibold">
                  {hasPreOrder && hasReadyStock
                    ? "Mixed cart: ready stock + pre-order"
                    : hasPreOrder
                      ? "Pre-order checkout"
                      : "Direct ready-stock order"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Order type is detected from product availability and cannot be manually changed at
                  checkout.
                </p>
              </div>
              {cart?.items.length ? (
                <div className="overflow-hidden rounded-md border border-border">
                  {cart.items.map((item) => (
                    <div
                      className="grid gap-1 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                      key={item._id}
                    >
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-muted-foreground">
                          {item.sku} · Qty {item.quantity} ·{" "}
                          {item.preOrder?.enabled
                            ? `Pre-order, ${item.preOrder.paymentMode ?? "full"} payment`
                            : "Ready stock"}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatMoney(item.unitPrice * item.quantity, item.currencyCode)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Cart pending" message="Cart items will appear here." />
              )}
            </div>
          </section>

          <section className={step === 1 ? "block" : "hidden"}>
            <SectionTitle icon={PackageCheck} title="Address" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field defaultValue={defaultAddress.fullName} label="Full name" name="fullName" />
              <Field label="Email" name="guestEmail" required type="email" />
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

          <section className={step === 2 ? "block" : "hidden"}>
            <SectionTitle icon={Truck} title="Shipping & Payment" />
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Payment mode
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border px-3"
                  defaultValue={hasPreOrder ? requiredPaymentMode : "full"}
                  disabled={hasPreOrder}
                  name="paymentMode"
                >
                  <option value="full">Full</option>
                  <option value="advance">Advance</option>
                  <option value="balance">Balance</option>
                </select>
              </label>
              {hasPreOrder ? (
                <input name="paymentMode" type="hidden" value={requiredPaymentMode} />
              ) : null}
              <Field label="Payable now" min={1} name="payableNow" type="number" />
              {paymentMethod === "manual_bank_transfer" ? (
                <>
                  <PaymentInstruction settings={paymentSettings} type="bank" />
                  <label className="text-sm font-medium sm:col-span-2">
                    Payment proof
                    <input
                      className="mt-2 block w-full rounded-md border border-border p-2"
                      name="manualScreenshot"
                      type="file"
                    />
                  </label>
                </>
              ) : null}
              {paymentMethod === "upi" ? (
                <>
                  <PaymentInstruction settings={paymentSettings} type="upi" />
                  <Field className="sm:col-span-2" label="UPI reference" name="upiReference" />
                </>
              ) : null}
            </div>
          </section>

          <section className={step === 3 ? "block" : "hidden"}>
            <SectionTitle icon={CreditCard} title="Review" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Coupon" name="couponCode" />
              <label className="text-sm font-medium sm:col-span-2">
                Notes
                <textarea
                  className="mt-2 min-h-20 w-full rounded-md border border-border p-3"
                  name="notes"
                />
              </label>
            </div>
            {preview?.items.length ? (
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                {preview.items.map((item) => (
                  <div
                    className="grid gap-2 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                    key={item.sku}
                  >
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-muted-foreground">
                        {item.sku} · Qty {item.quantity} · GST {item.gstRate}%
                        {item.preOrder?.enabled ? " · Pre-order" : " · Direct order"}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatMoney(item.lineSubtotal, item.currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="Review total"
                  message="Click refresh total after address and shipping are filled."
                />
              </div>
            )}
          </section>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-soft lg:sticky lg:top-24">
        <h2 className="font-serif text-lg uppercase tracking-wide text-[#3d1620]">Order Summary</h2>
        {preview ? (
          <dl className="mt-4 grid gap-2 text-sm">
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
            <div className="border-t border-border pt-2">
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

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="h-10 rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Back
          </button>
          {step < 2 ? (
            <button
              className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              onClick={() => setStep((current) => Math.min(3, current + 1))}
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              className="h-10 rounded-md border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              formAction={refreshPreview}
              type="submit"
            >
              Refresh
            </button>
          )}
        </div>
        <button
          className="mt-2 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !preview}
          type="submit"
        >
          Place Order
        </button>
        {message ? <p className="mt-3 text-sm font-semibold text-accent">{message}</p> : null}
      </aside>
    </form>
  );
}

function SectionTitle({ icon: Icon, title }: Readonly<{ icon: LucideIcon; title: string }>) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon aria-hidden="true" className="text-primary" size={19} />
      <h2 className="font-serif text-lg uppercase tracking-wide text-[#3d1620]">{title}</h2>
    </div>
  );
}

function PaymentInstruction({
  settings,
  type,
}: Readonly<{ settings?: PaymentSettings; type: "bank" | "upi" }>) {
  if (!settings) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 text-sm sm:col-span-2">
      {type === "upi" ? (
        <>
          <p className="font-semibold">Pay to UPI ID</p>
          <p className="mt-1 text-muted-foreground">{settings.upiId}</p>
          {settings.upiQrImageUrl ? (
            <ResponsiveImage
              alt="UPI payment QR code"
              aspectRatio="1:1"
              className="mt-3 w-36 rounded-md border border-border"
              objectFit="contain"
              src={settings.upiQrImageUrl}
            />
          ) : null}
        </>
      ) : (
        <>
          <p className="font-semibold">Bank transfer details</p>
          <div className="mt-1 grid gap-1 text-muted-foreground">
            {settings.bankName ? <span>Bank: {settings.bankName}</span> : null}
            {settings.bankAccountName ? <span>Name: {settings.bankAccountName}</span> : null}
            {settings.bankAccountNumber ? <span>A/C: {settings.bankAccountNumber}</span> : null}
            {settings.bankIfsc ? <span>IFSC: {settings.bankIfsc}</span> : null}
          </div>
          {settings.manualInstructions ? (
            <p className="mt-2 text-muted-foreground">{settings.manualInstructions}</p>
          ) : null}
        </>
      )}
    </div>
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
      <input className="mt-2 h-10 w-full rounded-md border border-border px-3" {...props} />
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
      className={`cursor-pointer rounded-md border p-3 text-sm font-semibold ${
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
  lockedPaymentMode?: "full" | "advance",
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
    guestEmail: text(formData, "guestEmail") || undefined,
    notes: text(formData, "notes") || undefined,
    payableNow: numberOrUndefined(formData, "payableNow"),
    paymentMethod,
    paymentMode:
      lockedPaymentMode ??
      ((text(formData, "paymentMode") || "full") as "full" | "advance" | "balance"),
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
