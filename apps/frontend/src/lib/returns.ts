"use client";

import { apiFetch } from "@/lib/api";

export type ReturnItem = {
  sku: string;
  productName: string;
  quantity: number;
  reason: string;
  unitPrice: number;
  lineSubtotal: number;
};

export type ReturnRequest = {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  status: "requested" | "approved" | "rejected" | "refunded";
  items: ReturnItem[];
  stockDisposition?: "restock" | "damaged";
  decisionNote?: string;
  creditNoteStatus: "not_required" | "queued";
  createdAt?: string;
};

export type RefundMethod = "original_payment" | "store_credit" | "bank_transfer";

export function createReturnRequest(
  payload: {
    orderNumber: string;
    items: Array<{ sku: string; quantity: number; reason: string }>;
  },
  accessToken?: string,
) {
  return apiFetch<{ returnRequest: ReturnRequest }>("/returns/requests", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function fetchAdminReturns(accessToken?: string) {
  return apiFetch<{ returns: ReturnRequest[] }>("/returns/admin", { accessToken });
}

export function approveAdminReturn(
  id: string,
  payload: {
    stockDisposition: "restock" | "damaged";
    refundMethod: RefundMethod;
    refundAmount?: number;
    note?: string;
  },
  accessToken?: string,
) {
  return apiFetch(`/returns/admin/${id}/approve`, {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function rejectAdminReturn(id: string, note: string, accessToken?: string) {
  return apiFetch<{ returnRequest: ReturnRequest }>(`/returns/admin/${id}/reject`, {
    accessToken,
    body: JSON.stringify({ note }),
    method: "POST",
  });
}
