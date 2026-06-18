import { AdminInventoryClient } from "@/components/inventory/AdminInventoryClient";

export const dynamic = "force-dynamic";

export default function AdminInventoryPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-4 max-w-3xl">
        <h1 className="text-2xl font-semibold leading-tight">Inventory</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Stock ledgers, alerts, transfers, adjustments, and inventory logs.
        </p>
      </div>
      <AdminInventoryClient />
    </main>
  );
}
