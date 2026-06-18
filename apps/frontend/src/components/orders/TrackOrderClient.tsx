"use client";

import { PackageSearch, Search, Truck } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/states/EmptyState";
import {
  fetchTrackedOrder,
  formatOrderMoney,
  type OrderDetailPayload,
  type OrderStatus,
} from "@/lib/orders";
import { labelStage } from "@/components/preOrders/AdminPreOrdersClient";

export function TrackOrderClient() {
  const [detail, setDetail] = useState<OrderDetailPayload>();
  const [message, setMessage] = useState("");

  async function track(formData: FormData) {
    const orderNumber = String(formData.get("orderNumber") ?? "").trim();
    if (!orderNumber) {
      return;
    }

    try {
      setDetail(await fetchTrackedOrder(orderNumber));
      setMessage("");
    } catch (error) {
      setDetail(undefined);
      setMessage(error instanceof Error ? error.message : "Order lookup failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <section className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <PackageSearch aria-hidden="true" className="text-primary" size={20} />
          <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">Track Order</h2>
        </div>
        <form action={track} className="grid gap-3">
          <input
            className="h-11 rounded-md border border-border px-3"
            name="orderNumber"
            placeholder="TVH-YYYYMMDD-XXXXXX"
            required
          />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Search aria-hidden="true" size={16} />
            Track
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-destructive">{message}</p> : null}
      </section>

      {detail ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl uppercase tracking-wide text-[#3d1620]">
                {detail.order.orderNumber}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {labelStatus(detail.order.status)} -{" "}
                {formatOrderMoney(
                  detail.order.totals?.grandTotal,
                  detail.order.totals?.currencyCode,
                )}
              </p>
            </div>
            <div className="rounded-md border border-border px-3 py-2 text-sm font-semibold">
              {labelStatus(detail.order.status)}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Truck aria-hidden="true" className="text-primary" size={18} />
                <h3 className="font-semibold">Shipment</h3>
              </div>
              <div className="rounded-md border border-border p-4 text-sm">
                <p>Carrier: {detail.order.shipment?.carrier ?? "-"}</p>
                <p className="mt-2">Tracking: {detail.order.shipment?.trackingNumber ?? "-"}</p>
                {detail.order.shipment?.trackingUrl ? (
                  <a
                    className="mt-3 inline-flex text-primary underline-offset-4 hover:underline"
                    href={detail.order.shipment.trackingUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open carrier link
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Items</h3>
              <div className="grid gap-3">
                {detail.order.items?.map((item) => (
                  <div className="rounded-md border border-border p-3 text-sm" key={item.sku}>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {item.sku} - Qty {item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            {detail.productionTrackers?.length ? (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Production Tracker</h3>
                <div className="grid gap-3">
                  {detail.productionTrackers.map((tracker) => (
                    <div className="rounded-md border border-border p-3 text-sm" key={tracker._id}>
                      <p className="font-semibold">{tracker.productName}</p>
                      <p className="text-muted-foreground">
                        {tracker.sku} - {labelStage(tracker.stage)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Dispatch {formatDate(tracker.expectedDispatchAt)} / Delivery{" "}
                        {formatDate(tracker.expectedDeliveryAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <h3 className="mb-3 font-semibold">Timeline</h3>
            <div className="grid gap-3">
              {detail.timeline.map((event, index) => (
                <div
                  className="rounded-md border border-border p-3 text-sm"
                  key={`${event.toStatus}-${event.createdAt ?? index}`}
                >
                  <p className="font-semibold">
                    {event.fromStatus ? `${labelStatus(event.fromStatus)} -> ` : ""}
                    {labelStatus(event.toStatus)}
                  </p>
                  <p className="text-muted-foreground">
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : "-"}
                  </p>
                  {event.note ? <p className="mt-2">{event.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <EmptyState title="No order loaded" message="Enter an order number to view tracking." />
        </section>
      )}
    </div>
  );
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function labelStatus(status: OrderStatus) {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
