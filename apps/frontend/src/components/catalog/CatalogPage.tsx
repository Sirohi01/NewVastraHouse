import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ErrorState } from "@/components/states/ErrorState";
import { getProducts, type CatalogQuery } from "@/lib/catalog";

export async function CatalogPage({
  description,
  query,
  title,
}: Readonly<{ description: string; query: CatalogQuery & { view?: string }; title: string }>) {
  const view = query.view === "list" ? "list" : "grid";
  const catalogQuery: CatalogQuery = {
    categoryId: query.categoryId,
    collectionId: query.collectionId,
    color: query.color,
    fabric: query.fabric,
    maxPrice: query.maxPrice,
    minPrice: query.minPrice,
    page: query.page,
    search: query.search,
    size: query.size,
    sort: query.sort ?? "-newest",
    tagId: query.tagId,
  };

  try {
    const products = await getProducts({ ...catalogQuery, limit: "12" });

    return (
      <main className="mx-auto min-h-[calc(100vh-144px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>
        <CatalogToolbar query={catalogQuery} total={products.meta.total} view={view} />
        <div className="mt-6">
          <ProductGrid products={products.data} view={view} />
        </div>
        <Pagination meta={products.meta} query={{ ...catalogQuery, view }} />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title={`${title} could not load`}
          message={error instanceof Error ? error.message : "Catalog request failed"}
        />
      </main>
    );
  }
}
