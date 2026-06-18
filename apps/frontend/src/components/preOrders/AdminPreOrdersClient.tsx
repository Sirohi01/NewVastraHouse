"use client";

import { RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/states/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  fetchAdminPreOrders,
  productionStages,
  updateAdminPreOrderStage,
  type ProductionStage,
  type ProductionTracker,
} from "@/lib/preOrders";
import { useAuthStore } from "@/stores/authStore";

export function AdminPreOrdersClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [trackers, setTrackers] = useState<ProductionTracker[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stage, setStage] = useState<ProductionStage | "">("");
  const [loading, setLoading] = useState(false);

  const allSelected = useMemo(
    () => trackers.length > 0 && selectedIds.length === trackers.length,
    [selectedIds.length, trackers.length],
  );

  useEffect(() => {
    if (accessToken) {
      void load();
    }
  }, [accessToken, stage]);

  async function load() {
    setLoading(true);
    try {
      const payload = await fetchAdminPreOrders(accessToken, stage || undefined);
      setTrackers(payload.trackers);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load pre-orders"));
    } finally {
      setLoading(false);
    }
  }

  async function updateStage(formData: FormData) {
    if (!selectedIds.length) {
      toast.error("Select at least one pre-order tracker.");
      return;
    }

    try {
      await updateAdminPreOrderStage(
        {
          note: optionalString(formData.get("note")),
          stage: String(formData.get("stage")) as ProductionStage,
          trackerIds: selectedIds,
        },
        accessToken,
      );
      toast.success("Stage updated");
      setSelectedIds([]);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update stage"));
    }
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : trackers.map((tracker) => tracker._id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Pre-Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Production tracker and bulk stage updates for pre-order line items.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
          onClick={() => void load()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
          Refresh
        </button>
      </div>

      <section className="mb-3 rounded-md border border-border bg-card p-3">
        <form action={updateStage} className="grid gap-2.5 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-medium">
            Filter
            <select
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              onChange={(event) => setStage(event.target.value as ProductionStage | "")}
              value={stage}
            >
              <option value="">All stages</option>
              {productionStages.map((item) => (
                <option key={item} value={item}>
                  {labelStage(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Bulk Stage
            <select
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="stage"
            >
              {productionStages.map((item) => (
                <option key={item} value={item}>
                  {labelStage(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium md:col-span-2">
            Note
            <input
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="note"
            />
          </label>
          <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground md:self-end">
            <Send aria-hidden="true" size={15} />
            Update Selected ({selectedIds.length})
          </button>
        </form>
      </section>

      {trackers.length ? (
        <DataTable
          columns={[
            {
              header: "",
              render: (tracker) => (
                <input
                  checked={selectedIds.includes(tracker._id)}
                  onChange={() => toggleOne(tracker._id)}
                  type="checkbox"
                />
              ),
            },
            {
              header: "Order",
              render: (tracker) => <span className="font-semibold">{tracker.orderNumber}</span>,
            },
            {
              header: "Product",
              render: (tracker) => (
                <div>
                  <span className="font-semibold">{tracker.productName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {tracker.sku} - Qty {tracker.quantity}
                  </span>
                </div>
              ),
            },
            { header: "Stage", render: (tracker) => labelStage(tracker.stage) },
            {
              header: "Expected",
              render: (tracker) => (
                <span className="text-muted-foreground">
                  {formatDate(tracker.expectedDispatchAt)} /{" "}
                  {formatDate(tracker.expectedDeliveryAt)}
                </span>
              ),
            },
          ]}
          getRowKey={(tracker) => tracker._id}
          rows={trackers}
        />
      ) : (
        <EmptyState
          title="No pre-orders"
          message={loading ? "Loading..." : "Pre-order line items will appear here."}
        />
      )}
      {trackers.length ? (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input checked={allSelected} onChange={toggleAll} type="checkbox" />
          Select all
        </label>
      ) : null}
    </div>
  );
}

export function labelStage(stage: ProductionStage) {
  return stage
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "-";
}
