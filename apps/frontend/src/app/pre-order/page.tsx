import { CatalogPage } from "@/components/catalog/CatalogPage";

export const dynamic = "force-dynamic";

export default async function PreOrderPage() {
  return (
    <CatalogPage
      description="Reserve active limited-run pieces within their booking window and track production after checkout."
      query={{ preOrder: "true", sort: "-newest" }}
      title="Pre-Order"
    />
  );
}
