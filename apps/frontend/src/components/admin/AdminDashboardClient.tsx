"use client";

import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  IndianRupee,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AreaLineChart } from "@/components/admin/charts/AreaLineChart";
import { DonutChart, type DonutChartSlice } from "@/components/admin/charts/DonutChart";
import { HorizontalBarList } from "@/components/admin/charts/HorizontalBarList";
import {
  fetchAdminDashboard,
  type AdminDashboardCharts,
  type AdminDashboardSummary,
} from "@/lib/admin";
import { formatPaymentMoney } from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

const cards = [
  { key: "pendingOrders", href: "/admin/orders", icon: ClipboardList, label: "Pending Orders" },
  {
    key: "paymentVerification",
    href: "/admin/payments",
    icon: WalletCards,
    label: "Payment Queue",
  },
  {
    key: "lowStockAlerts",
    href: "/admin/inventory",
    icon: AlertTriangle,
    label: "Low Stock Alerts",
  },
  { key: "returnsQueue", href: "/admin/returns", icon: RotateCcw, label: "Returns Queue" },
  { key: "productCount", href: "/admin/products", icon: ShoppingBag, label: "Products" },
  { key: "activePreOrders", href: "/admin/pre-orders", icon: Package, label: "Active Pre-Orders" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  cancelled: "var(--color-destructive)",
  cod_confirmed: "var(--color-accent)",
  confirmed: "var(--color-accent)",
  delivered: "var(--color-success)",
  in_production: "var(--color-primary)",
  packed: "var(--color-primary)",
  payment_rejected: "var(--color-destructive)",
  payment_verification_pending: "var(--color-warning)",
  pending_payment: "var(--color-warning)",
  pre_order_confirmed: "var(--color-secondary)",
  ready_to_dispatch: "var(--color-primary)",
  refunded: "var(--color-muted-foreground)",
  returned: "var(--color-destructive)",
  shipped: "var(--color-success)",
};

const METHOD_COLORS: Record<string, string> = {
  cod: "var(--color-secondary)",
  manual_bank_transfer: "var(--color-accent)",
  razorpay: "var(--color-primary)",
  upi: "var(--color-success)",
};

export function AdminDashboardClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [summary, setSummary] = useState<AdminDashboardSummary>();
  const [charts, setCharts] = useState<AdminDashboardCharts>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    fetchAdminDashboard(accessToken)
      .then((payload) => {
        setSummary(payload.summary);
        setCharts(payload.charts);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Dashboard failed"),
      );
  }, [accessToken]);

  const revenueTrendPoints = (charts?.revenueTrend ?? []).map((point) => ({
    label: formatShortDate(point.date),
    value: point.revenue,
  }));
  const ordersTrendPoints = (charts?.revenueTrend ?? []).map((point) => ({
    label: formatShortDate(point.date),
    value: point.orders,
  }));
  const statusSlices: DonutChartSlice[] = (charts?.orderStatusBreakdown ?? []).map((item) => ({
    color: STATUS_COLORS[item.status] ?? "var(--color-muted-foreground)",
    key: item.status,
    label: labelStatus(item.status),
    value: item.count,
  }));
  const methodBars = (charts?.paymentMethodBreakdown ?? [])
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((item) => ({
      color: METHOD_COLORS[item.method] ?? "var(--color-primary)",
      key: item.method,
      label: labelStatus(item.method),
      sublabel: `${item.count} order${item.count === 1 ? "" : "s"}`,
      value: item.revenue,
    }));
  const topProductBars = (charts?.topProducts ?? []).map((item) => ({
    color: "var(--color-accent)",
    key: item.sku,
    label: item.productName,
    sublabel: `${item.sku} - ${item.quantity} sold`,
    value: item.revenue,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live operational view for completed modules.
          </p>
        </div>
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <HeadlineCard
          icon={IndianRupee}
          label="Revenue (30 days)"
          value={formatPaymentMoney(charts?.totalRevenue30d ?? 0)}
        />
        <HeadlineCard
          icon={Receipt}
          label="Orders (30 days)"
          value={String(charts?.totalOrders30d ?? 0)}
        />
        <HeadlineCard
          icon={TrendingUp}
          label="Avg. Order Value (30 days)"
          value={formatPaymentMoney(charts?.averageOrderValue30d ?? 0)}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Revenue - Last 14 Days</h2>
            <span className="text-xs text-muted-foreground">
              {ordersTrendPoints.reduce((sum, point) => sum + point.value, 0)} orders
            </span>
          </div>
          <AreaLineChart
            data={revenueTrendPoints}
            formatValue={(value) => formatPaymentMoney(value)}
          />
        </section>

        <section className="rounded-md border border-border bg-card p-4 shadow-soft">
          <h2 className="mb-3 text-lg font-semibold">Order Pipeline (30 days)</h2>
          <DonutChart slices={statusSlices} />
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4 shadow-soft">
          <h2 className="mb-3 text-lg font-semibold">Revenue by Payment Method</h2>
          <HorizontalBarList
            formatValue={(value) => formatPaymentMoney(value)}
            items={methodBars}
          />
        </section>

        <section className="rounded-md border border-border bg-card p-4 shadow-soft">
          <h2 className="mb-3 text-lg font-semibold">Top Products (30 days)</h2>
          <HorizontalBarList
            emptyMessage="No sales yet in this window."
            formatValue={(value) => formatPaymentMoney(value)}
            items={topProductBars}
          />
        </section>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = summary?.[card.key] ?? 0;

          return (
            <a
              className="rounded-md border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
              href={card.href}
              key={card.key}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-md bg-muted text-primary">
                  <Icon aria-hidden="true" size={18} />
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <section className="mt-4 rounded-md border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <Boxes aria-hidden="true" className="text-accent" size={18} />
          <h2 className="text-lg font-semibold">Inventory Summary</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {(["available", "reserved", "damaged", "incoming"] as const).map((key) => (
            <div className="rounded-md border border-border p-3" key={key}>
              <p className="text-sm capitalize text-muted-foreground">{key}</p>
              <p className="text-xl font-semibold">{summary?.inventory[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeadlineCard({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: typeof IndianRupee; label: string; value: string }>) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-md bg-muted text-primary">
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
    </div>
  );
}

function labelStatus(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
    new Date(`${value}T00:00:00`),
  );
}
