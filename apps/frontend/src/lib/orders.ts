"use client";

import { apiFetch } from "@/lib/api";
import type { CheckoutLineItem, CheckoutTotals } from "@/lib/checkout";
import type { ProductionTracker } from "@/lib/preOrders";

export const orderStatuses = [
  "pending_payment",
  "payment_verification_pending",
  "payment_rejected",
  "confirmed",
  "pre_order_confirmed",
  "cod_confirmed",
  "in_production",
  "packed",
  "ready_to_dispatch",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderShipment = {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
};

export type OrderTimelineEvent = {
  _id?: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  actorType: "customer" | "admin" | "system";
  note?: string;
  createdAt?: string;
};

export type OrderRecord = {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: string;
  paymentMode?: string;
  shippingMethod?: string;
  items?: CheckoutLineItem[];
  totals?: CheckoutTotals;
  shipment?: OrderShipment;
  createdAt?: string;
};

export type PaginatedOrders = {
  data: OrderRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type OrderDetailPayload = {
  order: OrderRecord;
  productionTrackers?: ProductionTracker[];
  timeline: OrderTimelineEvent[];
};

export function fetchAdminOrders(
  input: { status?: OrderStatus; search?: string; page?: number; limit?: number },
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

  return apiFetch<PaginatedOrders>(`/orders/admin?${params.toString()}`, { accessToken });
}

export function fetchAdminOrder(orderId: string, accessToken?: string) {
  return apiFetch<OrderDetailPayload>(`/orders/admin/${orderId}`, { accessToken });
}

export function updateAdminOrderStatus(
  orderId: string,
  payload: { toStatus: OrderStatus; note?: string },
  accessToken?: string,
) {
  return apiFetch<{ order: OrderRecord }>(`/orders/admin/${orderId}/status`, {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function bulkUpdateAdminOrders(
  payload: { status?: OrderStatus; orderNumbers?: string[]; toStatus: OrderStatus; note?: string },
  accessToken?: string,
) {
  return apiFetch<{ matched: number; updated: string[]; failed: Array<{ orderNumber: string }> }>(
    "/orders/admin/bulk-status",
    {
      accessToken,
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export function updateAdminOrderShipment(
  orderId: string,
  payload: { carrier: string; trackingNumber: string; trackingUrl?: string; note?: string },
  accessToken?: string,
) {
  return apiFetch<{ order: OrderRecord }>(`/orders/admin/${orderId}/shipment`, {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function cancelAdminOrder(orderId: string, note?: string, accessToken?: string) {
  return apiFetch<{ order: OrderRecord }>(`/orders/admin/${orderId}/cancel`, {
    accessToken,
    body: JSON.stringify({ note }),
    method: "POST",
  });
}

export function fetchTrackedOrder(orderNumber: string) {
  return apiFetch<OrderDetailPayload>(`/orders/track/${encodeURIComponent(orderNumber)}`);
}

export function formatOrderMoney(value?: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currencyCode,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value ?? 0);
}
