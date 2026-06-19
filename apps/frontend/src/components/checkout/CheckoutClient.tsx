"use client";

import { CreditCard, PackageCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import {
  confirmCheckoutRazorpayPayment,
  checkoutPreview,
  createCheckoutOrder,
  fetchRazorpayCheckoutConfig,
  type CheckoutAddress,
  type CheckoutOrderResponse,
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

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
};

type RazorpayConstructor = new (options: {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  key: string;
  modal?: { ondismiss?: () => void };
  name: string;
  order_id: string;
  prefill?: { contact?: string; email?: string; name?: string };
  theme?: { color?: string };
}) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const paymentMethods: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  icon: LucideIcon;
}> = [
  { icon: CreditCard, label: "Razorpay", value: "razorpay" },
  { icon: Truck, label: "COD", value: "cod" },
  // { icon: Landmark, label: "Bank Transfer", value: "manual_bank_transfer" },
  // { icon: QrCode, label: "UPI", value: "upi" },
];

export function CheckoutClient() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setCartStore = useCartStore((state) => state.setCart);
  const formRef = useRef<HTMLFormElement>(null);
  const lastPincodeLookupRef = useRef("");
  const [cart, setCart] = useState<Cart>();
  const [step, setStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("razorpay");
  const [paymentMode, setPaymentMode] = useState<"full" | "advance" | "balance">("full");
  const [addressDraft, setAddressDraft] = useState({
    city: "",
    countryCode: "IN",
    postalCode: "",
    region: "",
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>();
  const [preview, setPreview] = useState<CheckoutPreview>();
  const [message, setMessage] = useState("");
  const [pincodeMessage, setPincodeMessage] = useState("");
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
  const preOrderLine = cart?.items.find((item) => item.preOrder?.enabled);
  const requiredPaymentMode =
    preOrderLine?.preOrder?.paymentMode ??
    (preOrderLine?.preOrder?.advancePercent ? "advance" : "full");
  const payableNow = cart ? calculateCheckoutPayableNow(cart, preview) : undefined;
  const showPayableNow =
    Boolean(payableNow) &&
    (preview
      ? payableNow! < preview.totals.grandTotal
      : Boolean(cart && payableNow! < cart.totals.grandTotal));
  const balanceLater =
    preview && payableNow !== undefined
      ? Math.max(0, preview.totals.grandTotal - payableNow)
      : undefined;

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

  useEffect(() => {
    if (step !== 3 || !formRef.current || preview) {
      return;
    }

    void refreshPreview(new FormData(formRef.current), true);
  }, [preview, step]);

  useEffect(() => {
    const postalCode = addressDraft.postalCode.trim();

    if (!postalCode) {
      setPincodeMessage("");
      lastPincodeLookupRef.current = "";
      return;
    }

    if (!/^\d{0,6}$/.test(postalCode)) {
      setPincodeMessage("Pincode must contain digits only.");
      return;
    }

    if (postalCode.length < 6) {
      setPincodeMessage("");
      return;
    }

    if (postalCode === lastPincodeLookupRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void lookupPincode(postalCode);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [addressDraft.postalCode]);

  useEffect(() => {
    if (!hasPreOrder) {
      return;
    }

    setPaymentMode(requiredPaymentMode);
    if (paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [hasPreOrder, paymentMethod, requiredPaymentMode]);

  async function refreshPreview(formData: FormData, automatic = false) {
    const requiredError = validateRequiredCheckoutFields(formData);
    if (requiredError) {
      setPreview(undefined);
      setStep(1);
      setMessage(requiredError);
      return;
    }

    setMessage(automatic ? "Calculating review total..." : "Refreshing total...");
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
      setMessage(automatic ? "" : "Total refreshed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout preview failed");
    }
  }

  async function goNext() {
    const form = formRef.current;
    if ((step === 1 || step === 2) && form && !form.reportValidity()) {
      return;
    }

    if (step === 2 && form) {
      await refreshPreview(new FormData(form), true);
      return;
    }

    setStep((current) => Math.min(3, current + 1));
  }

  async function lookupPincode(postalCode: string) {
    const normalized = postalCode.trim();

    if (!/^\d{6}$/.test(normalized)) {
      setPincodeMessage("Enter a valid 6-digit Indian pincode.");
      return;
    }

    lastPincodeLookupRef.current = normalized;
    setPincodeMessage("Looking up city and state...");
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`);
      const [payload] = (await response.json()) as Array<{
        Status?: string;
        PostOffice?: Array<{ District?: string; State?: string }>;
      }>;
      const postOffice = payload?.PostOffice?.[0];

      if (payload?.Status !== "Success" || !postOffice) {
        setPincodeMessage("Pincode lookup failed. Please enter city and state manually.");
        return;
      }

      setAddressDraft({
        city: postOffice.District ?? "",
        countryCode: "IN",
        postalCode: normalized,
        region: postOffice.State ?? "",
      });
      setPincodeMessage("City and state filled from pincode.");
    } catch {
      setPincodeMessage("Pincode lookup unavailable. Please enter city and state manually.");
    }
  }

  async function openRazorpayCheckout(result: CheckoutOrderResponse, payload: CheckoutPayload) {
    if (!result.gatewayOrder?.id) {
      setMessage("Razorpay order was not created. Please try another payment method.");
      return;
    }

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
      description: `Order ${result.order.orderNumber}`,
      handler: (response) => {
        void (async () => {
          setMessage("Verifying Razorpay payment...");
          await confirmCheckoutRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          router.push(`/checkout/confirmation/${result.order.orderNumber}`);
        })().catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : "Razorpay verification failed");
        });
      },
      key: config.keyId,
      modal: {
        ondismiss: () => {
          setMessage("Razorpay payment was closed. Your order is still pending payment.");
        },
      },
      name: "The Vastra House",
      order_id: result.gatewayOrder.id,
      prefill: {
        contact: payload.shippingAddress.phone,
        email: payload.guestEmail,
        name: payload.shippingAddress.fullName,
      },
      theme: { color: "#8b1e2d" },
    });

    checkout.open();
  }

  async function placeOrder(formData: FormData) {
    setIsSubmitting(true);
    setMessage("Creating order...");
    try {
      const requiredError = validateRequiredCheckoutFields(formData);
      if (requiredError) {
        setPreview(undefined);
        setStep(1);
        setMessage(requiredError);
        return;
      }

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
      if (payload.paymentMethod === "razorpay") {
        await openRazorpayCheckout(result, payload);
        return;
      }

      router.push(`/checkout/confirmation/${result.order.orderNumber}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order creation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={placeOrder} className="grid gap-4 lg:grid-cols-[1fr_330px]">
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
                      className="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[76px_1fr_auto]"
                      key={item._id}
                    >
                      <div className="overflow-hidden rounded-md border border-border bg-muted">
                        {item.media?.url ? (
                          <ResponsiveImage
                            alt={item.media.altText ?? item.productName}
                            aspectRatio={item.media.aspectRatio ?? "1/1"}
                            src={item.media.url}
                          />
                        ) : (
                          <div className="grid aspect-square place-items-center px-2 text-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-muted-foreground">
                          {item.sku} · Qty {item.quantity} ·{" "}
                          {item.preOrder?.enabled
                            ? `Pre-order, ${
                                item.preOrder.paymentMode ??
                                (item.preOrder.advancePercent ? "advance" : "full")
                              } payment`
                            : "Ready stock"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {item.color ? <span>Color: {item.color}</span> : null}
                          {item.size ? <span>Size: {item.size}</span> : null}
                          {item.barcode ? <span>Barcode: {item.barcode}</span> : null}
                          <span>Stock checked: {item.stockSnapshot}</span>
                          {item.gstRate ? <span>GST {item.gstRate}% included</span> : null}
                          {item.hsnCode ? <span>HSN {item.hsnCode}</span> : null}
                        </div>
                        {item.preOrder?.enabled ? (
                          <div className="mt-2 grid gap-1 rounded-md bg-primary/5 p-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>
                              Advance due now:{" "}
                              {formatMoney(calculateLinePayableNow(item), item.currencyCode)}
                            </span>
                            <span>
                              Balance later:{" "}
                              {formatMoney(
                                Math.max(
                                  0,
                                  item.unitPrice * item.quantity - calculateLinePayableNow(item),
                                ),
                                item.currencyCode,
                              )}
                            </span>
                            {item.preOrder.expectedDispatchAt ? (
                              <span>
                                Dispatch: {formatCheckoutDate(item.preOrder.expectedDispatchAt)}
                              </span>
                            ) : null}
                            {item.preOrder.expectedDeliveryAt ? (
                              <span>
                                Delivery: {formatCheckoutDate(item.preOrder.expectedDeliveryAt)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
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
              <Field
                inputMode="numeric"
                label="Pincode"
                maxLength={6}
                name="postalCode"
                onChange={(event) =>
                  setAddressDraft((current) => ({ ...current, postalCode: event.target.value }))
                }
                pattern="\d{6}"
                required
                value={addressDraft.postalCode}
              />
              <Field
                label="Country"
                maxLength={2}
                name="countryCode"
                onChange={(event) =>
                  setAddressDraft((current) => ({
                    ...current,
                    countryCode: event.target.value.toUpperCase(),
                  }))
                }
                required
                value={addressDraft.countryCode}
              />
              {pincodeMessage ? (
                <p className="text-xs font-medium text-muted-foreground sm:col-span-2">
                  {pincodeMessage}
                </p>
              ) : null}
              <Field
                label="City"
                name="city"
                onChange={(event) =>
                  setAddressDraft((current) => ({ ...current, city: event.target.value }))
                }
                required
                value={addressDraft.city}
              />
              <Field
                label="State"
                name="region"
                onChange={(event) =>
                  setAddressDraft((current) => ({ ...current, region: event.target.value }))
                }
                required
                value={addressDraft.region}
              />
              <Field
                defaultValue={defaultAddress.fullName}
                label="Full name"
                name="fullName"
                required
              />
              <Field label="Email" name="guestEmail" required type="email" />
              <Field defaultValue={defaultAddress.phone} label="Phone" name="phone" required />
              <Field
                className="sm:col-span-2"
                defaultValue={defaultAddress.line1}
                label="Address line 1"
                name="line1"
                required
              />
              <Field className="sm:col-span-2" label="Address line 2" name="line2" />
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
              {/* Express is intentionally disabled until final shipping charges and SLA rules are configured. */}
              <OptionButton
                disabled
                checked={shippingMethod === "express"}
                label="Express (coming soon)"
                name="shippingMethod"
                onChange={() => undefined}
                value="express"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Standard shipping is selected for now. Express will be enabled after shipping charges
              are finalized.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const disabled = hasPreOrder && method.value === "cod";

                return (
                  <label
                    className={`flex items-center gap-3 rounded-md border p-3 text-sm font-semibold ${
                      disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
                    } ${
                      paymentMethod === method.value && !disabled
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border"
                    }`}
                    key={method.value}
                  >
                    <input
                      checked={paymentMethod === method.value}
                      className="sr-only"
                      disabled={disabled}
                      name="paymentMethod"
                      onChange={() => {
                        if (!disabled) {
                          setPaymentMethod(method.value);
                        }
                      }}
                      type="radio"
                      value={method.value}
                    />
                    <Icon aria-hidden="true" size={17} />
                    {method.label}
                    {disabled ? (
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                        Disabled
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {hasPreOrder ? (
              <p className="mt-2 text-xs text-muted-foreground">
                COD is disabled for pre-order bookings. Payment mode is locked from the selected
                product setup.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Payment mode
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border px-3"
                  disabled={hasPreOrder}
                  name="paymentMode"
                  onChange={(event) =>
                    setPaymentMode(event.target.value as "full" | "advance" | "balance")
                  }
                  value={hasPreOrder ? requiredPaymentMode : paymentMode}
                >
                  <option value="full">Full</option>
                  <option value="advance">Advance</option>
                  <option value="balance">Balance</option>
                </select>
              </label>
              {hasPreOrder ? (
                <input name="paymentMode" type="hidden" value={requiredPaymentMode} />
              ) : null}
              {hasPreOrder && payableNow !== undefined ? (
                <label className="text-sm font-medium">
                  Payable now
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border bg-muted/40 px-3"
                    name="payableNow"
                    readOnly
                    type="number"
                    value={payableNow}
                  />
                </label>
              ) : (
                <Field label="Payable now" min={1} name="payableNow" type="number" />
              )}
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
                {preview.items.map((item, index) => (
                  <div
                    className="grid gap-2 border-b border-border p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                    key={`${item.sku}-${item.purchaseMode ?? (item.preOrder?.enabled ? "pre_order" : "regular")}-${index}`}
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
                  title="Calculating review"
                  message="Complete the required address and payment details, then continue to review."
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
              label="Taxable value"
              value={formatMoney(preview.totals.taxableAmount, preview.totals.currencyCode)}
            />
            <TotalRow
              label="GST"
              value={formatMoney(preview.totals.gstAmount, preview.totals.currencyCode)}
            />
            <TotalRow
              label="Subtotal incl. GST"
              value={formatMoney(preview.totals.itemSubtotal, preview.totals.currencyCode)}
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
              {showPayableNow && payableNow !== undefined ? (
                <>
                  <p className="mb-3 rounded-md bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                    This checkout includes a pre-order. Pay the advance now; the remaining balance
                    will be collected before dispatch.
                  </p>
                  <TotalRow
                    label="Full order value"
                    value={formatMoney(preview.totals.grandTotal, preview.totals.currencyCode)}
                  />
                  <TotalRow
                    label="Balance later"
                    value={formatMoney(balanceLater ?? 0, preview.totals.currencyCode)}
                  />
                  <div className="mt-2">
                    <TotalRow
                      label="Pre-order advance due now"
                      strong
                      value={formatMoney(payableNow, preview.totals.currencyCode)}
                    />
                  </div>
                </>
              ) : (
                <TotalRow
                  label="Total"
                  strong
                  value={formatMoney(preview.totals.grandTotal, preview.totals.currencyCode)}
                />
              )}
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
          {step < 3 ? (
            <button
              className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              onClick={goNext}
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              className="h-10 rounded-md border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                if (formRef.current) {
                  void refreshPreview(new FormData(formRef.current));
                }
              }}
              type="button"
            >
              Recalculate
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

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(script);
  });
}

function validateRequiredCheckoutFields(formData: FormData) {
  const requiredFields: Array<[string, string]> = [
    ["postalCode", "Pincode"],
    ["city", "City"],
    ["region", "State"],
    ["countryCode", "Country"],
    ["fullName", "Full name"],
    ["guestEmail", "Email"],
    ["phone", "Phone"],
    ["line1", "Address line 1"],
  ];
  const missing = requiredFields
    .filter(([name]) => !String(formData.get(name) ?? "").trim())
    .map(([, label]) => label);

  if (missing.length) {
    return `Please complete required address details first: ${missing.join(", ")}.`;
  }

  const email = String(formData.get("guestEmail") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address for booking confirmation.";
  }

  const postalCode = String(formData.get("postalCode") ?? "").trim();
  if (!/^\d{6}$/.test(postalCode)) {
    return "Please enter a valid 6-digit pincode.";
  }

  return "";
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
  required,
  ...props
}: Readonly<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  }
>) {
  return (
    <label className={`text-sm font-medium ${className}`}>
      {label}
      {required ? <span className="ml-1 text-primary">*</span> : null}
      <input
        className="mt-2 h-10 w-full rounded-md border border-border px-3"
        required={required}
        {...props}
      />
    </label>
  );
}

function OptionButton({
  checked,
  disabled = false,
  label,
  name,
  onChange,
  value,
}: Readonly<{
  checked: boolean;
  disabled?: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}>) {
  return (
    <label
      className={`rounded-md border p-3 text-sm font-semibold ${
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      } ${checked ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
    >
      <input
        checked={checked}
        className="sr-only"
        disabled={disabled}
        name={name}
        onChange={() => {
          if (!disabled) {
            onChange();
          }
        }}
        type="radio"
        value={value}
      />
      {label}
    </label>
  );
}

function calculateCheckoutPayableNow(cart: Cart, preview?: CheckoutPreview) {
  const itemPayable = cart.items.reduce((total, item) => {
    return total + calculateLinePayableNow(item);
  }, 0);

  const totals = preview?.totals ?? cart.totals;
  const shippingFee = "shippingFee" in totals ? totals.shippingFee : 0;
  const discountTotal = "discountTotal" in totals ? totals.discountTotal : 0;
  const storeCreditApplied = "storeCreditApplied" in totals ? totals.storeCreditApplied : 0;
  const rewardValueApplied = "rewardValueApplied" in totals ? totals.rewardValueApplied : 0;
  const payable =
    itemPayable +
    totals.giftPackagingFee +
    shippingFee -
    totals.giftCardDiscount -
    discountTotal -
    storeCreditApplied -
    rewardValueApplied;

  return Math.max(0, Math.min(totals.grandTotal, Math.round(payable)));
}

function calculateLinePayableNow(item: Cart["items"][number]) {
  const lineTotal = item.unitPrice * item.quantity;
  if (!item.preOrder?.enabled) {
    return lineTotal;
  }

  const isAdvance =
    item.preOrder.paymentMode === "advance" || Boolean(item.preOrder.advancePercent);
  const percent = isAdvance ? (item.preOrder.advancePercent ?? 0) : 100;

  return Math.round((lineTotal * percent) / 100);
}

function formatCheckoutDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date(value));
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
