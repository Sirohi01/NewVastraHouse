import { WishlistClient } from "@/components/commerce/WishlistClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export const dynamic = "force-dynamic";

export default function WishlistPage() {
  return (
    <PublicPageFrame
      eyebrow="Saved"
      title="Wishlist"
      description="Saved products show stock and price-change signals from the catalog backend."
    >
      <WishlistClient />
    </PublicPageFrame>
  );
}
