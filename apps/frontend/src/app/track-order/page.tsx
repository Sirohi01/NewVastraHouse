import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { TrackOrderClient } from "@/components/orders/TrackOrderClient";

export const dynamic = "force-dynamic";

export default function TrackOrderPage() {
  return (
    <PublicPageFrame
      eyebrow="Order Status"
      title="Track Order"
      description="View the latest order status, shipment details, items, and status timeline."
    >
      <TrackOrderClient />
    </PublicPageFrame>
  );
}
