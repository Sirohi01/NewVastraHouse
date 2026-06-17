import type { NextFunction, Request, Response } from "express";
import type { Model } from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireAuth, requirePermission } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { Category } from "../models/Category.js";
import { Collection } from "../models/Collection.js";
import { Product } from "../models/Product.js";
import { ProductReview } from "../models/ProductReview.js";
import { Tag } from "../models/Tag.js";
import { createSlug } from "../services/slugService.js";
import { generateSku } from "../services/skuService.js";
import { computeBadges, recomputeProductBadges } from "../services/merchandisingBadgeService.js";
import { validateGstRate } from "../services/taxValidationService.js";
import { buildPaginatedResult, parsePagination } from "../utils/pagination.js";
import { buildQuery } from "../utils/queryBuilder.js";

export const catalogRouter = Router();

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const idParamsSchema = z.object({ id: objectIdSchema }).strict();
const gstRateSchema = z.coerce.number().refine(validateGstRate, "GST rate is not supported");

const mediaReferenceSchema = z
  .object({
    mediaId: objectIdSchema.optional(),
    url: z.string().url(),
    altText: z.string().max(160).optional(),
    type: z.enum(["image", "video", "pdf", "lookbook"]),
    aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9", "21:9", "3:2", "2:3", "custom"]).optional(),
    objectFit: z.enum(["cover", "contain"]).optional(),
  })
  .strict();

const seoSchema = z
  .object({
    title: z.string().max(70).optional(),
    description: z.string().max(180).optional(),
    canonicalUrl: z.string().url().optional(),
    ogImage: mediaReferenceSchema.optional(),
  })
  .strict()
  .optional();

const variantInputSchema = z
  .object({
    color: z.string().max(60).optional(),
    size: z.string().max(40).optional(),
    sku: z.string().max(80).optional(),
    barcode: z.string().max(80).optional(),
    basePrice: z.coerce.number().min(0),
    salePrice: z.coerce.number().min(0).optional(),
    currencyCode: z.string().length(3).default("INR"),
    stockPlaceholder: z.coerce.number().int().min(0).default(0),
    priceTiers: z
      .array(
        z
          .object({
            priceListCode: z.string().min(1).max(40),
            price: z.coerce.number().min(0),
            currencyCode: z.string().length(3).default("INR"),
          })
          .strict(),
      )
      .default([]),
    media: z.array(mediaReferenceSchema).default([]),
    active: z.boolean().default(true),
  })
  .strict();

const productInputSchema = z
  .object({
    brandId: objectIdSchema,
    name: z.string().min(1).max(180),
    slug: z.string().max(220).optional(),
    description: z.string().min(1),
    shortDescription: z.string().max(300).optional(),
    highlights: z.array(z.string().min(1).max(160)).default([]),
    fabricDetails: z.string().optional(),
    washCare: z.string().optional(),
    sizeGuide: z.string().optional(),
    hsnCode: z.string().regex(/^\d{4,8}$/),
    gstRate: gstRateSchema,
    categoryIds: z.array(objectIdSchema).default([]),
    collectionIds: z.array(objectIdSchema).default([]),
    tagIds: z.array(objectIdSchema).default([]),
    media: z.array(mediaReferenceSchema).default([]),
    variants: z.array(variantInputSchema).min(1),
    seo: seoSchema,
    badgeOverrides: z
      .object({
        newArrival: z.boolean().optional(),
        bestSeller: z.boolean().optional(),
        trending: z.boolean().optional(),
        limitedEdition: z.boolean().optional(),
      })
      .strict()
      .optional(),
    merchandisingMetrics: z
      .object({
        unitsSold30d: z.coerce.number().int().min(0).default(0),
        views7d: z.coerce.number().int().min(0).default(0),
        sales7d: z.coerce.number().int().min(0).default(0),
        trendingScore: z.coerce.number().int().min(0).default(0),
      })
      .strict()
      .optional(),
    relatedProductIds: z.array(objectIdSchema).default([]),
    recommendedProductIds: z.array(objectIdSchema).default([]),
    frequentlyBoughtTogetherIds: z.array(objectIdSchema).default([]),
    completeTheLookIds: z.array(objectIdSchema).default([]),
    active: z.boolean().default(true),
  })
  .strict();

const taxonomyInputSchema = z
  .object({
    name: z.string().min(1).max(140),
    slug: z.string().max(180).optional(),
    description: z.string().optional(),
    active: z.boolean().default(true),
    seo: seoSchema,
  })
  .strict();

const collectionInputSchema = taxonomyInputSchema.extend({ brandId: objectIdSchema });

const tagInputSchema = z
  .object({
    name: z.string().min(1).max(80),
    slug: z.string().max(120).optional(),
    active: z.boolean().default(true),
  })
  .strict();

const reviewInputSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    body: z.string().min(10).max(2000),
    guestName: z.string().max(100).optional(),
    guestEmail: z.string().email().optional(),
    photos: z.array(mediaReferenceSchema).max(5).default([]),
  })
  .strict();

type CatalogModel = Model<Record<string, unknown>>;
type TaxonomySchema = z.AnyZodObject;
type ProductMerchandisingPayload = {
  computedBadges?: Record<string, boolean>;
  relatedProductIds?: unknown[];
  recommendedProductIds?: unknown[];
  frequentlyBoughtTogetherIds?: unknown[];
  completeTheLookIds?: unknown[];
};
type ProductSlugPayload = { slug?: string };
type ProductIdPayload = { _id: unknown };

catalogRouter.get("/products", listPublicProducts);
catalogRouter.get("/products/:slug/pdp", getProductPdp);
catalogRouter.get("/products/:slug/reviews", listProductReviews);
catalogRouter.post(
  "/products/:slug/reviews",
  rateLimit({ windowMs: 60_000, max: 5, keyPrefix: "review-submit" }),
  validateRequest({ body: reviewInputSchema }),
  submitProductReview,
);
catalogRouter.get("/products/:slug", getProductBySlug);
catalogRouter.get("/categories/:slug", getCategoryBySlug);
catalogRouter.get("/collections/:slug", getCollectionBySlug);
catalogRouter.get(
  "/admin/products",
  requireAuth,
  requirePermission({ module: "catalog", action: "manage" }),
  listProducts,
);
catalogRouter.post(
  "/admin/products",
  requireAuth,
  requirePermission({ module: "catalog", action: "manage" }),
  validateRequest({ body: productInputSchema }),
  createProduct,
);
catalogRouter.patch(
  "/admin/products/:id",
  requireAuth,
  requirePermission({ module: "catalog", action: "manage" }),
  validateRequest({ params: idParamsSchema, body: productInputSchema.partial() }),
  updateProduct,
);
catalogRouter.delete(
  "/admin/products/:id",
  requireAuth,
  requirePermission({ module: "catalog", action: "manage" }),
  validateRequest({ params: idParamsSchema }),
  deleteProduct,
);
catalogRouter.post(
  "/admin/products/recompute-badges",
  requireAuth,
  requirePermission({ module: "catalog", action: "manage" }),
  recomputeBadges,
);

registerTaxonomyRoutes("categories", Category as CatalogModel, taxonomyInputSchema);
registerTaxonomyRoutes("collections", Collection as CatalogModel, collectionInputSchema);
registerTaxonomyRoutes("tags", Tag as CatalogModel, tagInputSchema);

async function listProducts(req: Request, res: Response, next: NextFunction) {
  return listProductsWithVisibility(req, res, next, { publicOnly: false });
}

async function listPublicProducts(req: Request, res: Response, next: NextFunction) {
  return listProductsWithVisibility(req, res, next, { publicOnly: true });
}

async function listProductsWithVisibility(
  req: Request,
  res: Response,
  next: NextFunction,
  options: { publicOnly: boolean },
) {
  try {
    const pagination = parsePagination(req.query);
    const query = buildQuery(
      {
        filter: normalizeProductFilters(req.query),
        sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
      },
      {
        filters: {
          brandId: { field: "brandId", operators: ["eq"] },
          categoryId: { field: "categoryIds", operators: ["eq"] },
          collectionId: { field: "collectionIds", operators: ["eq"] },
          tagId: { field: "tagIds", operators: ["eq"] },
          active: { field: "active", operators: ["eq"] },
          search: { field: "name", operators: ["regex"] },
          size: { field: "variants.size", operators: ["eq"] },
          color: { field: "variants.color", operators: ["eq"] },
          fabric: { field: "fabricDetails", operators: ["regex"] },
          price: { field: "variants.basePrice", operators: ["gte", "lte"] },
        },
        sorts: {
          newest: { field: "createdAt" },
          name: { field: "name" },
          price: { field: "variants.basePrice" },
          bestSelling: { field: "merchandisingMetrics.unitsSold30d" },
        },
      },
    );
    const filter = {
      ...query.filter,
      ...(options.publicOnly ? { active: true } : {}),
      status: { $ne: "deleted" },
    };
    const [products, total] = await Promise.all([
      Product.find(filter).sort(query.sort).skip(pagination.skip).limit(pagination.limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.json(buildPaginatedResult(products, total, pagination));
  } catch (error) {
    next(error);
  }
}

async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    })
      .populate("categoryIds", "name slug")
      .populate("collectionIds", "name slug")
      .populate("tagIds", "name slug")
      .lean();

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function getProductPdp(req: Request, res: Response, next: NextFunction) {
  try {
    const product = (await Product.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    })
      .populate("categoryIds", "name slug")
      .populate("collectionIds", "name slug")
      .populate("tagIds", "name slug")
      .lean()) as ProductMerchandisingPayload | null;

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const [relatedProducts, recommendedProducts, frequentlyBoughtTogether, completeTheLook] =
      await Promise.all([
        findCuratedProducts(product.relatedProductIds),
        findCuratedProducts(product.recommendedProductIds),
        findCuratedProducts(product.frequentlyBoughtTogetherIds),
        findCuratedProducts(product.completeTheLookIds),
      ]);

    res.json({
      product,
      badges: product.computedBadges,
      merchandising: {
        relatedProducts,
        recommendedProducts,
        frequentlyBoughtTogether,
        completeTheLook,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function listProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = parsePagination(req.query);
    const product = (await Product.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    })
      .select("_id")
      .lean()) as ProductIdPayload | null;

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const filter = {
      productId: product._id,
      moderationStatus: "approved",
      status: { $ne: "deleted" },
    };
    const [reviews, total] = await Promise.all([
      ProductReview.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ProductReview.countDocuments(filter),
    ]);

    res.json(buildPaginatedResult(reviews, total, pagination));
  } catch (error) {
    next(error);
  }
}

async function submitProductReview(req: Request, res: Response, next: NextFunction) {
  try {
    const product = (await Product.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    })
      .select("_id")
      .lean()) as ProductIdPayload | null;

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const review = await ProductReview.create({
      ...req.body,
      productId: product._id,
      userId: req.user?.id,
      moderationStatus: "pending",
      verifiedPurchase: false,
    });

    res.status(201).json({ review, moderationStatus: "pending" });
  } catch (error) {
    next(error);
  }
}

async function getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    }).lean();

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
}

async function getCollectionBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const collection = await Collection.findOne({
      slug: req.params.slug,
      active: true,
      status: { $ne: "deleted" },
    }).lean();

    if (!collection) {
      throw new AppError("Collection not found", 404);
    }

    res.json({ collection });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = createSlug(req.body.slug ?? req.body.name);
    const variants = req.body.variants.map(
      (variant: z.infer<typeof variantInputSchema>, index: number) => ({
        ...variant,
        sku:
          variant.sku ??
          generateSku({
            productSlug: slug,
            color: variant.color,
            size: variant.size,
            sequence: index + 1,
          }),
      }),
    );
    const product = await Product.create({ ...req.body, slug, variants });
    product.computedBadges = computeBadges(product);
    await product.save();

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const update = { ...req.body };

    if (update.slug || update.name) {
      update.slug = createSlug(update.slug ?? update.name);
    }

    if (update.variants) {
      const existingProduct = (await Product.findById(req.params.id)
        .select("slug")
        .lean()) as ProductSlugPayload | null;
      const productSlug = update.slug ?? existingProduct?.slug ?? "product";

      update.variants = update.variants.map(
        (variant: z.infer<typeof variantInputSchema>, index: number) => ({
          ...variant,
          sku:
            variant.sku ??
            generateSku({
              productSlug,
              color: variant.color,
              size: variant.size,
              sequence: index + 1,
            }),
        }),
      );
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    product.computedBadges = computeBadges(product);
    await product.save();

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "deleted", deletedAt: new Date() } },
      { new: true },
    );

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

async function recomputeBadges(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await recomputeProductBadges();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findCuratedProducts(productIds: unknown) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  return Product.find({ _id: { $in: productIds }, status: { $ne: "deleted" }, active: true })
    .select("name slug media variants computedBadges")
    .lean();
}

function registerTaxonomyRoutes(path: string, model: CatalogModel, schema: TaxonomySchema) {
  catalogRouter.get(
    `/admin/${path}`,
    requireAuth,
    requirePermission({ module: "catalog", action: "manage" }),
    async (req, res, next) => {
      try {
        const pagination = parsePagination(req.query);
        const query = buildQuery(
          {
            filter: normalizeTaxonomyFilters(req.query),
            sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
          },
          {
            filters: {
              active: { field: "active", operators: ["eq"] },
              search: { field: "name", operators: ["regex"] },
              brandId: { field: "brandId", operators: ["eq"] },
            },
            sorts: {
              newest: { field: "createdAt" },
              name: { field: "name" },
            },
          },
        );
        const filter = { ...query.filter, status: { $ne: "deleted" } };
        const [items, total] = await Promise.all([
          model.find(filter).sort(query.sort).skip(pagination.skip).limit(pagination.limit).lean(),
          model.countDocuments(filter),
        ]);

        res.json(buildPaginatedResult(items, total, pagination));
      } catch (error) {
        next(error);
      }
    },
  );

  catalogRouter.post(
    `/admin/${path}`,
    requireAuth,
    requirePermission({ module: "catalog", action: "manage" }),
    validateRequest({ body: schema }),
    async (req, res, next) => {
      try {
        const item = await model.create({
          ...req.body,
          slug: createSlug(req.body.slug ?? req.body.name),
        });
        res.status(201).json({ item });
      } catch (error) {
        next(error);
      }
    },
  );

  catalogRouter.patch(
    `/admin/${path}/:id`,
    requireAuth,
    requirePermission({ module: "catalog", action: "manage" }),
    validateRequest({ params: idParamsSchema, body: schema.partial() }),
    async (req, res, next) => {
      try {
        const update = { ...req.body };

        if (update.slug || update.name) {
          update.slug = createSlug(update.slug ?? update.name);
        }

        const item = await model.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

        if (!item) {
          throw new AppError("Catalog item not found", 404);
        }

        res.json({ item });
      } catch (error) {
        next(error);
      }
    },
  );

  catalogRouter.delete(
    `/admin/${path}/:id`,
    requireAuth,
    requirePermission({ module: "catalog", action: "manage" }),
    validateRequest({ params: idParamsSchema }),
    async (req, res, next) => {
      try {
        const item = await model.findByIdAndUpdate(
          req.params.id,
          { $set: { status: "deleted", deletedAt: new Date() } },
          { new: true },
        );

        if (!item) {
          throw new AppError("Catalog item not found", 404);
        }

        res.json({ deleted: true });
      } catch (error) {
        next(error);
      }
    },
  );
}

function normalizeProductFilters(query: Record<string, unknown>): Record<string, unknown> {
  const filter = pickStringFilters(query, [
    "brandId",
    "categoryId",
    "collectionId",
    "tagId",
    "active",
    "search",
    "size",
    "color",
  ]);

  if (typeof query.fabric === "string" && query.fabric.length > 0) {
    filter["fabric.regex"] = query.fabric;
  }

  if (typeof query.minPrice === "string" && query.minPrice.length > 0) {
    filter["price.gte"] = query.minPrice;
  }

  if (typeof query.maxPrice === "string" && query.maxPrice.length > 0) {
    filter["price.lte"] = query.maxPrice;
  }

  return filter;
}

function normalizeTaxonomyFilters(query: Record<string, unknown>): Record<string, unknown> {
  return pickStringFilters(query, ["brandId", "active", "search"]);
}

function pickStringFilters(
  query: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  for (const key of keys) {
    const value = query[key];

    if (typeof value === "string" && value.length > 0) {
      filter[key] = key === "active" ? value === "true" : value;
    }
  }

  return filter;
}
