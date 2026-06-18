"use client";

import { apiFetch } from "@/lib/api";

export type StockLedger = {
  _id: string;
  sku: string;
  warehouseId: string;
  available: number;
  reserved: number;
  damaged: number;
  returned: number;
  incoming: number;
  lowStockThreshold: number;
};

export type LowStockAlert = {
  _id: string;
  sku: string;
  warehouseId: string;
  threshold: number;
  available: number;
  status: "open" | "resolved";
  triggeredAt?: string;
  resolvedAt?: string;
};

export type InventoryLog = {
  _id: string;
  sku: string;
  warehouseId: string;
  eventType: string;
  quantity: number;
  reasonCode?: string;
  referenceType?: string;
  referenceId?: string;
  actorType: "customer" | "admin" | "system";
  createdAt?: string;
};

export type StockTransfer = {
  _id: string;
  transferNumber: string;
  sku: string;
  quantity: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: "in_transit" | "received" | "cancelled";
  initiatedAt?: string;
  receivedAt?: string;
};

export function inventoryFetch<T>(
  path: string,
  accessToken: string | undefined,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, { ...options, accessToken });
}
