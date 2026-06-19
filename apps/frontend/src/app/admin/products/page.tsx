"use client";

import { Edit3, ImagePlus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { EmptyState } from "@/components/states/EmptyState";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiBaseUrl, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type MediaReference = {
  url: string;
  altText: string;
  type: "image" | "video" | "pdf" | "lookbook";
  aspectRatio: string;
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
  costPrice: string;
  stockPlaceholder: string;
  preOrderEnabled: boolean;
  preOrderStartAt: string;
  preOrderEndAt: string;
  expectedDispatchAt: string;
  expectedDeliveryAt: string;
  preOrderPaymentMode: "full" | "advance";
  preOrderAdvancePercent: string;
  preOrderQuantityCap: string;
  preOrderRemainingQuantity: string;
  preOrder?: {
    advancePercent?: number;
    enabled?: boolean;
    endAt?: string;
    expectedDeliveryAt?: string;
    expectedDispatchAt?: string;
    paymentMode?: "full" | "advance";
    quantityCap?: number;
    remainingQuantity?: number;
    startAt?: string;
  };
};

type LookupItem = { _id: string; name: string; slug?: string };

type Product = {
  _id: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  highlights?: string[];
  fabricDetails?: string;
  washCare?: string;
  sizeGuide?: string;
  sizeGuideMedia?: MediaReference;
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
  highlightsText: string;
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

const formTabs = [
  { label: "Basics", value: "basics" },
  { label: "Variants", value: "variants" },
  { label: "Media", value: "media" },
  { label: "SEO", value: "seo" },
  { label: "Merchandising", value: "merchandising" },
] as const;

type FormTab = (typeof formTabs)[number]["value"];

const blankVariant: VariantForm = {
  color: "",
  size: "",
  sku: "",
  barcode: "",
  basePrice: "",
  salePrice: "",
  costPrice: "0",
  stockPlaceholder: "0",
  expectedDeliveryAt: "",
  expectedDispatchAt: "",
  preOrderAdvancePercent: "50",
  preOrderEnabled: false,
  preOrderEndAt: "",
  preOrderPaymentMode: "full",
  preOrderQuantityCap: "0",
  preOrderRemainingQuantity: "0",
  preOrderStartAt: "",
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
  sizeGuideMedia: undefined,
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
  highlightsText: "",
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
  const toast = useToast();
  const productMediaFilesRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lookups, setLookups] = useState<{
    brands: LookupItem[];
    categories: LookupItem[];
    collections: LookupItem[];
    tags: LookupItem[];
  }>({ brands: [], categories: [], collections: [], tags: [] });
  const [form, setForm] = useState<ProductForm>(blankForm);
  const [formTab, setFormTab] = useState<FormTab>("basics");
  const [editingId, setEditingId] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingProductMedia, setUploadingProductMedia] = useState(false);
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadAspectRatio, setUploadAspectRatio] = useState("1:1");
  const [uploadObjectFit, setUploadObjectFit] = useState<"cover" | "contain">("cover");
  const [deleteTarget, setDeleteTarget] = useState<Product>();

  const selectedMediaUrls = useMemo(
    () => new Set(form.media.map((item) => item.url)),
    [form.media],
  );

  async function loadProducts() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ sort: "-newest" });

      if (search) {
        query.set("search", search);
      }

      const payload = await apiFetch<{ data: Product[] }>(
        `/catalog/admin/products?${query.toString()}`,
        { accessToken },
      );
      setProducts(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }

  async function loadMedia() {
    try {
      const payload = await apiFetch<{ media: MediaItem[] }>("/media", { accessToken });
      setMedia(payload.media);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load media"));
    }
  }

  async function loadLookups() {
    try {
      const payload = await apiFetch<typeof lookups & { warehouses: LookupItem[] }>(
        "/catalog/admin/lookups",
        { accessToken },
      );
      setLookups(payload);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load lookups"));
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadProducts();
      void loadMedia();
      void loadLookups();
    }
  }, [accessToken]);

  function updateField(
    field: keyof ProductForm,
    value:
      | string
      | boolean
      | string[]
      | MediaReference
      | MediaReference[]
      | VariantForm[]
      | undefined,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateVariant(index: number, field: keyof VariantForm, value: string | boolean) {
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
        altText: item.altText ?? form.name ?? "Product media",
        type: item.resourceType === "video" ? "video" : "image",
        aspectRatio: item.selectedAspectRatio,
        objectFit: "cover",
      },
    ]);
  }

  function addSizeGuideMedia(item: MediaItem) {
    updateField("sizeGuideMedia", {
      mediaId: item._id,
      url: item.secureUrl,
      altText: item.altText ?? `${form.name || "Product"} size guide`,
      type: item.resourceType === "video" ? "video" : "image",
      aspectRatio: item.selectedAspectRatio,
      objectFit: "contain",
    });
  }

  function updateMediaAlt(index: number, altText: string) {
    updateField(
      "media",
      form.media.map((item, mediaIndex) => (mediaIndex === index ? { ...item, altText } : item)),
    );
  }

  function removeMedia(index: number) {
    updateField(
      "media",
      form.media.filter((_, mediaIndex) => mediaIndex !== index),
    );
  }

  async function uploadAndAttachProductMedia() {
    const files = Array.from(productMediaFilesRef.current?.files ?? []);

    if (!files.length) {
      toast.error("Select at least one file");
      return;
    }

    setUploadingProductMedia(true);
    try {
      const uploadedMedia: MediaReference[] = [];
      const altText = uploadAltText || form.name || "Product media";

      for (const [index, file] of files.entries()) {
        const payload = new FormData();
        payload.set("file", file);
        payload.set("aspectRatio", uploadAspectRatio);
        payload.set("context", "product-media");
        payload.set("objectFit", uploadObjectFit);
        payload.set("altText", files.length > 1 ? `${altText} ${index + 1}` : altText);
        payload.set("tags", `product,${form.slug || form.name || "catalog"}`);

        const response = await fetch(`${apiBaseUrl}/media/upload`, {
          body: payload,
          headers: { Authorization: `Bearer ${accessToken}` },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error((await response.text()) || `Upload failed for ${file.name}`);
        }

        const result = (await response.json()) as { media: MediaItem };
        uploadedMedia.push(
          toMediaReference(result.media, form.name || "Product media", uploadObjectFit),
        );
      }

      updateField("media", [...form.media, ...uploadedMedia]);
      toast.success(
        `${uploadedMedia.length} media file${uploadedMedia.length > 1 ? "s" : ""} attached`,
      );
      if (productMediaFilesRef.current) {
        productMediaFilesRef.current.value = "";
      }
      await loadMedia();
    } catch (error) {
      toast.error(errorMessage(error, "Upload failed"));
    } finally {
      setUploadingProductMedia(false);
    }
  }

  function openCreateProduct() {
    setEditingId(undefined);
    setForm(blankForm);
    setFormTab("basics");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(undefined);
    setForm(blankForm);
    setFormTab("basics");
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
            costPrice: String(variant.costPrice ?? 0),
            stockPlaceholder: String(variant.stockPlaceholder ?? 0),
            expectedDeliveryAt: toDateInput(variant.preOrder?.expectedDeliveryAt),
            expectedDispatchAt: toDateInput(variant.preOrder?.expectedDispatchAt),
            preOrderAdvancePercent: String(variant.preOrder?.advancePercent ?? 50),
            preOrderEnabled: variant.preOrder?.enabled ?? false,
            preOrderEndAt: toDateInput(variant.preOrder?.endAt),
            preOrderPaymentMode: variant.preOrder?.paymentMode ?? "full",
            preOrderQuantityCap: String(variant.preOrder?.quantityCap ?? 0),
            preOrderRemainingQuantity: String(variant.preOrder?.remainingQuantity ?? 0),
            preOrderStartAt: toDateInput(variant.preOrder?.startAt),
          }))
        : [blankVariant],
      seoTitle: product.seo?.title ?? "",
      seoDescription: product.seo?.description ?? "",
      seoCanonicalUrl: product.seo?.canonicalUrl ?? "",
      highlightsText: product.highlights?.join("\n") ?? "",
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
    setFormTab("basics");
    setEditorOpen(true);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      brandId: form.brandId,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      shortDescription: form.shortDescription || undefined,
      highlights: form.highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      fabricDetails: form.fabricDetails || undefined,
      washCare: form.washCare || undefined,
      sizeGuide: form.sizeGuide || undefined,
      sizeGuideMedia: form.sizeGuideMedia,
      hsnCode: form.hsnCode,
      gstRate: Number(form.gstRate),
      media: form.media,
      active: form.active,
      categoryIds: form.categoryIds.filter(Boolean),
      collectionIds: form.collectionIds.filter(Boolean),
      tagIds: form.tagIds.filter(Boolean),
      variants: form.variants.map((variant) => ({
        active: true,
        barcode: variant.barcode || undefined,
        basePrice: Number(variant.basePrice),
        costPrice: Number(variant.costPrice || 0),
        color: variant.color || undefined,
        currencyCode: "INR",
        preOrder: {
          advancePercent: Number(variant.preOrderAdvancePercent || 50),
          enabled: variant.preOrderEnabled,
          endAt: dateOrUndefined(variant.preOrderEndAt),
          expectedDeliveryAt: dateOrUndefined(variant.expectedDeliveryAt),
          expectedDispatchAt: dateOrUndefined(variant.expectedDispatchAt),
          paymentMode: variant.preOrderPaymentMode,
          quantityCap: Number(variant.preOrderQuantityCap || 0),
          remainingQuantity: Number(
            variant.preOrderRemainingQuantity || variant.preOrderQuantityCap || 0,
          ),
          startAt: dateOrUndefined(variant.preOrderStartAt),
        },
        salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
        size: variant.size || undefined,
        sku: variant.sku || undefined,
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

    try {
      await apiFetch(path, { accessToken, method, body: JSON.stringify(payload) });
      closeEditor();
      toast.success("Product saved");
      await loadProducts();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save product"));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await apiFetch(`/catalog/admin/products/${deleteTarget._id}`, {
        accessToken,
        method: "DELETE",
      });
      toast.success("Product deleted");
      setDeleteTarget(undefined);
      await loadProducts();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete product"));
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-7xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">Manage catalog products.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
              onClick={() => void loadProducts()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={openCreateProduct}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Create Product
            </button>
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            className="h-9 min-w-0 flex-1 rounded-md border border-border px-2.5 text-sm"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void loadProducts()}
            placeholder="Search products"
            value={search}
          />
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold"
            onClick={() => void loadProducts()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} />
            Search
          </button>
        </div>

        {products.length ? (
          <DataTable
            columns={[
              {
                header: "Product",
                render: (product) => (
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-muted-foreground">{product.slug}</div>
                  </div>
                ),
              },
              { header: "GST", render: (product) => `${product.gstRate}%` },
              { header: "Variants", render: (product) => product.variants?.length ?? 0 },
              {
                align: "right",
                header: "Actions",
                render: (product) => (
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                      onClick={() => editProduct(product)}
                      title="Edit product"
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={14} />
                    </button>
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border text-destructive"
                      onClick={() => setDeleteTarget(product)}
                      title="Delete product"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            emptyMessage={loading ? "Loading..." : "No products yet."}
            getRowKey={(product) => product._id}
            rows={products}
          />
        ) : (
          <EmptyState
            title="No products"
            message={loading ? "Loading..." : "Create the first catalog product."}
          />
        )}

        <Modal
          onClose={closeEditor}
          open={editorOpen}
          size="xl"
          title={editingId ? "Edit product" : "Create product"}
        >
          <form id="product-form" onSubmit={saveProduct}>
            <Tabs active={formTab} items={formTabs} onChange={setFormTab} />

            <div className="mt-3">
              <div className={formTab === "basics" ? "space-y-3" : "hidden"}>
                <Select
                  label="Brand"
                  onChange={(value) => updateField("brandId", value)}
                  options={[
                    { label: "Select brand", value: "" },
                    ...lookups.brands.map((brand) => ({ label: brand.name, value: brand._id })),
                  ]}
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
                <Textarea
                  label="Highlights (one per line)"
                  onChange={(value) => updateField("highlightsText", value)}
                  value={form.highlightsText}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field
                    label="Fabric details"
                    onChange={(value) => updateField("fabricDetails", value)}
                    value={form.fabricDetails ?? ""}
                  />
                  <Field
                    label="Wash care instructions"
                    onChange={(value) => updateField("washCare", value)}
                    value={form.washCare ?? ""}
                  />
                  <Field
                    label="Size guide text"
                    onChange={(value) => updateField("sizeGuide", value)}
                    value={form.sizeGuide ?? ""}
                  />
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
                <div className="rounded-md border border-border p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold">Size chart image</p>
                      <p className="text-xs text-muted-foreground">
                        Pick a dedicated measurement chart image for this product. It appears inside
                        the PDP Size Guide accordion.
                      </p>
                    </div>
                    {form.sizeGuideMedia ? (
                      <button
                        className="h-8 rounded-md border border-border px-2 text-xs font-semibold"
                        onClick={() => updateField("sizeGuideMedia", undefined)}
                        type="button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  {form.sizeGuideMedia ? (
                    <div className="mt-2 rounded-md border border-border p-2 text-xs text-muted-foreground">
                      {form.sizeGuideMedia.altText}
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <MediaPicker
                      media={media.filter((item) => item.resourceType === "image")}
                      onSelect={addSizeGuideMedia}
                    />
                  </div>
                </div>
                <LookupChecklist
                  label="Categories"
                  onChange={(value) => updateField("categoryIds", value)}
                  options={lookups.categories}
                  value={form.categoryIds}
                />
                <LookupChecklist
                  label="Collections"
                  onChange={(value) => updateField("collectionIds", value)}
                  options={lookups.collections}
                  value={form.collectionIds}
                />
                <LookupChecklist
                  label="Tags"
                  onChange={(value) => updateField("tagIds", value)}
                  options={lookups.tags}
                  value={form.tagIds}
                />
              </div>

              <div className={formTab === "variants" ? "space-y-3" : "hidden"}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Variants</h3>
                    <p className="text-xs text-muted-foreground">
                      SKU and barcode are auto-generated when left blank.
                    </p>
                  </div>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                    onClick={() => updateField("variants", [...form.variants, blankVariant])}
                    title="Add variant"
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} />
                  </button>
                </div>
                {form.variants.map((variant, index) => (
                  <div className="grid gap-2 rounded-md border border-border p-2.5" key={index}>
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
                        label="Cost price / piece"
                        onChange={(value) => updateVariant(index, "costPrice", value)}
                        type="number"
                        value={variant.costPrice}
                      />
                      <Field
                        label="Stock placeholder"
                        onChange={(value) => updateVariant(index, "stockPlaceholder", value)}
                        value={variant.stockPlaceholder}
                      />
                    </div>
                    <div className="rounded-md border border-border bg-background p-2.5">
                      <Checkbox
                        checked={variant.preOrderEnabled}
                        label="Enable pre-order"
                        onChange={(value) => updateVariant(index, "preOrderEnabled", value)}
                      />
                      {variant.preOrderEnabled ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <Field
                            label="Start date"
                            onChange={(value) => updateVariant(index, "preOrderStartAt", value)}
                            required
                            type="date"
                            value={variant.preOrderStartAt}
                          />
                          <Field
                            label="End date"
                            onChange={(value) => updateVariant(index, "preOrderEndAt", value)}
                            required
                            type="date"
                            value={variant.preOrderEndAt}
                          />
                          <Field
                            label="Expected dispatch"
                            onChange={(value) => updateVariant(index, "expectedDispatchAt", value)}
                            type="date"
                            value={variant.expectedDispatchAt}
                          />
                          <Field
                            label="Expected delivery"
                            onChange={(value) => updateVariant(index, "expectedDeliveryAt", value)}
                            type="date"
                            value={variant.expectedDeliveryAt}
                          />
                          <Select
                            label="Payment mode"
                            onChange={(value) => updateVariant(index, "preOrderPaymentMode", value)}
                            options={[
                              { label: "Full", value: "full" },
                              { label: "Advance", value: "advance" },
                            ]}
                            value={variant.preOrderPaymentMode}
                          />
                          <Field
                            label="Advance %"
                            onChange={(value) =>
                              updateVariant(index, "preOrderAdvancePercent", value)
                            }
                            type="number"
                            value={variant.preOrderAdvancePercent}
                          />
                          <Field
                            label="Quantity cap"
                            onChange={(value) => updateVariant(index, "preOrderQuantityCap", value)}
                            required
                            type="number"
                            value={variant.preOrderQuantityCap}
                          />
                          <Field
                            label="Remaining quantity"
                            onChange={(value) =>
                              updateVariant(index, "preOrderRemainingQuantity", value)
                            }
                            type="number"
                            value={variant.preOrderRemainingQuantity}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className={formTab === "media" ? "space-y-3" : "hidden"}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ImagePlus aria-hidden="true" size={16} />
                  Media
                </div>
                <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-2">
                  <label className="text-xs font-medium sm:col-span-2">
                    Upload images/videos directly
                    <input
                      accept="image/*,video/*"
                      className="mt-1 block w-full rounded-md border border-border p-1.5 text-sm"
                      multiple
                      name="files"
                      ref={productMediaFilesRef}
                      type="file"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    Aspect ratio
                    <select
                      className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                      onChange={(event) => setUploadAspectRatio(event.target.value)}
                      value={uploadAspectRatio}
                    >
                      {["1:1", "4:5", "9:16", "16:7", "16:9", "21:9", "3:2", "2:3"].map((ratio) => (
                        <option key={ratio} value={ratio}>
                          {ratio}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Object fit
                    <select
                      className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                      onChange={(event) =>
                        setUploadObjectFit(event.target.value as "cover" | "contain")
                      }
                      value={uploadObjectFit}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium sm:col-span-2">
                    Alt text base
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                      onChange={(event) => setUploadAltText(event.target.value)}
                      placeholder={form.name || "Product media"}
                      minLength={3}
                      value={uploadAltText}
                    />
                  </label>
                  <div className="flex justify-end sm:col-span-2">
                    <button
                      className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      disabled={uploadingProductMedia}
                      onClick={() => void uploadAndAttachProductMedia()}
                      type="button"
                    >
                      {uploadingProductMedia ? "Uploading..." : "Upload & attach"}
                    </button>
                  </div>
                </div>
                <MediaPicker media={media} onSelect={addMedia} />
                {form.media.length ? (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {form.media.map((item, index) => (
                      <div className="rounded-md border border-border p-2" key={item.url}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">
                              {index + 1}. {item.type} / {item.aspectRatio}
                            </p>
                            <p className="break-all">{item.url}</p>
                          </div>
                          <button
                            className="h-8 rounded-md border border-border px-2 font-semibold text-destructive"
                            onClick={() => removeMedia(index)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          className="mt-2 h-9 w-full rounded-md border border-border px-2"
                          onChange={(event) => updateMediaAlt(index, event.target.value)}
                          placeholder="Meaningful alt text"
                          value={item.altText}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={formTab === "seo" ? "space-y-3" : "hidden"}>
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
              </div>

              <div className={formTab === "merchandising" ? "space-y-3" : "hidden"}>
                <h3 className="text-sm font-semibold">Badges</h3>
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

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Merchandising Sets</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ProductMultiSelect
                      label="Related products"
                      onChange={(value) => updateField("relatedProductIds", value)}
                      options={products}
                      value={form.relatedProductIds}
                      currentProductId={editingId}
                    />
                    <ProductMultiSelect
                      label="Recommended products"
                      onChange={(value) => updateField("recommendedProductIds", value)}
                      options={products}
                      value={form.recommendedProductIds}
                      currentProductId={editingId}
                    />
                    <ProductMultiSelect
                      label="Frequently bought together"
                      onChange={(value) => updateField("frequentlyBoughtTogetherIds", value)}
                      options={products}
                      value={form.frequentlyBoughtTogetherIds}
                      currentProductId={editingId}
                    />
                    <ProductMultiSelect
                      label="Complete the look"
                      onChange={(value) => updateField("completeTheLookIds", value)}
                      options={products}
                      value={form.completeTheLookIds}
                      currentProductId={editingId}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
                onClick={closeEditor}
                type="button"
              >
                Cancel
              </button>
              <button className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                Save
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          confirmLabel="Delete"
          message={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={confirmDelete}
          open={!!deleteTarget}
          title="Delete product"
        />
      </section>
    </ProtectedRoute>
  );
}

function LookupChecklist({
  label,
  onChange,
  options,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string[]) => void;
  options: LookupItem[];
  value: string[];
}>) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <p className="text-xs font-semibold">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <Checkbox
            checked={value.includes(option._id)}
            key={option._id}
            label={option.name}
            onChange={(checked) =>
              onChange(
                checked ? [...value, option._id] : value.filter((item) => item !== option._id),
              )
            }
          />
        ))}
      </div>
      {!options.length ? (
        <p className="mt-2 text-xs text-muted-foreground">No options loaded.</p>
      ) : null}
    </div>
  );
}

function ProductMultiSelect({
  currentProductId,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  currentProductId?: string;
  label: string;
  onChange: (value: string[]) => void;
  options: Product[];
  value: string[];
}>) {
  const selectedProducts = options.filter((product) => value.includes(product._id));
  const availableProducts = options.filter(
    (product) => product._id !== currentProductId && !value.includes(product._id),
  );

  return (
    <div className="rounded-md border border-border p-2.5">
      <label className="block text-xs font-semibold">
        {label}
        <select
          className="mt-2 h-9 w-full rounded-md border border-border bg-card px-2.5 text-sm"
          onChange={(event) => {
            const nextId = event.target.value;
            if (nextId) {
              onChange([...value, nextId]);
            }
          }}
          value=""
        >
          <option value="">Add product</option>
          {availableProducts.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {selectedProducts.map((product) => (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
            key={product._id}
          >
            {product.name}
            <button
              className="font-semibold text-destructive"
              onClick={() => onChange(value.filter((item) => item !== product._id))}
              type="button"
            >
              x
            </button>
          </span>
        ))}
        {!selectedProducts.length ? (
          <span className="text-xs text-muted-foreground">No products selected.</span>
        ) : null}
      </div>
    </div>
  );
}

function toMediaReference(
  item: MediaItem,
  fallbackAlt: string,
  objectFit: "cover" | "contain" = "cover",
): MediaReference {
  return {
    altText: item.altText ?? fallbackAlt,
    aspectRatio: item.selectedAspectRatio,
    mediaId: item._id,
    objectFit,
    type: item.resourceType === "video" ? "video" : "image",
    url: item.secureUrl,
  };
}

function toDateInput(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function dateOrUndefined(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}
