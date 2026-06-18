"use client";

import { CheckCircle2, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  approveAdminReturn,
  fetchAdminReturns,
  rejectAdminReturn,
  type RefundMethod,
  type ReturnRequest,
} from "@/lib/returns";
import { useAuthStore } from "@/stores/authStore";

export function AdminReturnsClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ReturnRequest>();
  const [rejectTarget, setRejectTarget] = useState<ReturnRequest>();

  useEffect(() => {
    if (accessToken) {
      void loadReturns();
    }
  }, [accessToken]);

  async function loadReturns() {
    setLoading(true);
    try {
      const payload = await fetchAdminReturns(accessToken);
      setReturns(payload.returns);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load returns"));
    } finally {
      setLoading(false);
    }
  }

  async function approve(formData: FormData) {
    if (!approveTarget) {
      return;
    }
    try {
      await approveAdminReturn(
        approveTarget._id,
        {
          note: optionalString(formData.get("note")),
          refundAmount: optionalNumber(formData.get("refundAmount")),
          refundMethod: String(formData.get("refundMethod")) as RefundMethod,
          stockDisposition: String(formData.get("stockDisposition")) as "restock" | "damaged",
        },
        accessToken,
      );
      toast.success("Return approved");
      setApproveTarget(undefined);
      await loadReturns();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to approve return"));
    }
  }

  async function reject(formData: FormData) {
    if (!rejectTarget) {
      return;
    }
    try {
      await rejectAdminReturn(rejectTarget._id, String(formData.get("note")), accessToken);
      toast.success("Return rejected");
      setRejectTarget(undefined);
      await loadReturns();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to reject return"));
    }
  }

  return (
    <ProtectedRoute>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw aria-hidden="true" className="text-accent" size={18} />
          <h2 className="text-lg font-semibold">Return Queue</h2>
        </div>
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
          onClick={() => void loadReturns()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
          Refresh
        </button>
      </div>

      {returns.length ? (
        <div className="grid gap-2.5">
          {returns.map((item) => (
            <article className="rounded-md border border-border bg-card p-3" key={item._id}>
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-semibold">{item.returnNumber}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.orderNumber} - {item.status} - Credit note {item.creditNoteStatus}
                  </p>
                </div>
                {item.status === "requested" ? (
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-success px-2.5 text-xs font-semibold text-white"
                      onClick={() => setApproveTarget(item)}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden="true" size={14} />
                      Approve
                    </button>
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive px-2.5 text-xs font-semibold text-destructive"
                      onClick={() => setRejectTarget(item)}
                      type="button"
                    >
                      <XCircle aria-hidden="true" size={14} />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-2 grid gap-1.5">
                {item.items.map((line) => (
                  <div className="rounded-md bg-muted p-2 text-sm" key={line.sku}>
                    <p className="font-semibold">{line.productName}</p>
                    <p className="text-muted-foreground">
                      {line.sku} - Qty {line.quantity} - {line.reason}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No returns"
          message={loading ? "Loading..." : "Customer return requests will appear here."}
        />
      )}

      <Modal
        onClose={() => setApproveTarget(undefined)}
        open={!!approveTarget}
        size="sm"
        title={`Approve ${approveTarget?.returnNumber ?? "return"}`}
      >
        <form action={approve} className="grid gap-2.5">
          <label className="text-xs font-medium">
            Stock disposition
            <select
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="stockDisposition"
            >
              <option value="restock">Restock</option>
              <option value="damaged">Damaged</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Refund method
            <select
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="refundMethod"
            >
              <option value="store_credit">Store Credit</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="original_payment">Original Payment</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Refund amount
            <input
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              min={0}
              name="refundAmount"
              placeholder="Leave blank for full amount"
              step="0.01"
              type="number"
            />
          </label>
          <label className="text-xs font-medium">
            Decision note
            <input
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="note"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => setApproveTarget(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-semibold text-white">
              <CheckCircle2 aria-hidden="true" size={15} />
              Approve & refund
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        onClose={() => setRejectTarget(undefined)}
        open={!!rejectTarget}
        size="sm"
        title={`Reject ${rejectTarget?.returnNumber ?? "return"}`}
      >
        <form action={reject} className="grid gap-2.5">
          <label className="text-xs font-medium">
            Reject reason
            <input
              className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
              name="note"
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => setRejectTarget(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-3 text-sm font-semibold text-white">
              <XCircle aria-hidden="true" size={15} />
              Reject return
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return Number(value);
}
