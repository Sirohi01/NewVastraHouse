"use client";

export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckout = {
  open: () => void;
};

export type RazorpayConstructor = new (options: {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  key: string;
  modal?: { ondismiss?: () => void };
  name: string;
  order_id: string;
  prefill?: { contact?: string; email?: string; name?: string };
  theme?: { color?: string };
}) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(script);
  });
}
