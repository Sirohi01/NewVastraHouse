import { apiBaseUrl } from "@/lib/api";

export type MediaReference = {
  url: string;
  altText?: string;
  type: "image" | "video" | "pdf" | "lookbook";
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
};

export type ProductVariant = {
  _id: string;
  color?: string;
  size?: string;
  sku?: string;
  basePrice: number;
  salePrice?: number;
  currencyCode?: string;
  stockPlaceholder?: number;
  active?: boolean;
  media?: MediaReference[];
};

export type TaxonomyRef = {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
};

export type CatalogProduct = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  highlights?: string[];
  fabricDetails?: string;
  washCare?: string;
  sizeGuide?: string;
  media?: MediaReference[];
  variants: ProductVariant[];
  categoryIds?: TaxonomyRef[];
  collectionIds?: TaxonomyRef[];
  tagIds?: TaxonomyRef[];
  computedBadges?: Record<string, boolean>;
  seo?: { title?: string; description?: string };
};

export type ProductReview = {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  guestName?: string;
  verifiedPurchase?: boolean;
  createdAt?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type PdpResponse = {
  product: CatalogProduct;
  badges?: Record<string, boolean>;
  merchandising: {
    relatedProducts: CatalogProduct[];
    recommendedProducts: CatalogProduct[];
    frequentlyBoughtTogether: CatalogProduct[];
    completeTheLook: CatalogProduct[];
  };
};

export type CatalogQuery = {
  page?: string;
  limit?: string;
  search?: string;
  size?: string;
  color?: string;
  fabric?: string;
  minPrice?: string;
  maxPrice?: string;
  collectionId?: string;
  tagId?: string;
  categoryId?: string;
  sort?: string;
  view?: string;
};

export const filterOptions = {
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: ["Ivory", "Black", "Wine", "Emerald", "Navy", "Gold"],
  fabrics: ["Cotton", "Silk", "Chiffon", "Georgette", "Linen", "Velvet"],
  sorts: [
    { label: "Newest", value: "-newest" },
    { label: "Price: Low to High", value: "price" },
    { label: "Price: High to Low", value: "-price" },
    { label: "Best Selling", value: "-bestSelling" },
    { label: "Name", value: "name" },
  ],
};

export async function getProducts(query: CatalogQuery = {}) {
  return catalogFetch<PaginatedResult<CatalogProduct>>(`/catalog/products${toQueryString(query)}`);
}

export async function getProduct(slug: string) {
  return catalogFetch<{ product: CatalogProduct }>(`/catalog/products/${slug}`);
}

export async function getProductPdp(slug: string) {
  return catalogFetch<PdpResponse>(`/catalog/products/${slug}/pdp`);
}

export async function getProductReviews(slug: string, page = "1") {
  return catalogFetch<PaginatedResult<ProductReview>>(
    `/catalog/products/${slug}/reviews${toQueryString({ page, limit: "8" })}`,
  );
}

export async function getCategory(slug: string) {
  return catalogFetch<{ category: TaxonomyRef }>(`/catalog/categories/${slug}`);
}

export async function getCollection(slug: string) {
  return catalogFetch<{ collection: TaxonomyRef }>(`/catalog/collections/${slug}`);
}

export async function submitReview(slug: string, payload: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/catalog/products/${slug}/reviews`, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Review submission failed");
  }

  return response.json() as Promise<{ moderationStatus: "pending" }>;
}

export function getProductMedia(product: CatalogProduct) {
  return product.media?.length ? product.media : (product.variants[0]?.media ?? []);
}

export function getProductPrice(product: CatalogProduct) {
  const variant = product.variants[0];
  const price = variant?.salePrice ?? variant?.basePrice ?? 0;
  const currency = variant?.currencyCode ?? "INR";

  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

async function catalogFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error((await response.text()) || "Catalog request failed");
  }

  return response.json() as Promise<T>;
}

function toQueryString(query: CatalogQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }

  const value = params.toString();
  return value ? `?${value}` : "";
}
