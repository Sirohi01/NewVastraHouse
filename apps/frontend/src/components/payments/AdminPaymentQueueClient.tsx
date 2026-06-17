"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
  createdAt?: string;
};

export function AdminPaymentQueueClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadQueue();
  }, [accessToken]);

  async function loadQueue() {
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
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Queue load failed");
    }
  }

  async function approve(id: string) {
    await paymentFetch(`/payments/admin/${id}/approve`, accessToken, { method: "POST" });
    await loadQueue();
  }

  async function reject(id: string, formData: FormData) {
    await paymentFetch(`/payments/admin/${id}/reject`, accessToken, {
      body: JSON.stringify({ reason: formData.get("reason") }),
      method: "POST",
    });
    await loadQueue();
  }

  return (
    <ProtectedRoute>
      {message ? <p className="mb-4 text-sm text-destructive">{message}</p> : null}
      <div className="grid gap-4">
        {sessions.map((session) => (
          <article
            className="rounded-lg border border-border bg-card p-5 shadow-soft"
            key={session._id}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-lg font-semibold">{session.orderReference}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.method} · {session.status} ·{" "}
                  {formatPaymentMoney(session.payableNow, session.currencyCode)}
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white"
                onClick={() => approve(session._id)}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" size={16} />
                Approve
              </button>
            </div>
            <form action={(formData) => reject(session._id, formData)} className="mt-4 flex gap-3">
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-border px-3"
                name="reason"
                placeholder="Reject reason"
                required
              />
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-destructive px-3 text-sm font-semibold text-destructive">
                <XCircle aria-hidden="true" size={16} />
                Reject
              </button>
            </form>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-lg border border-border bg-card p-5 shadow-soft">
        <h2 className="text-xl font-semibold">Webhook Events</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Provider</th>
                <th className="p-3">Event</th>
                <th className="p-3">Signature</th>
                <th className="p-3">Processed</th>
                <th className="p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr className="border-t border-border" key={event._id}>
                  <td className="p-3">{event.provider}</td>
                  <td className="p-3">
                    <span className="font-semibold">{event.eventType}</span>
                    <span className="block text-xs text-muted-foreground">{event.eventId}</span>
                  </td>
                  <td className="p-3">{event.signatureVerified ? "Verified" : "Rejected"}</td>
                  <td className="p-3">
                    {event.processedAt ? new Date(event.processedAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-3">{event.error ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ProtectedRoute>
  );
}
