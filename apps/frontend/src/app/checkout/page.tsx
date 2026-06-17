import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-144px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Checkout</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Address, shipping, payment, and order review.
        </p>
      </div>
      <CheckoutClient />
    </main>
  );
}
