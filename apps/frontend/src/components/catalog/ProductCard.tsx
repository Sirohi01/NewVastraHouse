"use client";

import { Eye, Heart } from "lucide-react";
import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  getProductMedia,
  getProductPrice,
  getProductPricing,
  type CatalogProduct,
} from "@/lib/catalog";
import { ComparisonToggle } from "@/components/catalog/ComparisonToggle";
import { WishlistButton } from "@/components/commerce/WishlistButton";

export function ProductCard({
  product,
  view = "grid",
}: Readonly<{ product: CatalogProduct; view?: "grid" | "list" }>) {
  const media = getProductMedia(product)[0];
  const price = getProductPrice(product);
  const pricing = getProductPricing(product);
  const storedProduct = {
    imageUrl: media?.url,
    name: product.name,
    price,
    slug: product.slug,
  };

  return (
    <article
      className={`group rounded-sm border border-[#e1d6c4] bg-white p-2.5 transition-shadow duration-200 hover:shadow-md ${
        view === "list" ? "grid gap-4 sm:grid-cols-[180px_1fr]" : ""
      }`}
    >
      <Link
        className="relative block overflow-hidden rounded-sm bg-[#d9c3a4]"
        href={`/shop/${product.slug}`}
      >
        {media?.url ? (
          <ResponsiveImage
            alt={media.altText ?? product.name}
            aspectRatio="1 / 1"
            className="transition-transform duration-300 group-hover:scale-105"
            objectFit={media.objectFit ?? "cover"}
            sizes={view === "list" ? "180px" : "(max-width: 768px) 50vw, 25vw"}
            src={media.url}
          />
        ) : (
          <div className="grid aspect-square place-items-center bg-muted text-sm font-semibold text-muted-foreground">
            {product.name}
          </div>
        )}
        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/70 bg-white/30 text-white backdrop-blur">
          <Heart aria-hidden="true" size={17} />
        </span>
        <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white text-[#6e1423] shadow-soft">
          <Eye aria-hidden="true" size={17} />
        </span>
        {pricing.hasSale ? (
          <span className="absolute left-3 top-3 rounded-sm bg-[#6e1423] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Sale
          </span>
        ) : null}
        {Object.entries(product.computedBadges ?? {})
          .filter(([, value]) => value)
          .slice(0, 1)
          .map(([badge]) => (
            <span
              className={`absolute left-3 rounded-sm bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6e1423] ${
                pricing.hasSale ? "top-11" : "top-3"
              }`}
              key={badge}
            >
              {formatBadge(badge)}
            </span>
          ))}
      </Link>
      <div className="flex min-w-0 flex-col pt-2.5 sm:pt-0">
        <Link
          className="font-medium leading-snug hover:text-primary"
          href={`/shop/${product.slug}`}
        >
          {product.name}
        </Link>
        {product.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : null}
        <div className="mt-auto grid gap-2 pt-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#3d2a18]">{pricing.price}</span>
            {pricing.hasSale ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {pricing.original}
                </span>
                <span className="text-xs font-semibold uppercase text-[#6e1423]">
                  {pricing.discountPercent}% Off
                </span>
              </>
            ) : null}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <ComparisonToggle className="w-full min-w-0 px-2" product={storedProduct} />
            {product.variants[0]?._id ? (
              <WishlistButton
                className="min-w-0"
                productId={product._id}
                variantId={product.variants[0]._id}
              />
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
