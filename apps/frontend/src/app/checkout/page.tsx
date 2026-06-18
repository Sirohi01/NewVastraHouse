import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <PublicPageFrame
      eyebrow="Secure Checkout"
      title="Checkout"
      description="Address, shipping, payment, and order review."
    >
      <CheckoutClient />
    </PublicPageFrame>
  );
}
