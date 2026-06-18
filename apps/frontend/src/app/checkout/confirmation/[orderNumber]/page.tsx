import { OrderConfirmationClient } from "@/components/checkout/OrderConfirmationClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage({
  params,
}: Readonly<{ params: Promise<{ orderNumber: string }> }>) {
  const { orderNumber } = await params;

  return (
    <PublicPageFrame
      eyebrow="Order Placed"
      title="Order Confirmation"
      description="Your order details, payment status, and next steps are shown below."
    >
      <OrderConfirmationClient orderNumber={orderNumber} />
    </PublicPageFrame>
  );
}
