export type ResponsiveVideoProps = {
  src: string;
  aspectRatio: string;
  objectFit?: "cover" | "contain";
  controls?: boolean;
};

export function ResponsiveVideo({
  src,
  aspectRatio,
  objectFit = "cover",
  controls = true,
}: Readonly<ResponsiveVideoProps>) {
  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio }}>
      <video
        className={`h-full w-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
        controls={controls}
        muted
        playsInline
        src={src}
      />
    </div>
  );
}
