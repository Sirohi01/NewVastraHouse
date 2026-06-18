import { AdminPaymentQueueClient } from "@/components/payments/AdminPaymentQueueClient";
import { AdminPaymentSettingsClient } from "@/components/payments/AdminPaymentSettingsClient";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-4 max-w-3xl">
        <h1 className="text-2xl font-semibold leading-tight">Payment Verification</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Review manual bank transfer and direct UPI submissions with approve/reject controls.
        </p>
      </div>
      <div className="grid gap-4">
        <AdminPaymentSettingsClient />
        <AdminPaymentQueueClient />
      </div>
    </main>
  );
}
