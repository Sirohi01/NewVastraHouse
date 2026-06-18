import { apiFetch } from "@/lib/api";

export const productionStages = [
  "order_received",
  "fabric_sourcing",
  "cutting",
  "printing",
  "stitching",
  "finishing",
  "quality_check",
  "packaging",
  "dispatch",
] as const;

export type ProductionStage = (typeof productionStages)[number];

export type ProductionTracker = {
  _id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  sku: string;
  stage: ProductionStage;
  expectedDispatchAt?: string;
  expectedDeliveryAt?: string;
  history?: Array<{
    actorType: "customer" | "admin" | "system";
    createdAt?: string;
    note?: string;
    stage: ProductionStage;
  }>;
};

export function fetchAdminPreOrders(accessToken?: string, stage?: ProductionStage) {
  const query = stage ? `?stage=${stage}` : "";
  return apiFetch<{ trackers: ProductionTracker[] }>(`/pre-orders/admin${query}`, {
    accessToken,
  });
}

export function updateAdminPreOrderStage(
  payload: { note?: string; stage: ProductionStage; trackerIds: string[] },
  accessToken?: string,
) {
  return apiFetch<{ trackers: ProductionTracker[] }>("/pre-orders/admin/stage", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}
