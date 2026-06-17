import { OrderConfirmationClient } from "@/components/checkout/OrderConfirmationClient";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage({
  params,
}: Readonly<{ params: Promise<{ orderNumber: string }> }>) {
  const { orderNumber } = await params;

  return (
    <main className="mx-auto min-h-[calc(100vh-144px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <OrderConfirmationClient orderNumber={orderNumber} />
    </main>
  );
}
