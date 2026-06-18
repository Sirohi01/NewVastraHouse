import { AdminOrdersClient } from "@/components/orders/AdminOrdersClient";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-4 max-w-3xl">
        <h1 className="text-2xl font-semibold leading-tight">Orders</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Lifecycle queue, status timeline, shipment tracking, cancellations, and bulk actions.
        </p>
      </div>
      <AdminOrdersClient />
    </main>
  );
}
