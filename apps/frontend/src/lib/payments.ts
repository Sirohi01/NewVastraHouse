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

export type PaginatedPaymentSessions = {
  data: PaymentSession[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function fetchAdminPaymentSessions(
  input: { status?: PaymentStatus; search?: string; page?: number; limit?: number },
  accessToken?: string,
) {
  const params = new URLSearchParams();
  if (input.status) {
    params.set("status", input.status);
  }
  if (input.search) {
    params.set("search", input.search);
  }
  params.set("page", String(input.page ?? 1));
  params.set("limit", String(input.limit ?? 20));

  return apiFetch<PaginatedPaymentSessions>(`/payments/admin/sessions?${params.toString()}`, {
    accessToken,
  });
}

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

export type PaymentSettings = {
  upiId: string;
  upiQrImageUrl?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  manualInstructions?: string;
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

export function fetchPaymentSettings() {
  return apiFetch<{ settings: PaymentSettings }>("/payments/settings");
}

export function fetchAdminPaymentSettings(accessToken?: string) {
  return apiFetch<{ settings: PaymentSettings }>("/payments/admin/settings", { accessToken });
}

export function saveAdminPaymentSettings(settings: PaymentSettings, accessToken?: string) {
  return apiFetch<{ settings: PaymentSettings }>("/payments/admin/settings", {
    accessToken,
    body: JSON.stringify(settings),
    method: "PUT",
  });
}

export function formatPaymentMoney(value: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
