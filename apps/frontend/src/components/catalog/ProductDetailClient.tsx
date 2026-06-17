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
  type CatalogProduct,
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div>
          {media[selectedMedia]?.url ? (
            <ResponsiveImage
              alt={media[selectedMedia].altText ?? product.name}
              aspectRatio={media[selectedMedia].aspectRatio ?? "4/5"}
              className="rounded-lg"
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              src={media[selectedMedia].url}
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center rounded-lg bg-muted text-muted-foreground">
              {product.name}
            </div>
          )}
          {media.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {media.map((item, index) => (
                <button
                  className={`rounded-md border p-1 ${index === selectedMedia ? "border-primary" : "border-border"}`}
                  key={`${item.url}-${index}`}
                  onClick={() => setSelectedMedia(index)}
                  type="button"
                >
                  <ResponsiveImage
                    alt={item.altText ?? product.name}
                    aspectRatio={item.aspectRatio ?? "4/5"}
                    className="rounded-sm"
                    src={item.url}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(pdp.badges ?? product.computedBadges ?? {})
              .filter(([, value]) => value)
              .map(([badge]) => (
                <span
                  className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-primary"
                  key={badge}
                >
                  {badge.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                </span>
              ))}
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{product.name}</h1>
          {product.shortDescription ? (
            <p className="mt-3 leading-7 text-muted-foreground">{product.shortDescription}</p>
          ) : null}
          <p className="mt-5 text-2xl font-semibold">
            {getProductPrice({ ...product, variants: [variant] })}
          </p>

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

          <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
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
              {product.sizeGuide ??
                "Use your usual size. Detailed measurements will appear from the catalog backend."}
            </DetailSection>
          </div>
        </div>
      </section>

      <MerchandisingSection title="Related Products" products={pdp.merchandising.relatedProducts} />
      <MerchandisingSection title="Recommended" products={pdp.merchandising.recommendedProducts} />
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
    </main>
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
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">{title}</h2>
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
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">Reviews & Ratings</h2>
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
