"use client";

import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { getProductMedia, getProductPrice, type CatalogProduct } from "@/lib/catalog";
import { ComparisonToggle } from "@/components/catalog/ComparisonToggle";
import { WishlistButton } from "@/components/commerce/WishlistButton";

export function ProductCard({
  product,
  view = "grid",
}: Readonly<{ product: CatalogProduct; view?: "grid" | "list" }>) {
  const media = getProductMedia(product)[0];
  const price = getProductPrice(product);
  const storedProduct = {
    imageUrl: media?.url,
    name: product.name,
    price,
    slug: product.slug,
  };

  return (
    <article
      className={`rounded-lg border border-border bg-card p-3 shadow-soft ${
        view === "list" ? "grid gap-4 sm:grid-cols-[180px_1fr]" : ""
      }`}
    >
      <Link href={`/shop/${product.slug}`}>
        {media?.url ? (
          <ResponsiveImage
            alt={media.altText ?? product.name}
            aspectRatio={media.aspectRatio ?? "4/5"}
            className="rounded-md"
            objectFit={media.objectFit ?? "cover"}
            sizes={view === "list" ? "180px" : "(max-width: 768px) 50vw, 25vw"}
            src={media.url}
          />
        ) : (
          <div className="grid aspect-[4/5] place-items-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
            {product.name}
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-col pt-4 sm:pt-0">
        <Link
          className="font-semibold leading-snug hover:text-primary"
          href={`/shop/${product.slug}`}
        >
          {product.name}
        </Link>
        {product.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(product.computedBadges ?? {})
            .filter(([, value]) => value)
            .slice(0, 2)
            .map(([badge]) => (
              <span
                className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-primary"
                key={badge}
              >
                {formatBadge(badge)}
              </span>
            ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="font-semibold">{price}</span>
          <div className="flex flex-wrap gap-2">
            <ComparisonToggle product={storedProduct} />
            {product.variants[0]?._id ? (
              <WishlistButton productId={product._id} variantId={product.variants[0]._id} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatBadge(value: string) {
  return value
    .replace(/[A-Z]/g, (letter) => ` ${letter}`)
    .replace(/^./, (letter) => letter.toUpperCase());
}
