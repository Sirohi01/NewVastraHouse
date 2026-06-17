"use client";

import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { useRecentlyViewed, type StoredProduct } from "@/lib/catalogStorage";

export function RecentlyViewed({ product }: Readonly<{ product: StoredProduct }>) {
  const items = useRecentlyViewed(product);

  if (!items.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">Recently Viewed</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <Link
            className="rounded-lg border border-border bg-card p-3 shadow-soft"
            href={`/shop/${item.slug}`}
            key={item.slug}
          >
            {item.imageUrl ? (
              <ResponsiveImage
                alt={item.name}
                aspectRatio="4/5"
                className="rounded-md"
                src={item.imageUrl}
              />
            ) : (
              <div className="grid aspect-[4/5] place-items-center rounded-md bg-muted text-sm text-muted-foreground">
                {item.name}
              </div>
            )}
            <div className="pt-3">
              <h3 className="font-semibold">{item.name}</h3>
              {item.price ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.price}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
