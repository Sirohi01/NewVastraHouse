export type SkuInput = {
  prefix?: string;
  productSlug: string;
  color?: string;
  size?: string;
  sequence: number;
};

export function generateSku({
  prefix = "TVH",
  productSlug,
  color,
  size,
  sequence,
}: SkuInput): string {
  const productPart = productSlug
    .split("-")
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("")
    .slice(0, 10);
  const colorPart = color ? normalizeSkuPart(color, 4) : "GEN";
  const sizePart = size ? normalizeSkuPart(size, 4) : "STD";
  const sequencePart = String(sequence).padStart(4, "0");

  return `${prefix}-${productPart}-${colorPart}-${sizePart}-${sequencePart}`;
}

function normalizeSkuPart(value: string, length: number): string {
  return (
    value
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, length) || "NA"
  );
}
