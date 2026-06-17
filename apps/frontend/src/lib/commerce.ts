"use client";

import { apiBaseUrl } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";

export type CartLineItem = {
  _id: string;
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  sku: string;
  media?: MediaReference;
  unitPrice: number;
  currencyCode: string;
  quantity: number;
  stockSnapshot: number;
};

export type Cart = {
  _id: string;
  items: CartLineItem[];
  giftPackaging?: { enabled: boolean; fee: number };
  giftCardRedemptions?: Array<{ code: string; amount: number; currencyCode: string }>;
  totals: {
    subtotal: number;
    giftPackagingFee: number;
    giftCardDiscount: number;
    grandTotal: number;
    currencyCode: string;
  };
};

export type WishlistItem = {
  _id: string;
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  sku: string;
  media?: MediaReference;
  priceSnapshot: number;
  currentPrice: number;
  stockSnapshot: number;
  currentStock: number;
  priceChanged: boolean;
  stockChanged: boolean;
};

export type Wishlist = {
  _id: string;
  items: WishlistItem[];
};

export function getGuestSessionId() {
  const key = "vastra:guest-session-id";
  let value = window.localStorage.getItem(key);

  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }

  return value;
}

export async function commerceFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
) {
  const { accessToken, headers, ...rest } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Session-Id": getGuestSessionId(),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Commerce request failed");
  }

  return response.json() as Promise<T>;
}

export function formatMoney(value: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
