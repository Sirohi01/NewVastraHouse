"use client";

import { Edit3, ImagePlus, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { EmptyState } from "@/components/states/EmptyState";
import { apiBaseUrl, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type MediaReference = {
  url: string;
  altText?: string;
  type: "image" | "video" | "pdf" | "lookbook";
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
  mediaId?: string;
};

type VariantForm = {
  color: string;
  size: string;
  sku: string;
  barcode: string;
  basePrice: string;
  salePrice: string;
  stockPlaceholder: string;
};

type Product = {
  _id: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  fabricDetails?: string;
  washCare?: string;
  sizeGuide?: string;
  hsnCode: string;
  gstRate: number;
  categoryIds: string[];
  collectionIds: string[];
  tagIds: string[];
  media: MediaReference[];
  variants: VariantForm[];
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
  };
  badgeOverrides?: {
    newArrival?: boolean;
    bestSeller?: boolean;
    trending?: boolean;
    limitedEdition?: boolean;
  };
  merchandisingMetrics?: {
    unitsSold30d?: number;
    views7d?: number;
    sales7d?: number;
    trendingScore?: number;
  };
  relatedProductIds?: string[];
  recommendedProductIds?: string[];
  frequentlyBoughtTogetherIds?: string[];
  completeTheLookIds?: string[];
  active: boolean;
};

type ProductForm = Omit<Product, "_id" | "slug" | "gstRate" | "variants"> & {
  slug: string;
  gstRate: string;
  variants: VariantForm[];
  seoTitle: string;
  seoDescription: string;
  seoCanonicalUrl: string;
  badgeNewArrival: boolean;
  badgeBestSeller: boolean;
  badgeTrending: boolean;
  badgeLimitedEdition: boolean;
  unitsSold30d: string;
  views7d: string;
  sales7d: string;
  trendingScore: string;
  relatedProductIds: string[];
  recommendedProductIds: string[];
  frequentlyBoughtTogetherIds: string[];
  completeTheLookIds: string[];
};

const blankVariant: VariantForm = {
  color: "",
  size: "",
  sku: "",
  barcode: "",
  basePrice: "",
  salePrice: "",
  stockPlaceholder: "0",
};

const blankForm: ProductForm = {
  brandId: "",
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  fabricDetails: "",
  washCare: "",
  sizeGuide: "",
  hsnCode: "",
  gstRate: "5",
  categoryIds: [],
  collectionIds: [],
  tagIds: [],
  media: [],
  variants: [blankVariant],
  seoTitle: "",
  seoDescription: "",
  seoCanonicalUrl: "",
  badgeNewArrival: false,
  badgeBestSeller: false,
  badgeTrending: false,
  badgeLimitedEdition: false,
  unitsSold30d: "0",
  views7d: "0",
  sales7d: "0",
  trendingScore: "0",
  relatedProductIds: [],
  recommendedProductIds: [],
  frequentlyBoughtTogetherIds: [],
  completeTheLookIds: [],
  active: true,
};

export default function AdminProductsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [products, setProducts] = useState<Product[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<ProductForm>(blankForm);
  const [editingId, setEditingId] = useState<string>();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const selectedMediaUrls = useMemo(
    () => new Set(form.media.map((item) => item.url)),
    [form.media],
  );

  async function loadProducts() {
    setMessage("Loading products...");
    const query = new URLSearchParams({ sort: "-newest" });

    if (search) {
      query.set("search", search);
    }

    const payload = await apiFetch<{ data: Product[] }>(
      `/catalog/admin/products?${query.toString()}`,
      {
        accessToken,
      },
    );
    setProducts(payload.data);
    setMessage("Products loaded");
  }

  async function loadMedia() {
    const response = await fetch(`${apiBaseUrl}/media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const payload = (await response.json()) as { media: MediaItem[] };
      setMedia(payload.media);
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadProducts();
      void loadMedia();
    }
  }, [accessToken]);

  function updateField(
    field: keyof ProductForm,
    value: string | boolean | string[] | MediaReference[] | VariantForm[],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateVariant(index: number, field: keyof VariantForm, value: string) {
    updateField(
      "variants",
      form.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  function addMedia(item: MediaItem) {
    if (selectedMediaUrls.has(item.secureUrl)) {
      return;
    }

    updateField("media", [
      ...form.media,
      {
        mediaId: item._id,
        url: item.secureUrl,
        altText: item.altText,
        type: item.resourceType === "video" ? "video" : "image",
        aspectRatio: item.selectedAspectRatio,
        objectFit: "cover",
      },
    ]);
  }

  function editProduct(product: Product) {
    setEditingId(product._id);
    setForm({
      ...blankForm,
      ...product,
      categoryIds: product.categoryIds?.map(String) ?? [],
      collectionIds: product.collectionIds?.map(String) ?? [],
      tagIds: product.tagIds?.map(String) ?? [],
      gstRate: String(product.gstRate),
      variants: product.variants?.length
        ? product.variants.map((variant) => ({
            color: variant.color ?? "",
            size: variant.size ?? "",
            sku: variant.sku ?? "",
            barcode: variant.barcode ?? "",
            basePrice: String(variant.basePrice ?? ""),
            salePrice: String(variant.salePrice ?? ""),
            stockPlaceholder: String(variant.stockPlaceholder ?? 0),
          }))
        : [blankVariant],
      seoTitle: product.seo?.title ?? "",
      seoDescription: product.seo?.description ?? "",
      seoCanonicalUrl: product.seo?.canonicalUrl ?? "",
      badgeNewArrival: product.badgeOverrides?.newArrival ?? false,
      badgeBestSeller: product.badgeOverrides?.bestSeller ?? false,
      badgeTrending: product.badgeOverrides?.trending ?? false,
      badgeLimitedEdition: product.badgeOverrides?.limitedEdition ?? false,
      unitsSold30d: String(product.merchandisingMetrics?.unitsSold30d ?? 0),
      views7d: String(product.merchandisingMetrics?.views7d ?? 0),
      sales7d: String(product.merchandisingMetrics?.sales7d ?? 0),
      trendingScore: String(product.merchandisingMetrics?.trendingScore ?? 0),
      relatedProductIds: product.relatedProductIds?.map(String) ?? [],
      recommendedProductIds: product.recommendedProductIds?.map(String) ?? [],
      frequentlyBoughtTogetherIds: product.frequentlyBoughtTogetherIds?.map(String) ?? [],
      completeTheLookIds: product.completeTheLookIds?.map(String) ?? [],
    });
    setMessage(`Editing ${product.name}`);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving product...");
    const payload = {
      brandId: form.brandId,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      shortDescription: form.shortDescription || undefined,
      fabricDetails: form.fabricDetails || undefined,
      washCare: form.washCare || undefined,
      sizeGuide: form.sizeGuide || undefined,
      hsnCode: form.hsnCode,
      gstRate: Number(form.gstRate),
      media: form.media,
      active: form.active,
      categoryIds: form.categoryIds.filter(Boolean),
      collectionIds: form.collectionIds.filter(Boolean),
      tagIds: form.tagIds.filter(Boolean),
      variants: form.variants.map((variant) => ({
        ...variant,
        sku: variant.sku || undefined,
        barcode: variant.barcode || undefined,
        basePrice: Number(variant.basePrice),
        salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
        stockPlaceholder: Number(variant.stockPlaceholder || 0),
      })),
      seo: {
        title: form.seoTitle || undefined,
        description: form.seoDescription || undefined,
        canonicalUrl: form.seoCanonicalUrl || undefined,
      },
      badgeOverrides: {
        newArrival: form.badgeNewArrival,
        bestSeller: form.badgeBestSeller,
        trending: form.badgeTrending,
        limitedEdition: form.badgeLimitedEdition,
      },
      merchandisingMetrics: {
        unitsSold30d: Number(form.unitsSold30d || 0),
        views7d: Number(form.views7d || 0),
        sales7d: Number(form.sales7d || 0),
        trendingScore: Number(form.trendingScore || 0),
      },
      relatedProductIds: form.relatedProductIds.filter(Boolean),
      recommendedProductIds: form.recommendedProductIds.filter(Boolean),
      frequentlyBoughtTogetherIds: form.frequentlyBoughtTogetherIds.filter(Boolean),
      completeTheLookIds: form.completeTheLookIds.filter(Boolean),
    };
    const path = editingId ? `/catalog/admin/products/${editingId}` : "/catalog/admin/products";
    const method = editingId ? "PATCH" : "POST";
    await apiFetch(path, {
      accessToken,
      method,
      body: JSON.stringify(payload),
    });
    setForm(blankForm);
    setEditingId(undefined);
    setMessage("Product saved");
    await loadProducts();
  }

  async function deleteProduct(productId: string) {
    setMessage("Deleting product...");
    await apiFetch(`/catalog/admin/products/${productId}`, {
      accessToken,
      method: "DELETE",
    });
    setMessage("Product deleted");
    await loadProducts();
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto min-h-[calc(100vh-144px)] max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">{message || "Manage catalog products."}</p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 font-semibold"
            onClick={() => void loadProducts()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-border px-3"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                value={search}
              />
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-primary-foreground"
                onClick={() => void loadProducts()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={18} />
                Search
              </button>
            </div>

            {products.length ? (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">GST</th>
                      <th className="p-3">Variants</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr className="border-t border-border" key={product._id}>
                        <td className="p-3">
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-muted-foreground">{product.slug}</div>
                        </td>
                        <td className="p-3">{product.gstRate}%</td>
                        <td className="p-3">{product.variants?.length ?? 0}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border border-border"
                              onClick={() => editProduct(product)}
                              title="Edit product"
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={16} />
                            </button>
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-primary"
                              onClick={() => void deleteProduct(product._id)}
                              title="Delete product"
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No products" message="Create the first catalog product." />
            )}
          </div>

          <form
            className="space-y-4 rounded-lg border border-border bg-card p-5"
            onSubmit={saveProduct}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit product" : "Create product"}
              </h2>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-primary-foreground">
                <Save aria-hidden="true" size={18} />
                Save
              </button>
            </div>

            <Field
              label="Brand ID"
              onChange={(value) => updateField("brandId", value)}
              required
              value={form.brandId}
            />
            <Field
              label="Name"
              onChange={(value) => updateField("name", value)}
              required
              value={form.name}
            />
            <Field
              label="Slug"
              onChange={(value) => updateField("slug", value)}
              value={form.slug}
            />
            <Textarea
              label="Description"
              onChange={(value) => updateField("description", value)}
              required
              value={form.description}
            />
            <Field
              label="Short description"
              onChange={(value) => updateField("shortDescription", value)}
              value={form.shortDescription ?? ""}
            />
            <Field
              label="Fabric details"
              onChange={(value) => updateField("fabricDetails", value)}
              value={form.fabricDetails ?? ""}
            />
            <Field
              label="Wash care"
              onChange={(value) => updateField("washCare", value)}
              value={form.washCare ?? ""}
            />
            <Field
              label="Size guide"
              onChange={(value) => updateField("sizeGuide", value)}
              value={form.sizeGuide ?? ""}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="HSN code"
                onChange={(value) => updateField("hsnCode", value)}
                required
                value={form.hsnCode}
              />
              <Field
                label="GST rate"
                onChange={(value) => updateField("gstRate", value)}
                required
                value={form.gstRate}
              />
            </div>
            <Field
              label="Category IDs"
              onChange={(value) => updateField("categoryIds", splitIds(value))}
              value={form.categoryIds.join(",")}
            />
            <Field
              label="Collection IDs"
              onChange={(value) => updateField("collectionIds", splitIds(value))}
              value={form.collectionIds.join(",")}
            />
            <Field
              label="Tag IDs"
              onChange={(value) => updateField("tagIds", splitIds(value))}
              value={form.tagIds.join(",")}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Variants</h3>
                <button
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border"
                  onClick={() => updateField("variants", [...form.variants, blankVariant])}
                  title="Add variant"
                  type="button"
                >
                  <Plus aria-hidden="true" size={18} />
                </button>
              </div>
              {form.variants.map((variant, index) => (
                <div
                  className="grid gap-2 rounded-md border border-border p-3"
                  key={`${variant.sku}-${index}`}
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label="Color"
                      onChange={(value) => updateVariant(index, "color", value)}
                      value={variant.color}
                    />
                    <Field
                      label="Size"
                      onChange={(value) => updateVariant(index, "size", value)}
                      value={variant.size}
                    />
                    <Field
                      label="SKU"
                      onChange={(value) => updateVariant(index, "sku", value)}
                      value={variant.sku}
                    />
                    <Field
                      label="Barcode"
                      onChange={(value) => updateVariant(index, "barcode", value)}
                      value={variant.barcode}
                    />
                    <Field
                      label="Base price"
                      onChange={(value) => updateVariant(index, "basePrice", value)}
                      required
                      value={variant.basePrice}
                    />
                    <Field
                      label="Sale price"
                      onChange={(value) => updateVariant(index, "salePrice", value)}
                      value={variant.salePrice}
                    />
                    <Field
                      label="Stock placeholder"
                      onChange={(value) => updateVariant(index, "stockPlaceholder", value)}
                      value={variant.stockPlaceholder}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <ImagePlus aria-hidden="true" size={18} />
                Media
              </div>
              <MediaPicker media={media} onSelect={addMedia} />
              {form.media.length ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {form.media.map((item) => (
                    <div className="rounded-md border border-border p-2" key={item.url}>
                      {item.url}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <Field
              label="SEO title"
              onChange={(value) => updateField("seoTitle", value)}
              value={form.seoTitle}
            />
            <Textarea
              label="SEO description"
              onChange={(value) => updateField("seoDescription", value)}
              value={form.seoDescription}
            />
            <Field
              label="Canonical URL"
              onChange={(value) => updateField("seoCanonicalUrl", value)}
              value={form.seoCanonicalUrl}
            />

            <div className="space-y-3">
              <h3 className="font-semibold">Badges</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Checkbox
                  checked={form.badgeNewArrival}
                  label="New Arrival"
                  onChange={(value) => updateField("badgeNewArrival", value)}
                />
                <Checkbox
                  checked={form.badgeBestSeller}
                  label="Best Seller"
                  onChange={(value) => updateField("badgeBestSeller", value)}
                />
                <Checkbox
                  checked={form.badgeTrending}
                  label="Trending"
                  onChange={(value) => updateField("badgeTrending", value)}
                />
                <Checkbox
                  checked={form.badgeLimitedEdition}
                  label="Limited Edition"
                  onChange={(value) => updateField("badgeLimitedEdition", value)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field
                  label="Units sold 30d"
                  onChange={(value) => updateField("unitsSold30d", value)}
                  value={form.unitsSold30d}
                />
                <Field
                  label="Views 7d"
                  onChange={(value) => updateField("views7d", value)}
                  value={form.views7d}
                />
                <Field
                  label="Sales 7d"
                  onChange={(value) => updateField("sales7d", value)}
                  value={form.sales7d}
                />
                <Field
                  label="Trending score"
                  onChange={(value) => updateField("trendingScore", value)}
                  value={form.trendingScore}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Merchandising Sets</h3>
              <Field
                label="Related product IDs"
                onChange={(value) => updateField("relatedProductIds", splitIds(value))}
                value={form.relatedProductIds.join(",")}
              />
              <Field
                label="Recommended product IDs"
                onChange={(value) => updateField("recommendedProductIds", splitIds(value))}
                value={form.recommendedProductIds.join(",")}
              />
              <Field
                label="Frequently bought together IDs"
                onChange={(value) => updateField("frequentlyBoughtTogetherIds", splitIds(value))}
                value={form.frequentlyBoughtTogetherIds.join(",")}
              />
              <Field
                label="Complete the look IDs"
                onChange={(value) => updateField("completeTheLookIds", splitIds(value))}
                value={form.completeTheLookIds.join(",")}
              />
            </div>
          </form>
        </div>
      </section>
    </ProtectedRoute>
  );
}

function Field({
  label,
  onChange,
  required,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function Textarea({
  label,
  onChange,
  required,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: Readonly<{ checked: boolean; label: string; onChange: (value: boolean) => void }>) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function splitIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
