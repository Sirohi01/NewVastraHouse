"use client";

import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Package,
  RotateCcw,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAdminDashboard, type AdminDashboardSummary } from "@/lib/admin";
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

export function AdminDashboardClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [summary, setSummary] = useState<AdminDashboardSummary>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    fetchAdminDashboard(accessToken)
      .then((payload) => {
        setSummary(payload.summary);
        setMessage("");
      })
      .catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Dashboard failed"),
      );
  }, [accessToken]);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
