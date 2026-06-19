"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  fetchAdminPaymentSessions,
  formatPaymentMoney,
  paymentFetch,
  type PaymentSession,
  type PaymentStatus,
} from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

type WebhookEvent = {
  _id: string;
  provider: string;
  eventId: string;
  eventType: string;
  signatureVerified: boolean;
  processedAt?: string;
  error?: string;
};

export function AdminPaymentQueueClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"queue" | "ledger" | "webhooks">("queue");
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<PaymentSession>();

  const [ledgerSessions, setLedgerSessions] = useState<PaymentSession[]>([]);
  const [ledgerStatus, setLedgerStatus] = useState<PaymentStatus | "">("");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerMeta, setLedgerMeta] = useState({ hasNextPage: false, hasPreviousPage: false });
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      void loadQueue();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && activeTab === "ledger") {
      void loadLedger();
    }
  }, [accessToken, activeTab, ledgerPage]);

  async function loadQueue() {
    setLoading(true);
    try {
      const payload = await paymentFetch<{ sessions: PaymentSession[] }>(
        "/payments/admin/verification-queue",
        accessToken,
      );
      const webhookPayload = await paymentFetch<{ events: WebhookEvent[] }>(
        "/payments/admin/webhook-events",
        accessToken,
      );

      setSessions(payload.sessions);
      setEvents(webhookPayload.events);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load payment queue"));
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger(nextPage = ledgerPage) {
    setLedgerLoading(true);
    try {
      const payload = await fetchAdminPaymentSessions(
        {
          limit: 25,
          page: nextPage,
          search: ledgerSearch || undefined,
          status: ledgerStatus || undefined,
        },
        accessToken,
      );
      setLedgerSessions(payload.data);
      setLedgerMeta({
        hasNextPage: payload.meta.hasNextPage,
        hasPreviousPage: payload.meta.hasPreviousPage,
      });
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load payment ledger"));
    } finally {
      setLedgerLoading(false);
    }
  }

  async function confirmApprove() {
    if (!approveTarget) {
      return;
    }
    try {
      await paymentFetch(`/payments/admin/${approveTarget._id}/approve`, accessToken, {
        method: "POST",
      });
      toast.success("Payment approved");
      setApproveTarget(undefined);
      await loadQueue();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to approve payment"));
    }
  }

  async function reject(id: string, formData: FormData) {
    try {
      await paymentFetch(`/payments/admin/${id}/reject`, accessToken, {
        body: JSON.stringify({ reason: formData.get("reason") }),
        method: "POST",
      });
      toast.success("Payment rejected");
      await loadQueue();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to reject payment"));
    }
  }

  return (
    <ProtectedRoute>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Tabs
          active={activeTab}
          items={[
            { label: `Queue (${sessions.length})`, value: "queue" },
            { label: "All Payments", value: "ledger" },
            { label: `Webhooks (${events.length})`, value: "webhooks" },
          ]}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "queue" ? (
        sessions.length ? (
          <div className="grid gap-2.5">
            {sessions.map((session) => (
              <article className="rounded-md border border-border bg-card p-3" key={session._id}>
                <div className="grid gap-2.5 md:grid-cols-[1fr_auto]">
                  <div>
                    <h2 className="text-sm font-semibold">{session.orderReference}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {session.method} - {session.status} -{" "}
                      {formatPaymentMoney(session.payableNow, session.currencyCode)}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-semibold text-white"
                    onClick={() => setApproveTarget(session)}
                    type="button"
                  >
                    <CheckCircle2 aria-hidden="true" size={15} />
                    Approve
                  </button>
                </div>
                <form
                  action={(formData) => reject(session._id, formData)}
                  className="mt-2.5 flex gap-2"
                >
                  <input
                    className="h-9 min-w-0 flex-1 rounded-md border border-border px-2.5 text-sm"
                    name="reason"
                    placeholder="Reject reason"
                    required
                  />
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive px-3 text-sm font-semibold text-destructive">
                    <XCircle aria-hidden="true" size={15} />
                    Reject
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Queue is empty"
            message={loading ? "Loading..." : "No payments awaiting verification."}
          />
        )
      ) : null}

      {activeTab === "ledger" ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-3">
            <label className="min-w-40 text-xs font-medium">
              Status
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                onChange={(event) => setLedgerStatus(event.target.value as PaymentStatus | "")}
                value={ledgerStatus}
              >
                <option value="">All</option>
                <option value="pending_payment">Pending payment</option>
                <option value="payment_verification_pending">Verification pending</option>
                <option value="upi_pending">UPI pending</option>
                <option value="partially_paid">Partially paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="cod_confirmed">COD confirmed</option>
                <option value="payment_rejected">Rejected</option>
                <option value="failed">Failed</option>
              </select>
            </label>
            <label className="min-w-48 flex-1 text-xs font-medium">
              Search order number
              <input
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                onChange={(event) => setLedgerSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setLedgerPage(1);
                    void loadLedger(1);
                  }
                }}
                placeholder="Order number"
                value={ledgerSearch}
              />
            </label>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => {
                setLedgerPage(1);
                void loadLedger(1);
              }}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={15} />
              Refresh
            </button>
          </div>

          <DataTable
            columns={[
              { header: "Order", render: (session) => session.orderReference },
              { header: "Method", render: (session) => session.method },
              { header: "Mode", render: (session) => session.paymentMode },
              { header: "Status", render: (session) => session.status },
              {
                align: "right",
                header: "Full amount",
                render: (session) => formatPaymentMoney(session.amount, session.currencyCode),
              },
              {
                align: "right",
                header: "Paid so far",
                render: (session) => formatPaymentMoney(session.paidAmount, session.currencyCode),
              },
              {
                align: "right",
                header: "Remaining",
                render: (session) =>
                  formatPaymentMoney(session.outstandingAmount, session.currencyCode),
              },
            ]}
            emptyMessage={ledgerLoading ? "Loading..." : "No payments match this filter."}
            getRowKey={(session) => session._id}
            rows={ledgerSessions}
          />

          <div className="flex items-center justify-between gap-2">
            <button
              className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!ledgerMeta.hasPreviousPage || ledgerLoading}
              onClick={() => setLedgerPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">Page {ledgerPage}</span>
            <button
              className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!ledgerMeta.hasNextPage || ledgerLoading}
              onClick={() => setLedgerPage((page) => page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "webhooks" ? (
        <DataTable
          columns={[
            { header: "Provider", render: (event) => event.provider },
            {
              header: "Event",
              render: (event) => (
                <div>
                  <span className="font-semibold">{event.eventType}</span>
                  <span className="block text-xs text-muted-foreground">{event.eventId}</span>
                </div>
              ),
            },
            {
              header: "Signature",
              render: (event) => (event.signatureVerified ? "Verified" : "Rejected"),
            },
            {
              header: "Processed",
              render: (event) =>
                event.processedAt ? new Date(event.processedAt).toLocaleString() : "-",
            },
            { header: "Error", render: (event) => event.error ?? "-" },
          ]}
          emptyMessage={loading ? "Loading..." : "No webhook events yet."}
          getRowKey={(event) => event._id}
          rows={events}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Approve"
        danger={false}
        message={`This will mark "${approveTarget?.orderReference}" as paid and progress the order.`}
        onCancel={() => setApproveTarget(undefined)}
        onConfirm={confirmApprove}
        open={!!approveTarget}
        title="Approve payment"
      />
    </ProtectedRoute>
  );
}
