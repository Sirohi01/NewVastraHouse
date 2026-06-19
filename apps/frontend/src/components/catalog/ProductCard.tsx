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
  const sizes = [...new Set(product.variants.map((variant) => variant.size).filter(isString))];
  const hasPreOrder = product.variants.some(
    (variant) => variant.preOrder?.enabled && (variant.preOrder.remainingQuantity ?? 0) > 0,
  );
  const storedProduct = {
    imageUrl: media?.url,
    name: product.name,
    price,
    slug: product.slug,
  };

  return (
    <article
      className={`group rounded-sm border border-[#e1d6c4] bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#caa14e] hover:shadow-[0_18px_38px_-22px_rgba(110,20,35,0.6)] ${
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
            aspectRatio="9 / 16"
            className="transition-transform duration-500 group-hover:scale-105"
            objectFit={media.objectFit ?? "cover"}
            sizes={view === "list" ? "180px" : "(max-width: 768px) 50vw, 25vw"}
            src={media.url}
          />
        ) : (
          <div className="grid aspect-[9/16] place-items-center bg-muted text-sm font-semibold text-muted-foreground">
            {product.name}
          </div>
        )}
        <span className="pointer-events-none absolute inset-1.5 border border-white/0 transition-colors duration-200 group-hover:border-[#caa14e]/55" />
        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/70 bg-white/30 text-white backdrop-blur transition-colors hover:bg-[#6e1423] hover:text-[#f0d9a4]">
          <Heart aria-hidden="true" size={17} />
        </span>
        <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full border border-[#caa14e]/40 bg-white text-[#6e1423] shadow-soft">
          <Eye aria-hidden="true" size={17} />
        </span>
        {pricing.hasSale ? (
          <span className="absolute left-3 top-3 rounded-sm border border-[#f0d9a4]/50 bg-[#6e1423] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            Sale
          </span>
        ) : null}
        {Object.entries(product.computedBadges ?? {})
          .filter(([, value]) => value)
          .slice(0, 1)
          .map(([badge]) => (
            <span
              className={`absolute left-3 rounded-sm border border-[#caa14e]/40 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6e1423] ${
                pricing.hasSale ? "top-11" : "top-3"
              }`}
              key={badge}
            >
              {formatBadge(badge)}
            </span>
          ))}
        <span className="absolute left-3 bottom-3 rounded-sm border border-[#f0d9a4]/50 bg-[#fffaf1]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6e1423]">
          {hasPreOrder ? "Pre-order available" : "Preview only"}
        </span>
        {sizes.length ? (
          <div className="absolute inset-x-3 bottom-12 translate-y-2 rounded-sm border border-[#caa14e]/50 bg-white/95 px-2 py-2 opacity-0 shadow-soft transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9b6d35]">
              Sizes
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {sizes.map((size) => (
                <span
                  className="grid min-w-7 place-items-center rounded-sm border border-[#e1d6c4] px-1.5 py-0.5 text-[11px] font-semibold text-[#3d1620]"
                  key={size}
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-col pt-2.5 sm:pt-0">
        <Link
          className="font-serif font-medium leading-snug text-[#3d1620] transition-colors hover:text-[#6e1423]"
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

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function formatBadge(value: string) {
  return value
    .replace(/[A-Z]/g, (letter) => ` ${letter}`)
    .replace(/^./, (letter) => letter.toUpperCase());
}
