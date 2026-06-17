"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { commerceFetch, type Cart } from "@/lib/commerce";
import { useAuthStore } from "@/stores/authStore";

export function AddToCartButton({
  productId,
  quantity = 1,
  variantId,
}: Readonly<{ productId: string; quantity?: number; variantId: string }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addToCart() {
    setSubmitting(true);
    setMessage("");

    try {
      await commerceFetch<{ cart: Cart }>("/commerce/cart/items", {
        accessToken,
        body: JSON.stringify({ productId, quantity, variantId }),
        method: "POST",
      });
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
        className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
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
