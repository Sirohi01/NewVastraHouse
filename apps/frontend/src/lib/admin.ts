import { apiFetch } from "@/lib/api";

export type AdminDashboardSummary = {
  activePreOrders: number;
  inventory: {
    available: number;
    damaged: number;
    incoming: number;
    reserved: number;
  };
  lowStockAlerts: number;
  paymentVerification: number;
  pendingOrders: number;
  productCount: number;
  returnsQueue: number;
};

export function fetchAdminDashboard(accessToken?: string) {
  return apiFetch<{ summary: AdminDashboardSummary }>("/admin/dashboard", { accessToken });
}
