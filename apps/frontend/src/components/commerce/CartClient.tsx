"use client";

import { Gift, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import { commerceFetch, formatMoney, type Cart } from "@/lib/commerce";
import { useAuthStore } from "@/stores/authStore";

export function CartClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [cart, setCart] = useState<Cart>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadCart();
  }, [accessToken]);

  async function loadCart() {
    try {
      const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart", { accessToken });
      setCart(payload.cart);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cart could not load");
    }
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    if (quantity < 1) {
      return;
    }

    const payload = await commerceFetch<{ cart: Cart }>(`/commerce/cart/items/${lineItemId}`, {
      accessToken,
      body: JSON.stringify({ quantity }),
      method: "PATCH",
    });
    setCart(payload.cart);
  }

  async function removeLine(lineItemId: string) {
    const payload = await commerceFetch<{ cart: Cart }>(`/commerce/cart/items/${lineItemId}`, {
      accessToken,
      method: "DELETE",
    });
    setCart(payload.cart);
  }

  async function setGiftPackaging(enabled: boolean) {
    const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/gift-packaging", {
      accessToken,
      body: JSON.stringify({ enabled }),
      method: "PATCH",
    });
    setCart(payload.cart);
  }

  async function applyGiftCard(formData: FormData) {
    const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/gift-cards/validate", {
      accessToken,
      body: JSON.stringify({ code: formData.get("code") }),
      method: "POST",
    });
    setCart(payload.cart);
  }

  if (!cart) {
    return <p className="text-sm text-muted-foreground">{message || "Loading cart..."}</p>;
  }

  if (!cart.items.length) {
    return (
      <EmptyState title="Cart is empty" message="Add products from the shop to build your order." />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {cart.items.map((item) => (
          <article
            className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-soft sm:grid-cols-[120px_1fr]"
            key={item._id}
          >
            <Link href={`/shop/${item.slug}`}>
              {item.media?.url ? (
                <ResponsiveImage
                  alt={item.productName}
                  aspectRatio={item.media.aspectRatio ?? "4/5"}
                  className="rounded-md"
                  src={item.media.url}
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center rounded-md bg-muted text-sm text-muted-foreground">
                  {item.productName}
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <Link className="font-semibold hover:text-primary" href={`/shop/${item.slug}`}>
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{item.sku}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stock checked: {item.stockSnapshot}
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(item.unitPrice, item.currencyCode)}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center rounded-md border border-border">
                  <button
                    className="grid size-10 place-items-center"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="grid size-10 place-items-center"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={15} />
                  </button>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive"
                  onClick={() => removeLine(item._id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft">
        <h2 className="text-xl font-semibold">Summary</h2>
        <label className="mt-5 flex items-center gap-3 rounded-md border border-border p-3">
          <input
            checked={Boolean(cart.giftPackaging?.enabled)}
            onChange={(event) => setGiftPackaging(event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-semibold">
            <Gift aria-hidden="true" className="mr-2 inline" size={16} />
            Gift packaging
          </span>
        </label>
        <form action={applyGiftCard} className="mt-4 flex gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-border px-3"
            name="code"
            placeholder="Gift card code"
          />
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Apply
          </button>
        </form>
        <dl className="mt-5 grid gap-3 text-sm">
          <TotalRow
            label="Subtotal"
            value={formatMoney(cart.totals.subtotal, cart.totals.currencyCode)}
          />
          <TotalRow
            label="Gift packaging"
            value={formatMoney(cart.totals.giftPackagingFee, cart.totals.currencyCode)}
          />
          <TotalRow
            label="Gift card"
            value={`-${formatMoney(cart.totals.giftCardDiscount, cart.totals.currencyCode)}`}
          />
          <div className="border-t border-border pt-3">
            <TotalRow
              label="Total"
              strong
              value={formatMoney(cart.totals.grandTotal, cart.totals.currencyCode)}
            />
          </div>
        </dl>
        <Link
          className="mt-5 block h-12 rounded-md bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
          href="/shop"
        >
          Keep Shopping
        </Link>
      </aside>
    </div>
  );
}

function TotalRow({
  label,
  strong = false,
  value,
}: Readonly<{ label: string; strong?: boolean; value: string }>) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
