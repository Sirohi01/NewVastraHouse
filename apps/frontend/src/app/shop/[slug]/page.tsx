import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { ErrorState } from "@/components/states/ErrorState";
import { getProductPdp, getProductReviews } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Readonly<ProductPageProps>) {
  const { slug } = await params;

  try {
    const [pdp, reviews] = await Promise.all([getProductPdp(slug), getProductReviews(slug)]);

    return <ProductDetailClient pdp={pdp} reviews={reviews.data} />;
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Product could not load"
          message={error instanceof Error ? error.message : "Product request failed"}
        />
      </main>
    );
  }
}
