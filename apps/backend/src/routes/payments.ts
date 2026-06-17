import express, { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { PaymentSession } from "../models/PaymentSession.js";
import { PaymentWebhookEvent } from "../models/PaymentWebhookEvent.js";
import {
  approveManualPayment,
  createCodPayment,
  createManualPayment,
  createRazorpayPayment,
  createUpiPayment,
  handleRazorpayWebhook,
  listPaymentHistory,
  rejectManualPayment,
  verifyRazorpayPayment,
} from "../services/paymentService.js";

export const paymentWebhookRouter = Router();
export const paymentsRouter = Router();

const paymentInputSchema = z
  .object({
    orderReference: z.string().min(3).max(80),
    amount: z.coerce.number().positive(),
    payableNow: z.coerce.number().positive().optional(),
    currencyCode: z.string().length(3).default("INR"),
    paymentMode: z.enum(["full", "advance", "balance"]).optional(),
  })
  .strict();

const manualPaymentSchema = paymentInputSchema
  .extend({
    manualScreenshot: z
      .object({
        url: z.string().url(),
        type: z.literal("image"),
        aspectRatio: z.string().optional(),
        altText: z.string().max(160).optional(),
      })
      .strict(),
  })
  .strict();

paymentWebhookRouter.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  rateLimit({ keyPrefix: "razorpay-webhook", windowMs: 60_000, max: 120 }),
  async (req, res, next) => {
    try {
      const result = await handleRazorpayWebhook(
        Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)),
        req.header("X-Razorpay-Signature"),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.use(requireAuth);

paymentsRouter.post(
  "/razorpay/orders",
  validateRequest({ body: paymentInputSchema }),
  async (req, res, next) => {
    try {
      const result = await createRazorpayPayment({ ...req.body, userId: req.user!.id });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/razorpay/confirm",
  validateRequest({
    body: z
      .object({
        razorpayOrderId: z.string().min(3),
        razorpayPaymentId: z.string().min(3),
        razorpaySignature: z.string().min(10),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      res.json({
        session: await verifyRazorpayPayment({ ...req.body, actorId: req.user!.id }),
      });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/cod",
  validateRequest({ body: paymentInputSchema }),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json({ session: await createCodPayment({ ...req.body, userId: req.user!.id }) });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/manual",
  validateRequest({ body: manualPaymentSchema }),
  async (req, res, next) => {
    try {
      res.status(201).json({
        session: await createManualPayment({ ...req.body, userId: req.user!.id }),
      });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/upi",
  validateRequest({
    body: paymentInputSchema.extend({ upiReference: z.string().max(120).optional() }).strict(),
  }),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json({ session: await createUpiPayment({ ...req.body, userId: req.user!.id }) });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.get("/history", async (req, res, next) => {
  try {
    const orderReference =
      typeof req.query.orderReference === "string" ? req.query.orderReference : undefined;
    res.json({ history: await listPaymentHistory(req.user!.id, orderReference) });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get(
  "/admin/verification-queue",
  requirePermission({ module: "payments", action: "manage" }),
  async (_req, res, next) => {
    try {
      const sessions = await PaymentSession.find({
        status: { $in: ["payment_verification_pending", "upi_pending"] },
      })
        .sort({ createdAt: 1 })
        .lean();
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.get(
  "/admin/webhook-events",
  requirePermission({ module: "payments", action: "manage" }),
  async (_req, res, next) => {
    try {
      const events = await PaymentWebhookEvent.find({}).sort({ createdAt: -1 }).limit(100).lean();
      res.json({ events });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/admin/:id/approve",
  requirePermission({ module: "payments", action: "manage" }),
  validateRequest({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).strict() }),
  async (req, res, next) => {
    try {
      res.json({
        session: await approveManualPayment({
          adminUserId: req.user!.id,
          ipAddress: req.ip,
          paymentSessionId: String(req.params.id),
          userAgent: req.header("User-Agent"),
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/admin/:id/reject",
  requirePermission({ module: "payments", action: "manage" }),
  validateRequest({
    body: z.object({ reason: z.string().min(3).max(500) }).strict(),
    params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).strict(),
  }),
  async (req, res, next) => {
    try {
      res.json({
        session: await rejectManualPayment({
          adminUserId: req.user!.id,
          ipAddress: req.ip,
          paymentSessionId: String(req.params.id),
          reason: req.body.reason,
          userAgent: req.header("User-Agent"),
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
