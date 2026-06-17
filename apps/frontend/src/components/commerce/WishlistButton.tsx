"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { commerceFetch, type Wishlist } from "@/lib/commerce";
import { useAuthStore } from "@/stores/authStore";

export function WishlistButton({
  productId,
  variantId,
}: Readonly<{ productId: string; variantId: string }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [message, setMessage] = useState("");

  async function addToWishlist() {
    try {
      await commerceFetch<{ wishlist: Wishlist }>("/commerce/wishlist/items", {
        accessToken,
        body: JSON.stringify({ productId, variantId }),
        method: "POST",
      });
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wishlist failed");
    }
  }

  return (
    <div>
      <button
        aria-label="Add to wishlist"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:border-primary hover:text-primary"
        onClick={addToWishlist}
        title="Add to wishlist"
        type="button"
      >
        <Heart aria-hidden="true" size={16} />
        Wishlist
      </button>
      {message ? <p className="mt-2 text-xs font-semibold text-accent">{message}</p> : null}
    </div>
  );
}
