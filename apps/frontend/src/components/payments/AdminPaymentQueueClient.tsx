"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { formatPaymentMoney, paymentFetch, type PaymentSession } from "@/lib/payments";
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
  const [activeTab, setActiveTab] = useState<"queue" | "webhooks">("queue");
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<PaymentSession>();

  useEffect(() => {
    if (accessToken) {
      void loadQueue();
    }
  }, [accessToken]);

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
      ) : (
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
      )}

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
