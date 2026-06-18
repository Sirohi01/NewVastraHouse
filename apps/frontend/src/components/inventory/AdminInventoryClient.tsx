"use client";

import { Boxes, ClipboardList, Plus, RefreshCw, Send, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  inventoryFetch,
  type InventoryLog,
  type LowStockAlert,
  type StockLedger,
  type StockTransfer,
} from "@/lib/inventory";
import { useAuthStore } from "@/stores/authStore";

type DashboardPayload = {
  alerts: LowStockAlert[];
  ledgers: StockLedger[];
};

const tabItems = [
  { label: "Stock Ledger", value: "ledger" },
  { label: "Transfers", value: "transfers" },
  { label: "Low Stock Alerts", value: "alerts" },
  { label: "Audit Log", value: "log" },
] as const;

type TabValue = (typeof tabItems)[number]["value"];

export function AdminInventoryClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>("ledger");
  const [ledgers, setLedgers] = useState<StockLedger[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    if (accessToken) {
      void loadInventory();
    }
  }, [accessToken]);

  async function loadInventory() {
    setLoading(true);
    try {
      const dashboard = await inventoryFetch<DashboardPayload>("/inventory/dashboard", accessToken);
      const logPayload = await inventoryFetch<{ logs: InventoryLog[] }>(
        "/inventory/logs",
        accessToken,
      );
      const transferPayload = await inventoryFetch<{ transfers: StockTransfer[] }>(
        "/inventory/transfers",
        accessToken,
      );
      setLedgers(dashboard.ledgers);
      setAlerts(dashboard.alerts);
      setLogs(logPayload.logs);
      setTransfers(transferPayload.transfers);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  }

  async function saveLedger(formData: FormData) {
    try {
      await inventoryFetch("/inventory/ledgers", accessToken, {
        body: JSON.stringify(
          numericPayload(formData, [
            "available",
            "reserved",
            "damaged",
            "returned",
            "incoming",
            "lowStockThreshold",
          ]),
        ),
        method: "POST",
      });
      toast.success("Ledger saved");
      setLedgerModalOpen(false);
      await loadInventory();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save ledger"));
    }
  }

  async function adjustStock(formData: FormData) {
    try {
      await inventoryFetch("/inventory/adjustments", accessToken, {
        body: JSON.stringify(numericPayload(formData, ["quantity"])),
        method: "POST",
      });
      toast.success("Stock adjusted");
      setAdjustModalOpen(false);
      await loadInventory();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to adjust stock"));
    }
  }

  async function createTransfer(formData: FormData) {
    try {
      await inventoryFetch("/inventory/transfers", accessToken, {
        body: JSON.stringify(numericPayload(formData, ["quantity"])),
        method: "POST",
      });
      toast.success("Transfer created");
      setTransferModalOpen(false);
      await loadInventory();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create transfer"));
    }
  }

  async function receiveTransfer(id: string) {
    try {
      await inventoryFetch(`/inventory/transfers/${id}/receive`, accessToken, { method: "POST" });
      toast.success("Transfer received");
      await loadInventory();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to receive transfer"));
    }
  }

  async function runAlerts() {
    try {
      await inventoryFetch("/inventory/alerts/run", accessToken, { method: "POST" });
      toast.success("Alerts refreshed");
      await loadInventory();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to run alerts"));
    }
  }

  return (
    <ProtectedRoute>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs active={tab} items={tabItems} onChange={setTab} />
        <div className="flex gap-2">
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
            onClick={() => void loadInventory()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} />
            Refresh
          </button>
          {tab === "ledger" ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={() => setLedgerModalOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              Add Ledger
            </button>
          ) : null}
          {tab === "ledger" ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => setAdjustModalOpen(true)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" size={15} />
              Adjust
            </button>
          ) : null}
          {tab === "transfers" ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={() => setTransferModalOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              New Transfer
            </button>
          ) : null}
          {tab === "alerts" ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => void runAlerts()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={15} />
              Run alerts
            </button>
          ) : null}
        </div>
      </div>

      {tab === "ledger" ? (
        <section className="flex items-center gap-2 pb-3 text-sm text-muted-foreground">
          <Boxes aria-hidden="true" className="text-accent" size={16} />
          Stock by SKU and warehouse.
        </section>
      ) : null}

      {tab === "ledger" ? (
        <DataTable
          columns={[
            { header: "SKU", render: (row) => <span className="font-semibold">{row.sku}</span> },
            { header: "Warehouse", render: (row) => row.warehouseId },
            { align: "right", header: "Available", render: (row) => row.available },
            { align: "right", header: "Reserved", render: (row) => row.reserved },
            { align: "right", header: "Damaged", render: (row) => row.damaged },
            { align: "right", header: "Returned", render: (row) => row.returned },
            { align: "right", header: "Incoming", render: (row) => row.incoming },
            { align: "right", header: "Threshold", render: (row) => row.lowStockThreshold },
          ]}
          emptyMessage={loading ? "Loading..." : "No stock ledgers yet."}
          getRowKey={(row) => row._id}
          rows={ledgers}
        />
      ) : null}

      {tab === "transfers" ? (
        transfers.length ? (
          <DataTable
            columns={[
              {
                header: "Transfer",
                render: (row) => <span className="font-semibold">{row.transferNumber}</span>,
              },
              { header: "SKU", render: (row) => row.sku },
              { align: "right", header: "Qty", render: (row) => row.quantity },
              {
                header: "Route",
                render: (row) => `${row.sourceWarehouseId} -> ${row.destinationWarehouseId}`,
              },
              { header: "Status", render: (row) => row.status },
              {
                align: "right",
                header: "Actions",
                render: (row) =>
                  row.status === "in_transit" ? (
                    <button
                      className="h-8 rounded-md border border-primary px-2.5 text-xs font-semibold text-primary"
                      onClick={() => void receiveTransfer(row._id)}
                      type="button"
                    >
                      Receive
                    </button>
                  ) : null,
              },
            ]}
            getRowKey={(row) => row._id}
            rows={transfers}
          />
        ) : (
          <EmptyState
            title="No transfers"
            message={loading ? "Loading..." : "Create a stock transfer."}
          />
        )
      ) : null}

      {tab === "alerts" ? (
        alerts.length ? (
          <DataTable
            columns={[
              { header: "SKU", render: (row) => <span className="font-semibold">{row.sku}</span> },
              { header: "Warehouse", render: (row) => row.warehouseId },
              { align: "right", header: "Available", render: (row) => row.available },
              { align: "right", header: "Threshold", render: (row) => row.threshold },
              { header: "Status", render: (row) => row.status },
            ]}
            getRowKey={(row) => row._id}
            rows={alerts}
          />
        ) : (
          <EmptyState title="No open alerts" message="Stock levels look healthy." />
        )
      ) : null}

      {tab === "log" ? (
        logs.length ? (
          <DataTable
            columns={[
              { header: "SKU", render: (row) => <span className="font-semibold">{row.sku}</span> },
              { header: "Event", render: (row) => row.eventType },
              { align: "right", header: "Qty", render: (row) => row.quantity },
              { header: "Reason", render: (row) => row.reasonCode ?? "-" },
              { header: "Actor", render: (row) => row.actorType },
            ]}
            getRowKey={(row) => row._id}
            rows={logs}
          />
        ) : (
          <EmptyState
            title="No log entries"
            message={loading ? "Loading..." : "Inventory events will appear here."}
          />
        )
      ) : null}

      <Modal
        onClose={() => setLedgerModalOpen(false)}
        open={ledgerModalOpen}
        size="sm"
        title="Add ledger"
      >
        <form action={saveLedger} className="grid gap-2.5">
          <Field label="SKU" name="sku" required />
          <Field label="Warehouse ID" name="warehouseId" required />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Available" min={0} name="available" type="number" />
            <Field label="Reserved" min={0} name="reserved" type="number" />
            <Field label="Damaged" min={0} name="damaged" type="number" />
            <Field label="Returned" min={0} name="returned" type="number" />
            <Field label="Incoming" min={0} name="incoming" type="number" />
            <Field label="Threshold" min={0} name="lowStockThreshold" type="number" />
          </div>
          <ModalActions onCancel={() => setLedgerModalOpen(false)} />
        </form>
      </Modal>

      <Modal
        onClose={() => setAdjustModalOpen(false)}
        open={adjustModalOpen}
        size="sm"
        title="Adjust stock"
      >
        <form action={adjustStock} className="grid gap-2.5">
          <Field label="SKU" name="sku" required />
          <Field label="Warehouse ID" name="warehouseId" required />
          <label className="text-xs font-medium">
            State
            <select
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="state"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="damaged">Damaged</option>
              <option value="returned">Returned</option>
              <option value="incoming">Incoming</option>
            </select>
          </label>
          <Field label="Quantity" min={1} name="quantity" required type="number" />
          <Field label="Reason" name="reasonCode" required />
          <ModalActions onCancel={() => setAdjustModalOpen(false)} />
        </form>
      </Modal>

      <Modal
        onClose={() => setTransferModalOpen(false)}
        open={transferModalOpen}
        size="sm"
        title="New transfer"
      >
        <form action={createTransfer} className="grid gap-2.5">
          <Field label="SKU" name="sku" required />
          <Field label="Quantity" min={1} name="quantity" required type="number" />
          <Field label="Source Warehouse" name="sourceWarehouseId" required />
          <Field label="Destination Warehouse" name="destinationWarehouseId" required />
          <Field label="Notes" name="notes" />
          <ModalActions
            confirmIcon={Send}
            confirmLabel="Transfer"
            onCancel={() => setTransferModalOpen(false)}
          />
        </form>
      </Modal>

      {tab === "log" ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList aria-hidden="true" size={14} />
          Most recent inventory events across all warehouses.
        </div>
      ) : null}
    </ProtectedRoute>
  );
}

function ModalActions({
  confirmIcon: Icon,
  confirmLabel = "Save",
  onCancel,
}: Readonly<{ confirmIcon?: typeof Send; confirmLabel?: string; onCancel: () => void }>) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
      <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
        {Icon ? <Icon aria-hidden="true" size={14} /> : null}
        {confirmLabel}
      </button>
    </div>
  );
}

function Field({
  className = "",
  label,
  ...props
}: Readonly<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  }
>) {
  return (
    <label className={`text-xs font-medium ${className}`}>
      {label}
      <input
        className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
        {...props}
      />
    </label>
  );
}

function numericPayload(formData: FormData, numericFields: string[]) {
  const payload: Record<string, string | number> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || value.trim() === "") {
      continue;
    }
    payload[key] = numericFields.includes(key) ? Number(value) : value.trim();
  }

  return payload;
}
