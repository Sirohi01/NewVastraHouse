"use client";

import { apiFetch } from "@/lib/api";
import { getGuestSessionId } from "@/lib/commerce";
import type { PaymentSession } from "@/lib/payments";

export type CheckoutAddress = {
  fullName?: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  phone?: string;
};

export type CheckoutTotals = {
  currencyCode: string;
  discountTotal: number;
  giftCardDiscount: number;
  giftPackagingFee: number;
  grandTotal: number;
  gstAmount: number;
  itemSubtotal: number;
  rewardValueApplied: number;
  shippingFee: number;
  storeCreditApplied: number;
  taxableAmount: number;
};

export type CheckoutLineItem = {
  productName: string;
  slug: string;
  sku: string;
  purchaseMode?: "regular" | "pre_order";
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  taxableAmount: number;
  gstAmount: number;
  gstRate: number;
  hsnCode: string;
  preOrder?: {
    enabled?: boolean;
    expectedDeliveryAt?: string;
    expectedDispatchAt?: string;
    paymentMode?: "full" | "advance";
  };
  currencyCode: string;
};

export type TaxBreakdown = {
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
};

export type CheckoutPreview = {
  items: CheckoutLineItem[];
  taxBreakdown: TaxBreakdown[];
  totals: CheckoutTotals;
  adjustments: Array<{ type: string; label: string; amount: number; code?: string }>;
};

export type CheckoutPaymentMethod = "razorpay" | "cod" | "manual_bank_transfer" | "upi";
export type CheckoutShippingMethod = "standard" | "express";
export type CheckoutPaymentMode = "full" | "advance" | "balance";

export type CheckoutPayload = {
  shippingAddress: CheckoutAddress;
  guestEmail?: string;
  billingAddress?: CheckoutAddress;
  shippingMethod: CheckoutShippingMethod;
  paymentMethod: CheckoutPaymentMethod;
  paymentMode?: CheckoutPaymentMode;
  payableNow?: number;
  couponCode?: string;
  storeCreditRequested?: number;
  rewardValueRequested?: number;
  manualScreenshot?: {
    url: string;
    type: "image";
    aspectRatio?: string;
    altText?: string;
  };
  upiReference?: string;
  notes?: string;
};

export type CheckoutOrder = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentMethod: CheckoutPaymentMethod;
  paymentMode: CheckoutPaymentMode;
  shippingMethod: CheckoutShippingMethod;
  shippingAddress: CheckoutAddress;
  billingAddress: CheckoutAddress;
  items: CheckoutLineItem[];
  taxBreakdown: TaxBreakdown[];
  totals: CheckoutTotals;
  stockReservations: Array<{ sku: string; quantity: number; status: string; reservedAt?: string }>;
  createdAt?: string;
};

export type CheckoutOrderResponse = {
  gatewayOrder?: {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    status?: string;
  };
  order: CheckoutOrder;
  paymentSession: PaymentSession;
};

export type RazorpayCheckoutConfig = {
  gatewayEnabled: boolean;
  keyId: string;
};

export type RazorpayConfirmPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export function checkoutPreview(
  payload: Omit<CheckoutPayload, "paymentMethod">,
  accessToken?: string,
) {
  return apiFetch<{ checkout: CheckoutPreview }>("/checkout/preview", {
    accessToken,
    body: JSON.stringify(payload),
    headers: { "X-Guest-Session-Id": getGuestSessionId() },
    method: "POST",
  });
}

export function createCheckoutOrder(payload: CheckoutPayload, accessToken?: string) {
  return apiFetch<CheckoutOrderResponse>("/checkout/orders", {
    accessToken,
    body: JSON.stringify(payload),
    headers: { "X-Guest-Session-Id": getGuestSessionId() },
    method: "POST",
  });
}

export function fetchRazorpayCheckoutConfig() {
  return apiFetch<RazorpayCheckoutConfig>("/checkout/razorpay/config");
}

export function confirmCheckoutRazorpayPayment(payload: RazorpayConfirmPayload) {
  return apiFetch<{ order: CheckoutOrder | null; session: PaymentSession }>(
    "/checkout/razorpay/confirm",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export function fetchCheckoutOrder(orderNumber: string, accessToken?: string) {
  return apiFetch<{ order: CheckoutOrder; paymentSession?: PaymentSession | null }>(
    `/checkout/orders/${orderNumber}`,
    { accessToken },
  );
}
