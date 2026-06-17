import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { PaymentSession } from "../models/PaymentSession.js";
import { Product } from "../models/Product.js";
import { createOrderFromCheckout, previewCheckout, type CheckoutInput } from "./checkoutService.js";

test("checkout preview calculates GST, shipping, gift packaging, and gift card precedence", async (t) => {
  const ctx = patchCheckoutModels();
  t.after(ctx.restore);

  const preview = await previewCheckout({
    shippingAddress: buildAddress(),
    shippingMethod: "standard",
    userId: ctx.userId,
  });

  assert.equal(preview.totals.itemSubtotal, 4000);
  assert.equal(preview.totals.giftPackagingFee, 99);
  assert.equal(preview.totals.shippingFee, 0);
  assert.equal(preview.totals.giftCardDiscount, 500);
  assert.equal(preview.totals.grandTotal, 3599);
  assert.equal(preview.taxBreakdown[0].gstRate, 5);
});

test("order creation maps all Phase 10 payment methods to correct initial order status", async (t) => {
  const ctx = patchCheckoutModels();
  t.after(ctx.restore);
  const cases: Array<[CheckoutInput["paymentMethod"], string]> = [
    ["razorpay", "pending_payment"],
    ["cod", "cod_confirmed"],
    ["manual_bank_transfer", "payment_verification_pending"],
    ["upi", "pending_payment"],
  ];

  for (const [paymentMethod, expectedStatus] of cases) {
    const result = await createOrderFromCheckout({
      manualScreenshot:
        paymentMethod === "manual_bank_transfer"
          ? {
              type: "image",
              url: "https://res.cloudinary.com/demo/image/authenticated/payment-proof.jpg",
            }
          : undefined,
      paymentMethod,
      shippingAddress: buildAddress(),
      shippingMethod: "express",
      upiReference: paymentMethod === "upi" ? "UTR-P11" : undefined,
      userId: ctx.userId,
    });

    assert.equal(result.order.status, expectedStatus);
    assert.equal(result.order.stockReservations[0].status, "reserved");
    assert.equal(result.order.totals.shippingFee, 199);
    assert.equal(result.paymentSession.orderReference, result.order.orderNumber);
  }

  assert.equal(ctx.orders.length, 4);
  assert.equal(ctx.paymentSessions.length, 4);
});

function patchCheckoutModels() {
  const userId = String(new Types.ObjectId());
  const productId = new Types.ObjectId();
  const variantId = new Types.ObjectId();
  const originalCartFindOne = Cart.findOne;
  const originalProductFindOne = Product.findOne;
  const originalOrderCreate = Order.create;
  const originalPaymentCreate = PaymentSession.create;
  const originalHistoryCreate = PaymentHistory.create;
  const orders: InstanceType<typeof Order>[] = [];
  const paymentSessions: InstanceType<typeof PaymentSession>[] = [];
  (Cart as unknown as { findOne: unknown }).findOne = () =>
    Promise.resolve(buildCart(userId, productId, variantId));
  (Product as unknown as { findOne: unknown }).findOne = () =>
    chain({
      _id: productId,
      gstRate: 5,
      hsnCode: "6204",
      variants: [{ _id: variantId, active: true, stockPlaceholder: 8 }],
    });
  (Order as unknown as { create: unknown }).create = (payload: Record<string, unknown>) => {
    const order = new Order(payload);
    orders.push(order);
    return Promise.resolve(order);
  };
  (PaymentSession as unknown as { create: unknown }).create = (
    payload: Record<string, unknown>,
  ) => {
    const session = new PaymentSession(payload);
    session.save = async () => session;
    paymentSessions.push(session);
    return Promise.resolve(session);
  };
  (PaymentHistory as unknown as { create: unknown }).create = (payload: unknown) =>
    Promise.resolve(payload);

  return {
    orders,
    paymentSessions,
    userId,
    restore() {
      (Cart as unknown as { findOne: unknown }).findOne = originalCartFindOne;
      (Product as unknown as { findOne: unknown }).findOne = originalProductFindOne;
      (Order as unknown as { create: unknown }).create = originalOrderCreate;
      (PaymentSession as unknown as { create: unknown }).create = originalPaymentCreate;
      (PaymentHistory as unknown as { create: unknown }).create = originalHistoryCreate;
    },
  };
}

function buildCart(userId: string, productId: Types.ObjectId, variantId: Types.ObjectId) {
  const cart = new Cart({
    giftCardRedemptions: [{ amount: 500, code: "GIFT500", currencyCode: "INR" }],
    giftPackaging: { enabled: true, fee: 99 },
    items: [
      {
        currencyCode: "INR",
        productId,
        productName: "Silk Kurti",
        quantity: 2,
        sku: "TVH-SILK-M-0001",
        slug: "silk-kurti",
        stockSnapshot: 8,
        unitPrice: 2000,
        variantId,
      },
    ],
    userId,
  });
  cart.save = async () => cart;

  return cart;
}

function chain<T>(value: T) {
  return {
    lean() {
      return Promise.resolve(value);
    },
  };
}

function buildAddress() {
  return {
    city: "Jaipur",
    countryCode: "IN",
    fullName: "Ananya Sharma",
    line1: "Bapu Bazaar",
    phone: "9999999999",
    postalCode: "302001",
    region: "RJ",
  };
}
