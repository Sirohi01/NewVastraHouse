import { Router } from "express";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { LowStockAlert } from "../models/LowStockAlert.js";
import { Order } from "../models/Order.js";
import { PaymentSession } from "../models/PaymentSession.js";
import { Product } from "../models/Product.js";
import { ProductionTracker } from "../models/ProductionTracker.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { StockLedger } from "../models/StockLedger.js";

export const adminRouter = Router();

adminRouter.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    if (req.user?.type !== "admin") {
      throw new AppError("Permission denied", 403);
    }

    const [
      pendingOrders,
      paymentVerification,
      lowStockAlerts,
      returnsQueue,
      productCount,
      activePreOrders,
      stockSummary,
    ] = await Promise.all([
      Order.countDocuments({
        status: { $in: ["pending_payment", "payment_verification_pending", "confirmed"] },
      }),
      PaymentSession.countDocuments({
        status: { $in: ["payment_verification_pending", "upi_pending"] },
      }),
      LowStockAlert.countDocuments({ status: "open" }),
      ReturnRequest.countDocuments({ status: "requested" }),
      Product.countDocuments({ status: { $ne: "deleted" } }),
      ProductionTracker.countDocuments({
        stage: { $ne: "dispatch" },
      }),
      StockLedger.aggregate([
        {
          $group: {
            _id: null,
            available: { $sum: "$available" },
            damaged: { $sum: "$damaged" },
            incoming: { $sum: "$incoming" },
            reserved: { $sum: "$reserved" },
          },
        },
      ]),
    ]);

    res.json({
      summary: {
        activePreOrders,
        inventory: stockSummary[0] ?? { available: 0, damaged: 0, incoming: 0, reserved: 0 },
        lowStockAlerts,
        paymentVerification,
        pendingOrders,
        productCount,
        returnsQueue,
      },
    });
  } catch (error) {
    next(error);
  }
});
