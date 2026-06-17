import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { AuditLog } from "../models/AuditLog.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { PaymentSession } from "../models/PaymentSession.js";
import { PaymentWebhookEvent } from "../models/PaymentWebhookEvent.js";
import {
  approveManualPayment,
  createCodPayment,
  createManualPayment,
  createRazorpayPayment,
  createUpiPayment,
  handleRazorpayWebhook,
  rejectManualPayment,
  verifyRazorpayPayment,
} from "./paymentService.js";

test("Razorpay payment verification confirms partial capture and tracks outstanding balance", async (t) => {
  setRazorpaySecrets();
  const originals = patchHistoryOnly();
  let session: InstanceType<typeof PaymentSession> | undefined;

  const originalCreate = PaymentSession.create;
  const originalFindOne = PaymentSession.findOne;
  (PaymentSession as unknown as { create: unknown }).create = (
    payload: Record<string, unknown>,
  ) => {
    session = makeSession(payload);
    return Promise.resolve(session);
  };
  (PaymentSession as unknown as { findOne: unknown }).findOne = () => Promise.resolve(session);
  t.after(() => {
    (PaymentSession as unknown as { create: unknown }).create = originalCreate;
    (PaymentSession as unknown as { findOne: unknown }).findOne = originalFindOne;
    originals.restore();
  });

  const created = await createRazorpayPayment({
    amount: 5000,
    orderReference: "ORDER-P10-001",
    payableNow: 1500,
    paymentMode: "advance",
    userId: String(new Types.ObjectId()),
  });
  const signature = signPayment(created.gatewayOrder.id, "pay_phase10_001");
  const confirmed = await verifyRazorpayPayment({
    razorpayOrderId: created.gatewayOrder.id,
    razorpayPaymentId: "pay_phase10_001",
    razorpaySignature: signature,
  });

  assert.equal(confirmed.status, "partially_paid");
  assert.equal(confirmed.paidAmount, 1500);
  assert.equal(confirmed.outstandingAmount, 3500);
});

test("Razorpay webhook rejects invalid signatures and processes valid captures idempotently", async (t) => {
  setRazorpaySecrets();
  const history = patchHistoryOnly();
  const originalEventCreate = PaymentWebhookEvent.create;
  const originalEventFindOne = PaymentWebhookEvent.findOne;
  const originalSessionFindOne = PaymentSession.findOne;
  const events: InstanceType<typeof PaymentWebhookEvent>[] = [];
  const session = makeSession({
    amount: 2000,
    currencyCode: "INR",
    method: "razorpay",
    orderReference: "ORDER-P10-WEBHOOK",
    outstandingAmount: 2000,
    payableNow: 2000,
    paidAmount: 0,
    razorpayOrderId: "order_phase10_webhook",
    status: "pending_payment",
    userId: new Types.ObjectId(),
  });

  (PaymentWebhookEvent as unknown as { create: unknown }).create = (
    payload: Record<string, unknown>,
  ) => {
    const event = new PaymentWebhookEvent(payload);
    event.save = async () => event;
    events.push(event);
    return Promise.resolve(event);
  };
  (PaymentWebhookEvent as unknown as { findOne: unknown }).findOne = (filter: {
    eventId: string;
  }) => Promise.resolve(events.find((event) => event.eventId === filter.eventId) ?? null);
  (PaymentSession as unknown as { findOne: unknown }).findOne = () => Promise.resolve(session);
  t.after(() => {
    (PaymentWebhookEvent as unknown as { create: unknown }).create = originalEventCreate;
    (PaymentWebhookEvent as unknown as { findOne: unknown }).findOne = originalEventFindOne;
    (PaymentSession as unknown as { findOne: unknown }).findOne = originalSessionFindOne;
    history.restore();
  });

  const payload = Buffer.from(
    JSON.stringify({
      event: "payment.captured",
      id: "evt_phase10_001",
      payload: {
        payment: {
          entity: {
            amount: 200000,
            currency: "INR",
            id: "pay_phase10_webhook",
            order_id: "order_phase10_webhook",
          },
        },
      },
    }),
  );
  await assert.rejects(
    () => handleRazorpayWebhook(payload, "bad-signature"),
    /Invalid webhook signature/,
  );

  const signature = signWebhook(payload);
  const first = await handleRazorpayWebhook(payload, signature);
  const second = await handleRazorpayWebhook(payload, signature);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(session.status, "confirmed");
  assert.equal(session.paidAmount, 2000);
  assert.equal(events.filter((event) => event.signatureVerified).length, 1);
  assert.equal(
    events.some((event) => !event.signatureVerified),
    true,
  );
});

test("manual payment submission enters verification queue and admin approval audit-logs transition", async (t) => {
  const history = patchHistoryOnly();
  const originalSessionCreate = PaymentSession.create;
  const originalSessionFindById = PaymentSession.findById;
  const originalAuditCreate = AuditLog.create;
  const auditLogs: unknown[] = [];
  let session: InstanceType<typeof PaymentSession> | undefined;

  (PaymentSession as unknown as { create: unknown }).create = (
    payload: Record<string, unknown>,
  ) => {
    session = makeSession(payload);
    return Promise.resolve(session);
  };
  (PaymentSession as unknown as { findById: unknown }).findById = () => Promise.resolve(session);
  (AuditLog as unknown as { create: unknown }).create = (payload: unknown) => {
    auditLogs.push(payload);
    return Promise.resolve(payload);
  };
  t.after(() => {
    (PaymentSession as unknown as { create: unknown }).create = originalSessionCreate;
    (PaymentSession as unknown as { findById: unknown }).findById = originalSessionFindById;
    (AuditLog as unknown as { create: unknown }).create = originalAuditCreate;
    history.restore();
  });

  const submitted = await createManualPayment({
    amount: 1200,
    manualScreenshot: {
      aspectRatio: "4:5",
      type: "image",
      url: "https://res.cloudinary.com/demo/image/authenticated/payment-proof.jpg",
    },
    orderReference: "ORDER-P10-MANUAL",
    userId: String(new Types.ObjectId()),
  });
  const approved = await approveManualPayment({
    adminUserId: String(new Types.ObjectId()),
    paymentSessionId: String(submitted._id),
  });

  assert.equal(submitted.status, "confirmed");
  assert.equal(approved.paidAmount, 1200);
  assert.equal(approved.outstandingAmount, 0);
  assert.equal(auditLogs.length, 1);
  assert.equal(history.events.includes("manual_payment_submitted"), true);
  assert.equal(history.events.includes("payment_approved"), true);
});

test("COD and direct UPI flows create expected payment states", async (t) => {
  const history = patchHistoryOnly();
  const originalSessionCreate = PaymentSession.create;
  const sessions: InstanceType<typeof PaymentSession>[] = [];

  (PaymentSession as unknown as { create: unknown }).create = (
    payload: Record<string, unknown>,
  ) => {
    const session = makeSession(payload);
    sessions.push(session);
    return Promise.resolve(session);
  };
  t.after(() => {
    (PaymentSession as unknown as { create: unknown }).create = originalSessionCreate;
    history.restore();
  });

  const cod = await createCodPayment({
    amount: 12000,
    orderReference: "ORDER-P10-COD",
    userId: String(new Types.ObjectId()),
  });
  const upi = await createUpiPayment({
    amount: 2500,
    orderReference: "ORDER-P10-UPI",
    upiReference: "UTR123",
    userId: String(new Types.ObjectId()),
  });

  assert.equal(cod.status, "cod_confirmed");
  assert.equal(cod.codManualReviewRequired, true);
  assert.equal(upi.status, "upi_pending");
  assert.equal(upi.upiId, env.UPI_PAYMENT_ADDRESS);
  assert.equal(history.events.includes("cod_confirmed"), true);
  assert.equal(history.events.includes("upi_payment_initiated"), true);
  assert.equal(sessions.length, 2);
});

test("manual payment rejection requires pending state and records reason", async (t) => {
  const history = patchHistoryOnly();
  const originalSessionFindById = PaymentSession.findById;
  const originalAuditCreate = AuditLog.create;
  const session = makeSession({
    method: "manual_bank_transfer",
    orderReference: "ORDER-P10-REJECT",
    status: "payment_verification_pending",
  });

  (PaymentSession as unknown as { findById: unknown }).findById = () => Promise.resolve(session);
  (AuditLog as unknown as { create: unknown }).create = (payload: unknown) =>
    Promise.resolve(payload);
  t.after(() => {
    (PaymentSession as unknown as { findById: unknown }).findById = originalSessionFindById;
    (AuditLog as unknown as { create: unknown }).create = originalAuditCreate;
    history.restore();
  });

  const rejected = await rejectManualPayment({
    adminUserId: String(new Types.ObjectId()),
    paymentSessionId: String(session._id),
    reason: "Amount mismatch",
  });

  assert.equal(rejected.status, "payment_rejected");
  assert.equal(rejected.rejectionReason, "Amount mismatch");
  assert.equal(history.events.includes("payment_rejected"), true);
});

function makeSession(payload: Record<string, unknown>) {
  const session = new PaymentSession({
    amount: 1000,
    currencyCode: "INR",
    method: "razorpay",
    orderReference: "ORDER-P10",
    outstandingAmount: 1000,
    paidAmount: 0,
    payableNow: 1000,
    status: "pending_payment",
    userId: new Types.ObjectId(),
    ...payload,
  });
  session.save = async () => session;
  return session;
}

function patchHistoryOnly() {
  const originalHistoryCreate = PaymentHistory.create;
  const events: string[] = [];
  (PaymentHistory as unknown as { create: unknown }).create = (payload: { event: string }) => {
    events.push(payload.event);
    return Promise.resolve(payload);
  };

  return {
    events,
    restore() {
      (PaymentHistory as unknown as { create: unknown }).create = originalHistoryCreate;
    },
  };
}

function setRazorpaySecrets() {
  env.RAZORPAY_KEY_SECRET = "test_razorpay_secret";
  env.RAZORPAY_WEBHOOK_SECRET = "test_razorpay_webhook_secret";
}

function signPayment(orderId: string, paymentId: string) {
  return crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function signWebhook(payload: Buffer) {
  return crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET!).update(payload).digest("hex");
}
