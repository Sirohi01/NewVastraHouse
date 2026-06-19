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

export type AdminRevenueTrendPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type AdminOrderStatusBreakdownItem = {
  status: string;
  count: number;
};

export type AdminPaymentMethodBreakdownItem = {
  method: string;
  count: number;
  revenue: number;
};

export type AdminTopProduct = {
  sku: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type AdminDashboardCharts = {
  averageOrderValue30d: number;
  orderStatusBreakdown: AdminOrderStatusBreakdownItem[];
  paymentMethodBreakdown: AdminPaymentMethodBreakdownItem[];
  revenueTrend: AdminRevenueTrendPoint[];
  topProducts: AdminTopProduct[];
  totalOrders30d: number;
  totalRevenue30d: number;
};

export function fetchAdminDashboard(accessToken?: string) {
  return apiFetch<{ charts: AdminDashboardCharts; summary: AdminDashboardSummary }>(
    "/admin/dashboard",
    { accessToken },
  );
}
