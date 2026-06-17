"use client";

import { apiBaseUrl, apiFetch } from "@/lib/api";

export type PaymentStatus =
  | "pending_payment"
  | "payment_verification_pending"
  | "payment_rejected"
  | "confirmed"
  | "cod_confirmed"
  | "upi_pending"
  | "partially_paid"
  | "failed";

export type PaymentSession = {
  _id: string;
  orderReference: string;
  method: "razorpay" | "cod" | "manual_bank_transfer" | "upi";
  status: PaymentStatus;
  amount: number;
  payableNow: number;
  paidAmount: number;
  outstandingAmount: number;
  currencyCode: string;
  paymentMode: "full" | "advance" | "balance";
  razorpayOrderId?: string;
  codManualReviewRequired?: boolean;
  upiId?: string;
  upiReference?: string;
  rejectionReason?: string;
  createdAt?: string;
};

export type PaymentHistoryItem = {
  _id: string;
  orderReference: string;
  method: string;
  event: string;
  amount: number;
  currencyCode: string;
  gatewayTransactionId?: string;
  actorType: "customer" | "admin" | "system";
  createdAt?: string;
};

export async function paymentFetch<T>(
  path: string,
  accessToken: string | undefined,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, { ...options, accessToken });
}

export async function uploadPaymentScreenshot(formData: FormData, accessToken?: string) {
  formData.set("context", "payment-screenshot");
  formData.set("aspectRatio", String(formData.get("aspectRatio") || "4:5"));
  formData.set("objectFit", "contain");

  const response = await fetch(`${apiBaseUrl}/media/upload`, {
    body: formData,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Payment screenshot upload failed");
  }

  return response.json() as Promise<{
    media: { secureUrl: string; selectedAspectRatio?: string; altText?: string };
  }>;
}

export function formatPaymentMoney(value: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
