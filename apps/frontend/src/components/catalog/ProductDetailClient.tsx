"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [purchaseMode, setPurchaseMode] = useState<"pre_order">("pre_order");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const product = pdp.product;
  const media = getProductMedia(product);
  const variant = product.variants[selectedVariant] ?? product.variants[0];
  const canPreOrder = Boolean(
    variant?.preOrder?.enabled && (variant.preOrder.remainingQuantity ?? 0) > 0,
  );
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

  useEffect(() => {
    if (canPreOrder) {
      setPurchaseMode("pre_order");
    }
  }, [canPreOrder]);

  return (
    <main className="bg-[#fbf7ef]">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(280px,0.72fr)_minmax(360px,1.28fr)]">
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          {media[selectedMedia]?.url ? (
            <div className="relative">
              <ProductMediaFrame
                alt={media[selectedMedia].altText ?? product.name}
                media={media[selectedMedia]}
                priority
              />
              <span className="pointer-events-none absolute inset-3 border border-[#caa14e]/35" />
              <CornerFiligree className="pointer-events-none absolute left-2 top-2 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute right-2 top-2 rotate-90 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute bottom-2 right-2 rotate-180 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute bottom-2 left-2 -rotate-90 text-[#caa14e]/75" />
            </div>
          ) : (
            <div className="grid aspect-[9/16] place-items-center rounded-sm bg-muted text-muted-foreground">
              {product.name}
            </div>
          )}
          {media.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {media.map((item, index) => (
                <button
                  className={`rounded-sm border p-1 transition-colors ${index === selectedMedia ? "border-[#6e1423] shadow-[0_0_0_3px_rgba(202,161,78,0.18)]" : "border-[#e1d6c4] hover:border-[#caa14e]"}`}
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

        <div className="overflow-hidden rounded-sm border border-[#e1d6c4] bg-[#fffdf8] shadow-[0_22px_56px_-44px_rgba(46,12,18,0.55)]">
          <div className="h-[3px] bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {pricing.hasSale ? (
                <span className="rounded-sm border border-[#f0d9a4]/50 bg-[#6e1423] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Sale
                </span>
              ) : null}
              {Object.entries(pdp.badges ?? product.computedBadges ?? {})
                .filter(([, value]) => value)
                .map(([badge]) => (
                  <span
                    className="rounded-sm border border-[#caa14e]/40 bg-[#efe4d4] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#6e1423]"
                    key={badge}
                  >
                    {badge.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                  </span>
                ))}
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[#3d1620]">
              {product.name}
            </h1>
            <FiligreeDivider align="start" className="mt-3" />
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

            {canPreOrder ? (
              <div className="mt-6 rounded-md border border-[#e1d6c4] bg-white p-3">
                <p className="text-sm font-semibold text-[#3d1620]">Pre-order booking only</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This storefront is currently accepting pre-order bookings only. Ready-stock
                  checkout will be enabled later.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-[#e1d6c4] bg-white p-3">
                <p className="text-sm font-semibold text-[#3d1620]">Preview only</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This product is visible in the catalog, but booking is not open yet.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {canPreOrder ? (
                <AddToCartButton
                  productId={product._id}
                  purchaseMode={purchaseMode}
                  variantId={String(variant?._id)}
                />
              ) : (
                <button
                  className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md border border-[#e1d6c4] px-5 text-sm font-semibold text-muted-foreground"
                  disabled
                  type="button"
                >
                  Pre-order unavailable
                </button>
              )}
              <ComparisonToggle product={storedProduct} />
              <WishlistButton productId={product._id} variantId={String(variant?._id)} />
            </div>

            <div className="mt-8 divide-y divide-[#e1d6c4] rounded-sm border border-[#e1d6c4] bg-white">
              <DetailSection title="Highlights">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-[#caa14e]">
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
    <div className="mt-5 rounded-lg border border-[#caa14e]/45 bg-[#fdf6e8] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#6e1423]">
        <span aria-hidden="true" className="text-[#caa14e]">
          ❖
        </span>
        Pre-order active
      </p>
      <div className="mt-3 grid gap-2 text-sm text-[#6f6256] sm:grid-cols-2">
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
      <div className="relative grid aspect-[9/16] place-items-center overflow-hidden rounded-sm border border-[#e1d6c4] bg-black">
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
      aspectRatio="9 / 16"
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
      <p className="text-sm font-semibold uppercase tracking-wide text-[#3d1620]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`h-10 rounded-md border px-4 text-sm font-semibold transition-colors ${
              selected === option
                ? "border-[#6e1423] bg-[#6e1423] text-white shadow-[0_6px_16px_-8px_rgba(110,20,35,0.7)]"
                : "border-[#e1d6c4] bg-white text-[#3d1620] hover:border-[#caa14e]"
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
      <summary className="flex cursor-pointer list-none items-center justify-between font-serif font-semibold uppercase tracking-wide text-[#3d1620]">
        {title}
        <ChevronDown className="text-[#9b6d35] transition group-open:rotate-180" size={18} />
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
      <SectionHeading title={title} />
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
      <SectionHeading title="Reviews & Ratings" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reviews.length ? (
          reviews.map((review) => (
            <article
              className="rounded-lg border border-[#e5dac7] bg-[#fffaf1] p-4"
              key={review._id}
            >
              <p className="font-semibold text-[#3d1620]">
                <span className="text-[#caa14e]">★</span> {review.rating}/5 {review.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#9b6d35]">
                {review.guestName ?? "Customer"}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-[#e5dac7] bg-[#fffaf1] p-4 text-sm text-muted-foreground">
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

/* ---------- Royal ornamental helpers (presentational only) ---------- */

function SectionHeading({ title }: Readonly<{ title: string }>) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="text-[#caa14e]">
        ❖
      </span>
      <h2 className="font-serif text-2xl uppercase tracking-wide text-[#3d1620]">{title}</h2>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function FiligreeDivider({
  align = "center",
  className = "",
}: Readonly<{ align?: "center" | "start"; className?: string }>) {
  return (
    <div
      className={`flex items-center gap-2 text-[#caa14e] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
    >
      <span className="h-px w-10 bg-[linear-gradient(90deg,transparent,#caa14e)]" />
      <svg aria-hidden="true" height="14" viewBox="0 0 56 14" width="56">
        <path
          d="M2 7c8-6 14-6 18 0-4 6-10 6-18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="28" cy="7" fill="#6e1423" r="2.4" />
        <path
          d="M54 7c-8-6-14-6-18 0 4 6 10 6 18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="h-px w-10 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="28"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="28"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
