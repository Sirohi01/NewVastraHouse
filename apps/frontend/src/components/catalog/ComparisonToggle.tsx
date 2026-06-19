"use client";

import { GitCompareArrows } from "lucide-react";
import { useComparison, type StoredProduct } from "@/lib/catalogStorage";

export function ComparisonToggle({
  className = "",
  product,
}: Readonly<{ className?: string; product: StoredProduct }>) {
  const { selected, toggle } = useComparison(product);

  return (
    <button
      aria-pressed={selected}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${className} ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
      }`}
      onClick={toggle}
      type="button"
    >
      <GitCompareArrows aria-hidden="true" size={16} />
      {selected ? "Selected" : "Compare"}
    </button>
  );
}
