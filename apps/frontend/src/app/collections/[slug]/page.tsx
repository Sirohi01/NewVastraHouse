import { CatalogPage } from "@/components/catalog/CatalogPage";
import { ErrorState } from "@/components/states/ErrorState";
import { getCollection, type CatalogQuery } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export default async function CollectionPage({
  params,
  searchParams,
}: Readonly<CollectionPageProps>) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};

  try {
    const { collection } = await getCollection(slug);

    return (
      <CatalogPage
        description={collection.description ?? `Products in ${collection.name}.`}
        query={{ ...query, collectionId: collection._id }}
        title={collection.name}
      />
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Collection could not load"
          message={error instanceof Error ? error.message : "Collection request failed"}
        />
      </main>
    );
  }
}
