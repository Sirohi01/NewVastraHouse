"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { formatPaymentMoney, paymentFetch, type PaymentHistoryItem } from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

export function PaymentHistoryClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadHistory();
  }, [accessToken]);

  async function loadHistory(orderReference?: string) {
    try {
      const params = orderReference ? `?orderReference=${encodeURIComponent(orderReference)}` : "";
      const payload = await paymentFetch<{ history: PaymentHistoryItem[] }>(
        `/payments/history${params}`,
        accessToken,
      );
      setHistory(payload.history);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment history failed");
    }
  }

  return (
    <ProtectedRoute>
      <form
        action={(formData) => loadHistory(String(formData.get("orderReference") ?? ""))}
        className="mb-5 flex gap-3"
      >
        <input
          className="h-11 min-w-0 flex-1 rounded-md border border-border px-3"
          name="orderReference"
          placeholder="Filter by order reference"
        />
        <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Filter
        </button>
      </form>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Method</th>
              <th className="p-3">Event</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Actor</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr className="border-t border-border" key={item._id}>
                <td className="p-3 font-semibold">{item.orderReference}</td>
                <td className="p-3">{item.method}</td>
                <td className="p-3">{item.event}</td>
                <td className="p-3">{formatPaymentMoney(item.amount, item.currencyCode)}</td>
                <td className="p-3">{item.actorType}</td>
                <td className="p-3">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
