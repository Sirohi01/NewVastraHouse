import { AdminPaymentQueueClient } from "@/components/payments/AdminPaymentQueueClient";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-144px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Payment Verification</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Review manual bank transfer and direct UPI submissions with approve/reject controls.
        </p>
      </div>
      <AdminPaymentQueueClient />
    </main>
  );
}
