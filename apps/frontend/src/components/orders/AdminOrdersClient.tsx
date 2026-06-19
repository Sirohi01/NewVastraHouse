"use client";

import { Ban, Boxes, RefreshCw, Send, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  bulkUpdateAdminOrders,
  cancelAdminOrder,
  fetchAdminOrder,
  fetchAdminOrders,
  formatOrderMoney,
  orderStatuses,
  updateAdminOrderShipment,
  updateAdminOrderStatus,
  type OrderDetailPayload,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/orders";
import { useAuthStore } from "@/stores/authStore";

const orderTransitionGraph: Record<OrderStatus, OrderStatus[]> = {
  cancelled: [],
  cod_confirmed: ["in_production", "packed", "ready_to_dispatch", "cancelled"],
  confirmed: ["in_production", "packed", "ready_to_dispatch", "cancelled"],
  delivered: ["returned", "refunded"],
  in_production: ["packed", "cancelled"],
  packed: ["ready_to_dispatch", "cancelled"],
  payment_rejected: ["pending_payment", "cancelled"],
  payment_verification_pending: ["confirmed", "payment_rejected", "cancelled"],
  pending_payment: ["confirmed", "payment_verification_pending", "payment_rejected", "cancelled"],
  pre_order_confirmed: ["in_production", "cancelled"],
  ready_to_dispatch: ["shipped", "cancelled"],
  refunded: [],
  returned: ["refunded"],
  shipped: ["delivered", "returned"],
};

const detailTabs = [
  { label: "Items", value: "items" },
  { label: "Status", value: "status" },
  { label: "Shipment", value: "shipment" },
  { label: "Timeline", value: "timeline" },
  { label: "Cancel", value: "cancel" },
] as const;

type DetailTab = (typeof detailTabs)[number]["value"];

export function AdminOrdersClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selected, setSelected] = useState<OrderDetailPayload>();
  const [detailTab, setDetailTab] = useState<DetailTab>("items");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [pendingCancelNote, setPendingCancelNote] = useState("");

  useEffect(() => {
    if (accessToken) {
      void loadOrders();
    }
  }, [accessToken]);

  async function loadOrders(nextStatus = status, nextSearch = search) {
    setLoading(true);
    try {
      const payload = await fetchAdminOrders(
        {
          limit: 25,
          search: nextSearch || undefined,
          status: nextStatus || undefined,
        },
        accessToken,
      );
      setOrders(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }

  async function selectOrder(orderId: string) {
    try {
      setSelected(await fetchAdminOrder(orderId, accessToken));
      setDetailTab("items");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load order detail"));
    }
  }

  async function updateStatus(formData: FormData) {
    if (!selected) {
      return;
    }
    try {
      await updateAdminOrderStatus(
        selected.order._id,
        {
          note: optionalString(formData.get("note")),
          toStatus: String(formData.get("toStatus")) as OrderStatus,
        },
        accessToken,
      );
      toast.success("Order status updated");
      await Promise.all([loadOrders(), selectOrder(selected.order._id)]);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update status"));
    }
  }

  async function updateShipment(formData: FormData) {
    if (!selected) {
      return;
    }
    try {
      await updateAdminOrderShipment(
        selected.order._id,
        {
          carrier: String(formData.get("carrier")),
          note: optionalString(formData.get("note")),
          trackingNumber: String(formData.get("trackingNumber")),
          trackingUrl: optionalString(formData.get("trackingUrl")),
        },
        accessToken,
      );
      toast.success("Shipment updated");
      await Promise.all([loadOrders(), selectOrder(selected.order._id)]);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update shipment"));
    }
  }

  function requestCancel(formData: FormData) {
    setPendingCancelNote(optionalString(formData.get("note")) ?? "");
    setCancelConfirmOpen(true);
  }

  async function confirmCancel() {
    if (!selected) {
      return;
    }
    try {
      await cancelAdminOrder(selected.order._id, pendingCancelNote || undefined, accessToken);
      toast.success("Order cancelled");
      setCancelConfirmOpen(false);
      await Promise.all([loadOrders(), selectOrder(selected.order._id)]);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to cancel order"));
    }
  }

  async function bulkUpdate(formData: FormData) {
    if (!status) {
      toast.error("Choose a status filter before bulk updating.");
      return;
    }
    try {
      const result = await bulkUpdateAdminOrders(
        {
          note: optionalString(formData.get("note")),
          status,
          toStatus: String(formData.get("toStatus")) as OrderStatus,
        },
        accessToken,
      );
      toast.success(`Bulk updated ${result.updated.length} of ${result.matched} orders.`);
      await loadOrders();
    } catch (error) {
      toast.error(errorMessage(error, "Bulk update failed"));
    }
  }

  return (
    <ProtectedRoute>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-md border border-border bg-card p-3">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <label className="min-w-40 text-xs font-medium">
              Status
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
                value={status}
              >
                <option value="">All</option>
                {orderStatuses.map((item) => (
                  <option key={item} value={item}>
                    {labelStatus(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-48 flex-1 text-xs font-medium">
              Search
              <input
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void loadOrders()}
                placeholder="Order number"
                value={search}
              />
            </label>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => void loadOrders()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={15} />
              Refresh
            </button>
          </div>

          <form
            action={bulkUpdate}
            className="mb-3 grid gap-2 rounded-md border border-border p-2.5 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="text-xs font-medium">
              Bulk Status
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="toStatus"
              >
                {orderStatuses.map((item) => (
                  <option key={item} value={item}>
                    {labelStatus(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              Note
              <input
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="note"
              />
            </label>
            <button className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
              <Send aria-hidden="true" size={15} />
              Apply
            </button>
          </form>

          {orders.length ? (
            <DataTable
              columns={[
                {
                  header: "Order",
                  render: (order) => (
                    <button
                      className="font-semibold text-primary hover:underline"
                      onClick={() => void selectOrder(order._id)}
                      type="button"
                    >
                      {order.orderNumber}
                    </button>
                  ),
                },
                { header: "Status", render: (order) => labelStatus(order.status) },
                { header: "Payment", render: (order) => order.paymentMethod ?? "-" },
                {
                  align: "right",
                  header: "Total",
                  render: (order) =>
                    formatOrderMoney(order.totals?.grandTotal, order.totals?.currencyCode),
                },
                { header: "Shipment", render: (order) => order.shipment?.trackingNumber ?? "-" },
              ]}
              emptyMessage={loading ? "Loading..." : "No orders match this filter."}
              getRowKey={(order) => order._id}
              rows={orders}
            />
          ) : (
            <EmptyState title="No orders" message="Orders matching the filter will appear here." />
          )}
        </section>

        <aside className="grid h-fit gap-3">
          {selected ? (
            <section className="rounded-md border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selected.order.orderNumber}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {labelStatus(selected.order.status)}
                  </p>
                </div>
                <Boxes aria-hidden="true" className="text-accent" size={20} />
              </div>

              <div className="mt-3">
                <Tabs active={detailTab} items={detailTabs} onChange={setDetailTab} />
              </div>

              <div className="mt-3">
                {detailTab === "items" ? (
                  <div className="grid gap-2 text-sm">
                    {selected.order.items?.map((item, index) => (
                      <div
                        className="rounded-md border border-border p-2.5"
                        key={`${item.sku}-${item.purchaseMode ?? (item.preOrder?.enabled ? "pre_order" : "regular")}-${index}`}
                      >
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-muted-foreground">
                          {item.sku} - Qty {item.quantity} -{" "}
                          {formatOrderMoney(item.lineSubtotal, item.currencyCode)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {detailTab === "status" ? (
                  <form action={updateStatus} className="grid gap-2.5">
                    {getNextStatuses(selected.order.status).length ? null : (
                      <p className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
                        No further status transition is available for this order.
                      </p>
                    )}
                    <select
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      disabled={!getNextStatuses(selected.order.status).length}
                      defaultValue={getNextStatuses(selected.order.status)[0] ?? ""}
                      name="toStatus"
                      required
                    >
                      {getNextStatuses(selected.order.status).map((item) => (
                        <option key={item} value={item}>
                          {labelStatus(item)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      name="note"
                      placeholder="Note"
                    />
                    <button
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!getNextStatuses(selected.order.status).length}
                    >
                      <Send aria-hidden="true" size={15} />
                      Update
                    </button>
                  </form>
                ) : null}

                {detailTab === "shipment" ? (
                  <form action={updateShipment} className="grid gap-2.5">
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      defaultValue={selected.order.shipment?.carrier}
                      name="carrier"
                      placeholder="Carrier"
                      required
                    />
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      defaultValue={selected.order.shipment?.trackingNumber}
                      name="trackingNumber"
                      placeholder="Tracking number"
                      required
                    />
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      defaultValue={selected.order.shipment?.trackingUrl}
                      name="trackingUrl"
                      placeholder="Tracking URL"
                    />
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      name="note"
                      placeholder="Note"
                    />
                    <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                      <Truck aria-hidden="true" size={15} />
                      Save
                    </button>
                  </form>
                ) : null}

                {detailTab === "timeline" ? (
                  <div className="grid gap-2">
                    {selected.timeline.map((event, index) => (
                      <div
                        className="rounded-md border border-border p-2.5 text-sm"
                        key={`${event.toStatus}-${event.createdAt ?? index}`}
                      >
                        <p className="font-semibold">
                          {event.fromStatus ? `${labelStatus(event.fromStatus)} -> ` : ""}
                          {labelStatus(event.toStatus)}
                        </p>
                        <p className="text-muted-foreground">
                          {event.actorType} -{" "}
                          {event.createdAt ? new Date(event.createdAt).toLocaleString() : "-"}
                        </p>
                        {event.note ? <p className="mt-1.5">{event.note}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {detailTab === "cancel" ? (
                  <form action={requestCancel} className="grid gap-2.5">
                    <input
                      className="h-9 rounded-md border border-border px-2.5 text-sm"
                      name="note"
                      placeholder="Cancellation note"
                    />
                    <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-destructive px-3 text-sm font-semibold text-destructive">
                      <Ban aria-hidden="true" size={15} />
                      Cancel order
                    </button>
                  </form>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="rounded-md border border-border bg-card p-3">
              <EmptyState title="Select an order" message="Open an order to manage lifecycle." />
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        confirmLabel="Cancel order"
        message="This will cancel the order and release reserved stock. This cannot be undone."
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={confirmCancel}
        open={cancelConfirmOpen}
        title="Cancel order"
      />
    </ProtectedRoute>
  );
}

function labelStatus(status: OrderStatus) {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getNextStatuses(status: OrderStatus) {
  return orderTransitionGraph[status] ?? [];
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}
