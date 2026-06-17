import { PaymentHistoryClient } from "@/components/payments/PaymentHistoryClient";

export const dynamic = "force-dynamic";

export default function PaymentHistoryPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-144px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Payment History</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Customer-visible payment events by order reference.
        </p>
      </div>
      <PaymentHistoryClient />
    </main>
  );
}
