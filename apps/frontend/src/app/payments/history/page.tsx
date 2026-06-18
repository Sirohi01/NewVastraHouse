import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { PaymentHistoryClient } from "@/components/payments/PaymentHistoryClient";

export const dynamic = "force-dynamic";

export default function PaymentHistoryPage() {
  return (
    <PublicPageFrame
      eyebrow="Payments"
      title="Payment History"
      description="Customer-visible payment events by order reference."
    >
      <PaymentHistoryClient />
    </PublicPageFrame>
  );
}
