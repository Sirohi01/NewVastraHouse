import { AdminReturnsClient } from "@/components/returns/AdminReturnsClient";

export const dynamic = "force-dynamic";

export default function AdminReturnsPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-4 max-w-3xl">
        <h1 className="text-2xl font-semibold leading-tight">Returns</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Approve or reject returns, route stock to restock or damaged, and issue refunds.
        </p>
      </div>
      <AdminReturnsClient />
    </main>
  );
}
