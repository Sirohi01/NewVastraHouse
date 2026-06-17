import Image from "next/image";

export type ResponsiveImageProps = {
  src: string;
  alt: string;
  aspectRatio: string;
  className?: string;
  objectFit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
};

export function ResponsiveImage({
  src,
  alt,
  aspectRatio,
  className = "",
  objectFit = "cover",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: Readonly<ResponsiveImageProps>) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-muted ${className}`}
      style={{ aspectRatio: aspectRatio.replace(":", " / ") }}
    >
      <Image
        alt={alt}
        className={objectFit === "cover" ? "object-cover" : "object-contain"}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
      />
    </div>
  );
}
