"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import { commerceFetch, formatMoney, type Wishlist } from "@/lib/commerce";
import { useAuthStore } from "@/stores/authStore";

export function WishlistClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [wishlist, setWishlist] = useState<Wishlist>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadWishlist();
  }, [accessToken]);

  async function loadWishlist() {
    try {
      const payload = await commerceFetch<{ wishlist: Wishlist }>("/commerce/wishlist", {
        accessToken,
      });
      setWishlist(payload.wishlist);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wishlist could not load");
    }
  }

  async function removeItem(lineItemId: string) {
    const payload = await commerceFetch<{ wishlist: Wishlist }>(
      `/commerce/wishlist/items/${lineItemId}`,
      {
        accessToken,
        method: "DELETE",
      },
    );
    setWishlist(payload.wishlist);
  }

  if (!wishlist) {
    return <p className="text-sm text-muted-foreground">{message || "Loading wishlist..."}</p>;
  }

  if (!wishlist.items.length) {
    return (
      <EmptyState
        title="Wishlist is empty"
        message="Save products from the shop to track price and stock changes."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wishlist.items.map((item) => (
        <article className="rounded-lg border border-border bg-card p-3 shadow-soft" key={item._id}>
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
          <div className="pt-4">
            <Link className="font-semibold hover:text-primary" href={`/shop/${item.slug}`}>
              {item.productName}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{item.sku}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.priceChanged ? <Signal label="Price changed" /> : null}
              {item.stockChanged ? <Signal label="Stock changed" /> : null}
              {item.currentStock <= 0 ? <Signal label="Out of stock" /> : null}
            </div>
            <p className="mt-3 text-sm">
              {formatMoney(item.currentPrice)}{" "}
              <span className="text-muted-foreground">was {formatMoney(item.priceSnapshot)}</span>
            </p>
            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive"
              onClick={() => removeItem(item._id)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Signal({ label }: Readonly<{ label: string }>) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-primary">
      {label}
    </span>
  );
}
