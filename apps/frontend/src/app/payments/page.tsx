import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { PaymentMethodClient } from "@/components/payments/PaymentMethodClient";

export const dynamic = "force-dynamic";

export default function PaymentsPage() {
  return (
    <PublicPageFrame
      eyebrow="Payments"
      title="Payment Options"
      description="Create and verify payment sessions for Razorpay, COD, manual bank transfer, and direct UPI."
    >
      <PaymentMethodClient />
    </PublicPageFrame>
  );
}
