"use client";

import { Gift, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import { commerceFetch, formatMoney, type Cart } from "@/lib/commerce";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export function CartClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setCartStore = useCartStore((state) => state.setCart);
  const [cart, setCartState] = useState<Cart>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadCart();
  }, [accessToken]);

  async function loadCart() {
    try {
      const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart", { accessToken });
      applyCart(payload.cart);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cart could not load");
    }
  }

  function applyCart(nextCart: Cart) {
    setCartState(nextCart);
    setCartStore(nextCart);
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
    applyCart(payload.cart);
  }

  async function removeLine(lineItemId: string) {
    const payload = await commerceFetch<{ cart: Cart }>(`/commerce/cart/items/${lineItemId}`, {
      accessToken,
      method: "DELETE",
    });
    applyCart(payload.cart);
  }

  async function updatePurchaseMode(lineItemId: string, purchaseMode: "regular" | "pre_order") {
    const payload = await commerceFetch<{ cart: Cart }>(
      `/commerce/cart/items/${lineItemId}/purchase-mode`,
      {
        accessToken,
        body: JSON.stringify({ purchaseMode }),
        method: "PATCH",
      },
    );
    applyCart(payload.cart);
  }

  async function setGiftPackaging(enabled: boolean) {
    const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/gift-packaging", {
      accessToken,
      body: JSON.stringify({ enabled }),
      method: "PATCH",
    });
    applyCart(payload.cart);
  }

  async function applyGiftCard(formData: FormData) {
    const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/gift-cards/validate", {
      accessToken,
      body: JSON.stringify({ code: formData.get("code") }),
      method: "POST",
    });
    applyCart(payload.cart);
  }

  if (!cart) {
    return <p className="text-sm text-muted-foreground">{message || "Loading cart..."}</p>;
  }

  if (!cart.items.length) {
    return (
      <EmptyState title="Cart is empty" message="Add products from the shop to build your order." />
    );
  }

  const taxBreakdown = cart.totals.taxBreakdown?.filter((tax) => tax.gstAmount > 0) ?? [];
  const giftCardDiscount = cart.totals.giftCardDiscount;
  const payableNow = calculateCartPayableNow(cart);
  const showPayableNow = payableNow < cart.totals.grandTotal;
  const balanceLater = Math.max(0, cart.totals.grandTotal - payableNow);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {cart.items.map((item) => (
          <article
            className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-soft transition-shadow duration-200 hover:shadow-lifted sm:grid-cols-[120px_1fr]"
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
                    {item.purchaseMode === "pre_order" || item.preOrder?.enabled
                      ? `Pre-order${
                          item.preOrder?.paymentMode === "advance" || item.preOrder?.advancePercent
                            ? ` · ${item.preOrder?.advancePercent ?? 0}% advance`
                            : " · full payment"
                        }`
                      : "Ready stock · direct order"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stock checked: {item.stockSnapshot}
                    {item.gstRate ? ` · GST ${item.gstRate}% included` : ""}
                    {item.hsnCode ? ` · HSN ${item.hsnCode}` : ""}
                  </p>
                  {item.preOrder?.enabled || item.preOrderOption?.enabled ? (
                    <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Purchase type
                      <select
                        className="mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm normal-case tracking-normal text-foreground"
                        onChange={(event) =>
                          updatePurchaseMode(
                            item._id,
                            event.target.value as "regular" | "pre_order",
                          )
                        }
                        value={
                          item.purchaseMode ?? (item.preOrder?.enabled ? "pre_order" : "regular")
                        }
                      >
                        <option value="regular">Regular order</option>
                        <option value="pre_order">Pre-order</option>
                      </select>
                    </label>
                  ) : null}
                </div>
                <p className="font-semibold">{formatMoney(item.unitPrice, item.currencyCode)}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center rounded-md border border-border">
                  <button
                    className="grid size-10 place-items-center transition-colors hover:bg-muted"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="grid size-10 place-items-center transition-colors hover:bg-muted"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={15} />
                  </button>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
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
        <h2 className="font-serif text-xl uppercase tracking-wide text-[#3d1620]">Summary</h2>
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
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Apply
          </button>
        </form>
        <dl className="mt-5 grid gap-3 text-sm">
          <TotalRow
            label="Taxable value"
            value={formatMoney(cart.totals.taxableAmount ?? 0, cart.totals.currencyCode)}
          />
          {taxBreakdown.map((tax) => (
            <TotalRow
              key={tax.gstRate}
              label={`GST ${tax.gstRate}%`}
              value={formatMoney(tax.gstAmount, cart.totals.currencyCode)}
            />
          ))}
          <TotalRow
            label="Subtotal incl. GST"
            value={formatMoney(cart.totals.subtotal, cart.totals.currencyCode)}
          />
          <TotalRow
            label="Gift packaging"
            value={formatMoney(cart.totals.giftPackagingFee, cart.totals.currencyCode)}
          />
          {giftCardDiscount > 0 ? (
            <TotalRow
              label="Gift card"
              value={`-${formatMoney(giftCardDiscount, cart.totals.currencyCode)}`}
            />
          ) : null}
          <div className="border-t border-border pt-3">
            {showPayableNow ? (
              <>
                <p className="mb-3 rounded-md bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                  This cart has a pre-order item. Pay the advance now; the remaining balance will be
                  collected before dispatch.
                </p>
                <TotalRow
                  label="Full order value"
                  value={formatMoney(cart.totals.grandTotal, cart.totals.currencyCode)}
                />
                <TotalRow
                  label="Balance later"
                  value={formatMoney(balanceLater, cart.totals.currencyCode)}
                />
                <div className="mt-2">
                  <TotalRow
                    label="Pre-order advance due now"
                    strong
                    value={formatMoney(payableNow, cart.totals.currencyCode)}
                  />
                </div>
              </>
            ) : (
              <TotalRow
                label="Total"
                strong
                value={formatMoney(cart.totals.grandTotal, cart.totals.currencyCode)}
              />
            )}
          </div>
        </dl>
        <Link
          className="mt-5 block h-12 rounded-md bg-primary px-4 py-3 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          href="/checkout"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}

function calculateCartPayableNow(cart: Cart) {
  const itemPayable = cart.items.reduce((total, item) => {
    const lineTotal = item.unitPrice * item.quantity;
    if (!item.preOrder?.enabled) {
      return total + lineTotal;
    }

    const isAdvance =
      item.preOrder.paymentMode === "advance" || Boolean(item.preOrder.advancePercent);
    const percent = isAdvance ? (item.preOrder.advancePercent ?? 0) : 100;

    return total + Math.round((lineTotal * percent) / 100);
  }, 0);
  const payable = itemPayable + cart.totals.giftPackagingFee - cart.totals.giftCardDiscount;

  return Math.max(0, Math.min(cart.totals.grandTotal, Math.round(payable)));
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
