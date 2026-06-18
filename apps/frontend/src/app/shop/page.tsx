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
      description="Timeless designs crafted with heritage, perfect for every moment."
      query={query}
      title="Shop The Collection"
    />
  );
}
