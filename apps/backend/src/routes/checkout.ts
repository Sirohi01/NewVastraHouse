import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { Order } from "../models/Order.js";
import { createOrderFromCheckout, previewCheckout } from "../services/checkoutService.js";

export const checkoutRouter = Router();

const addressSchema = z
  .object({
    fullName: z.string().max(120).optional(),
    company: z.string().max(120).optional(),
    line1: z.string().min(1).max(180),
    line2: z.string().max(180).optional(),
    city: z.string().min(1).max(100),
    region: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    countryCode: z.string().length(2),
    phone: z.string().max(30).optional(),
  })
  .strict();

const checkoutSchema = z
  .object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    shippingMethod: z.enum(["standard", "express"]),
    paymentMethod: z.enum(["razorpay", "cod", "manual_bank_transfer", "upi"]),
    paymentMode: z.enum(["full", "advance", "balance"]).optional(),
    payableNow: z.coerce.number().positive().optional(),
    couponCode: z.string().max(80).optional(),
    storeCreditRequested: z.coerce.number().nonnegative().optional(),
    rewardValueRequested: z.coerce.number().nonnegative().optional(),
    manualScreenshot: z
      .object({
        url: z.string().url(),
        type: z.literal("image"),
        aspectRatio: z.string().optional(),
        altText: z.string().max(160).optional(),
      })
      .strict()
      .optional(),
    upiReference: z.string().max(120).optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

checkoutRouter.use(requireAuth);

checkoutRouter.post(
  "/preview",
  validateRequest({
    body: checkoutSchema.omit({ paymentMethod: true, manualScreenshot: true, upiReference: true }),
  }),
  async (req, res, next) => {
    try {
      res.json({ checkout: await previewCheckout({ ...req.body, userId: req.user!.id }) });
    } catch (error) {
      next(error);
    }
  },
);

checkoutRouter.post(
  "/orders",
  validateRequest({ body: checkoutSchema }),
  async (req, res, next) => {
    try {
      const result = await createOrderFromCheckout({ ...req.body, userId: req.user!.id });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

checkoutRouter.get("/orders/:orderNumber", async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
      userId: req.user!.id,
    }).lean();

    if (!order) {
      res.status(404).json({ error: { message: "Order not found" } });
      return;
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});
