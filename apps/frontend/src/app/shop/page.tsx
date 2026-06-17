import { CatalogPage } from "@/components/catalog/CatalogPage";
import type { CatalogQuery } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export default async function ShopPage({ searchParams }: Readonly<ShopPageProps>) {
  const query = (await searchParams) ?? {};

  return (
    <CatalogPage
      description="Browse all active products with size, color, fabric, price, collection, tag, sort, and pagination support."
      query={query}
      title="Shop"
    />
  );
}
