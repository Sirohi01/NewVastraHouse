"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import { getProduct, getProductMedia, getProductPrice, type CatalogProduct } from "@/lib/catalog";
import { useStoredComparison } from "@/lib/catalogStorage";

export function CompareClient() {
  const { clear, items } = useStoredComparison();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const results = await Promise.allSettled(items.map((item) => getProduct(item.slug)));
      if (!cancelled) {
        setProducts(
          results
            .filter(
              (result): result is PromiseFulfilledResult<{ product: CatalogProduct }> =>
                result.status === "fulfilled",
            )
            .map((result) => result.value.product),
        );
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!items.length) {
    return (
      <EmptyState
        title="No products selected"
        message="Use Compare on product cards or product detail pages to build a comparison table."
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading comparison...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{products.length} products selected</p>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive"
          onClick={clear}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
          Clear
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <tbody>
            <CompareRow
              label="Product"
              values={products.map((product) => {
                const media = getProductMedia(product)[0];
                return (
                  <Link className="block" href={`/shop/${product.slug}`} key={product.slug}>
                    {media?.url ? (
                      <ResponsiveImage
                        alt={product.name}
                        aspectRatio="4/5"
                        className="mb-3 max-w-44 rounded-md"
                        src={media.url}
                      />
                    ) : null}
                    <span className="font-semibold">{product.name}</span>
                  </Link>
                );
              })}
            />
            <CompareRow
              label="Price"
              values={products.map((product) => getProductPrice(product))}
            />
            <CompareRow
              label="Sizes"
              values={products.map(
                (product) => unique(product.variants.map((item) => item.size)).join(", ") || "NA",
              )}
            />
            <CompareRow
              label="Colors"
              values={products.map(
                (product) => unique(product.variants.map((item) => item.color)).join(", ") || "NA",
              )}
            />
            <CompareRow
              label="Fabric"
              values={products.map((product) => product.fabricDetails ?? "NA")}
            />
            <CompareRow
              label="Wash Care"
              values={products.map((product) => product.washCare ?? "NA")}
            />
            <CompareRow
              label="Highlights"
              values={products.map((product) => product.highlights?.join(", ") || "NA")}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
}: Readonly<{ label: string; values: Array<React.ReactNode> }>) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <th className="w-40 bg-muted p-4 align-top font-semibold">{label}</th>
      {values.map((value, index) => (
        <td className="min-w-44 p-4 align-top text-muted-foreground" key={`${label}-${index}`}>
          {value}
        </td>
      ))}
    </tr>
  );
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
