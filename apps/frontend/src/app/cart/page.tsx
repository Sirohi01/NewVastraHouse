import { CartClient } from "@/components/commerce/CartClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <PublicPageFrame
      eyebrow="Cart"
      title="Shopping Cart"
      description="Review line items, quantities, gift packaging, and gift card redemption before checkout."
    >
      <CartClient />
    </PublicPageFrame>
  );
}
