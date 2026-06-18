"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { ComparisonToggle } from "@/components/catalog/ComparisonToggle";
import { ProductCard } from "@/components/catalog/ProductCard";
import { RecentlyViewed } from "@/components/catalog/RecentlyViewed";
import { ReviewForm } from "@/components/catalog/ReviewForm";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  getProductMedia,
  getProductPrice,
  getProductPricing,
  type CatalogProduct,
  type MediaReference,
  type PdpResponse,
  type ProductReview,
} from "@/lib/catalog";

export function ProductDetailClient({
  pdp,
  reviews,
}: Readonly<{ pdp: PdpResponse; reviews: ProductReview[] }>) {
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const product = pdp.product;
  const media = getProductMedia(product);
  const variant = product.variants[selectedVariant] ?? product.variants[0];
  const pricing = getProductPricing({ ...product, variants: [variant] });
  const storedProduct = useMemo(
    () => ({
      imageUrl: media[0]?.url,
      name: product.name,
      price: getProductPrice(product),
      slug: product.slug,
    }),
    [media, product],
  );

  return (
    <main className="bg-[#fbf7ef]">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div>
          {media[selectedMedia]?.url ? (
            <ProductMediaFrame
              alt={media[selectedMedia].altText ?? product.name}
              media={media[selectedMedia]}
              priority
            />
          ) : (
            <div className="grid aspect-square place-items-center rounded-sm bg-muted text-muted-foreground">
              {product.name}
            </div>
          )}
          {media.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {media.map((item, index) => (
                <button
                  className={`rounded-sm border p-1 transition-colors ${index === selectedMedia ? "border-[#6e1423]" : "border-[#e1d6c4] hover:border-[#caa14e]"}`}
                  key={`${item.url}-${index}`}
                  onClick={() => setSelectedMedia(index)}
                  type="button"
                >
                  <ProductMediaFrame alt={item.altText ?? product.name} media={item} thumbnail />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-sm border border-[#e1d6c4] bg-[#fffdf8] p-6">
          <div className="flex flex-wrap gap-2">
            {pricing.hasSale ? (
              <span className="rounded-sm bg-[#6e1423] px-2 py-1 text-xs font-semibold uppercase text-white">
                Sale
              </span>
            ) : null}
            {Object.entries(pdp.badges ?? product.computedBadges ?? {})
              .filter(([, value]) => value)
              .map(([badge]) => (
                <span
                  className="rounded-sm bg-[#efe4d4] px-2 py-1 text-xs font-semibold uppercase text-[#6e1423]"
                  key={badge}
                >
                  {badge.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                </span>
              ))}
          </div>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-[#3d1620]">{product.name}</h1>
          {product.shortDescription ? (
            <p className="mt-3 leading-7 text-muted-foreground">{product.shortDescription}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-2xl font-semibold text-[#3d2a18]">{pricing.price}</p>
            {pricing.hasSale ? (
              <>
                <p className="pb-0.5 text-base text-muted-foreground line-through">
                  {pricing.original}
                </p>
                <p className="pb-1 text-sm font-semibold uppercase text-[#6e1423]">
                  {pricing.discountPercent}% Off
                </p>
              </>
            ) : null}
          </div>
          {variant?.preOrder?.enabled ? <PreOrderPanel variant={variant} /> : null}

          <div className="mt-6 grid gap-4">
            <VariantSelector
              label="Color"
              options={[...new Set(product.variants.map((item) => item.color).filter(isString))]}
              selected={variant?.color}
              onSelect={(value) => selectVariant(product, setSelectedVariant, "color", value)}
            />
            <VariantSelector
              label="Size"
              options={[...new Set(product.variants.map((item) => item.size).filter(isString))]}
              selected={variant?.size}
              onSelect={(value) => selectVariant(product, setSelectedVariant, "size", value)}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCartButton productId={product._id} variantId={String(variant?._id)} />
            <ComparisonToggle product={storedProduct} />
            <WishlistButton productId={product._id} variantId={String(variant?._id)} />
          </div>

          <div className="mt-8 divide-y divide-[#e1d6c4] rounded-sm border border-[#e1d6c4] bg-white">
            <DetailSection title="Highlights">
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {(product.highlights?.length
                  ? product.highlights
                  : ["Designed for everyday festive dressing."]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DetailSection>
            <DetailSection title="Fabric Details">
              {product.fabricDetails ??
                "Fabric details will appear once the product team publishes them."}
            </DetailSection>
            <DetailSection title="Wash Care">
              {product.washCare ?? "Gentle wash recommended. Follow garment label instructions."}
            </DetailSection>
            <DetailSection title="Size Guide">
              <div className="grid gap-3">
                <p>
                  {product.sizeGuide ??
                    "Use your usual size. Detailed measurements will appear from the catalog backend."}
                </p>
                {product.sizeGuideMedia?.url ? (
                  <ResponsiveImage
                    alt={product.sizeGuideMedia.altText ?? `${product.name} size guide`}
                    aspectRatio={product.sizeGuideMedia.aspectRatio ?? "16 / 9"}
                    className="rounded-sm border border-[#e1d6c4]"
                    objectFit={product.sizeGuideMedia.objectFit}
                    src={product.sizeGuideMedia.url}
                  />
                ) : null}
              </div>
            </DetailSection>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-10">
        <MerchandisingSection
          title="Related Products"
          products={pdp.merchandising.relatedProducts}
        />
        <MerchandisingSection
          title="Recommended"
          products={pdp.merchandising.recommendedProducts}
        />
        <MerchandisingSection
          title="Frequently Bought Together"
          products={pdp.merchandising.frequentlyBoughtTogether}
        />
        <MerchandisingSection
          title="Complete The Look"
          products={pdp.merchandising.completeTheLook}
        />
        <ReviewsSection product={product} reviews={reviews} />
        <RecentlyViewed product={storedProduct} />
      </div>
    </main>
  );
}

function PreOrderPanel({
  variant,
}: Readonly<{
  variant: CatalogProduct["variants"][number];
}>) {
  const preOrder = variant.preOrder;

  if (!preOrder?.enabled) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-primary">Pre-order active</p>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>Booking closes: {formatDate(preOrder.endAt)}</p>
        <p>Remaining: {preOrder.remainingQuantity ?? 0}</p>
        <p>Dispatch: {formatDate(preOrder.expectedDispatchAt)}</p>
        <p>Delivery: {formatDate(preOrder.expectedDeliveryAt)}</p>
        <p className="sm:col-span-2">
          Payment:{" "}
          {preOrder.paymentMode === "advance"
            ? `${preOrder.advancePercent ?? 50}% advance`
            : "Full payment"}
        </p>
      </div>
    </div>
  );
}

function ProductMediaFrame({
  alt,
  media,
  priority = false,
  thumbnail = false,
}: Readonly<{
  alt: string;
  media: MediaReference;
  priority?: boolean;
  thumbnail?: boolean;
}>) {
  if (media.type === "video") {
    return (
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-sm border border-[#e1d6c4] bg-black">
        <video
          aria-label={alt}
          className="size-full object-cover"
          controls={!thumbnail}
          muted={thumbnail}
          playsInline
          preload="metadata"
          src={media.url}
        />
        {thumbnail ? (
          <span className="absolute bottom-2 left-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white">
            Video
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <ResponsiveImage
      alt={alt}
      aspectRatio={media.aspectRatio ?? "1 / 1"}
      className="rounded-sm border border-[#e1d6c4]"
      objectFit={media.objectFit}
      priority={priority}
      sizes={thumbnail ? "20vw" : "(max-width: 1024px) 100vw, 55vw"}
      src={media.url}
    />
  );
}

function VariantSelector({
  label,
  onSelect,
  options,
  selected,
}: Readonly<{
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  selected?: string;
}>) {
  if (!options.length) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`h-10 rounded-md border px-3 text-sm font-semibold ${
              selected === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            }`}
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <details className="group p-4" open={title === "Highlights"}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        {title}
        <ChevronDown className="transition group-open:rotate-180" size={18} />
      </summary>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </details>
  );
}

function MerchandisingSection({
  products,
  title,
}: Readonly<{ products: CatalogProduct[]; title: string }>) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-[#e1d6c4] pt-8">
      <h2 className="font-serif text-2xl uppercase tracking-wide text-[#3d1620]">{title}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function ReviewsSection({
  product,
  reviews,
}: Readonly<{ product: CatalogProduct; reviews: ProductReview[] }>) {
  return (
    <section className="mt-12 border-t border-[#e1d6c4] pt-8">
      <h2 className="font-serif text-2xl uppercase tracking-wide text-[#3d1620]">
        Reviews & Ratings
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reviews.length ? (
          reviews.map((review) => (
            <article className="rounded-lg border border-border bg-card p-4" key={review._id}>
              <p className="font-semibold">
                {review.rating}/5 {review.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                {review.guestName ?? "Customer"}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Approved reviews will appear here after moderation.
          </p>
        )}
      </div>
      <ReviewForm slug={product.slug} />
    </section>
  );
}

function selectVariant(
  product: CatalogProduct,
  setSelectedVariant: (value: number) => void,
  key: "color" | "size",
  value: string,
) {
  const index = product.variants.findIndex((variant) => variant[key] === value);

  if (index >= 0) {
    setSelectedVariant(index);
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(new Date(value))
    : "-";
}
