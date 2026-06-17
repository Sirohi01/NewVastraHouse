"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export type StoredProduct = {
  slug: string;
  name: string;
  imageUrl?: string;
  price?: string;
};

const recentlyViewedPrefix = "vastra:recently-viewed";
const comparePrefix = "vastra:compare";
const maxRecent = 12;
const maxCompare = 4;

export function useRecentlyViewed(product?: StoredProduct) {
  const storageKey = useScopedStorageKey(recentlyViewedPrefix);
  const [items, setItems] = useState<StoredProduct[]>([]);

  useEffect(() => {
    setItems(readItems(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setItems((current) => {
      const next = [product, ...current.filter((item) => item.slug !== product.slug)].slice(
        0,
        maxRecent,
      );
      writeItems(storageKey, next);
      return next;
    });
  }, [product, storageKey]);

  return items.filter((item) => item.slug !== product?.slug);
}

export function useComparison(product?: StoredProduct) {
  const storageKey = useScopedStorageKey(comparePrefix);
  const [items, setItems] = useState<StoredProduct[]>([]);

  useEffect(() => {
    setItems(readItems(storageKey));
  }, [storageKey]);

  const selected = Boolean(product && items.some((item) => item.slug === product.slug));

  function toggle() {
    if (!product) {
      return;
    }

    setItems((current) => {
      const exists = current.some((item) => item.slug === product.slug);
      const next = exists
        ? current.filter((item) => item.slug !== product.slug)
        : [product, ...current].slice(0, maxCompare);
      writeItems(storageKey, next);
      return next;
    });
  }

  function clear() {
    writeItems(storageKey, []);
    setItems([]);
  }

  return { clear, items, selected, toggle };
}

export function useStoredComparison() {
  return useComparison();
}

function useScopedStorageKey(prefix: string) {
  const userId = useAuthStore((state) => state.user?.id);
  return useMemo(() => `${prefix}:${userId ?? "guest"}`, [prefix, userId]);
}

function readItems(key: string): StoredProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as StoredProduct[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.slug && item.name) : [];
  } catch {
    return [];
  }
}

function writeItems(key: string, items: StoredProduct[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(items));
  }
}
