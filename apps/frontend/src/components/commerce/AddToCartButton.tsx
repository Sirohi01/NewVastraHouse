"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { commerceFetch, type Cart } from "@/lib/commerce";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

export function AddToCartButton({
  productId,
  purchaseMode = "regular",
  quantity = 1,
  variantId,
}: Readonly<{
  productId: string;
  purchaseMode?: "regular" | "pre_order";
  quantity?: number;
  variantId: string;
}>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setCart = useCartStore((state) => state.setCart);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addToCart() {
    setSubmitting(true);
    setMessage("");

    try {
      const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart/items", {
        accessToken,
        body: JSON.stringify({ productId, purchaseMode, quantity, variantId }),
        method: "POST",
      });
      setCart(payload.cart);
      setMessage("Added to cart");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Add to cart failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
        onClick={addToCart}
        type="button"
      >
        <ShoppingBag aria-hidden="true" size={18} />
        {submitting ? "Adding" : "Add to Cart"}
      </button>
      {message ? <p className="mt-2 text-sm font-semibold text-accent">{message}</p> : null}
    </div>
  );
}
