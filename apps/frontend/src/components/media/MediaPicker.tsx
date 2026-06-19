"use client";

import { ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/states/EmptyState";
import { ResponsiveImage } from "./ResponsiveImage";

export type MediaItem = {
  _id: string;
  originalUrl?: string;
  secureUrl: string;
  altText?: string;
  selectedAspectRatio: string;
  resourceType: "image" | "video" | "raw";
};

export function MediaPicker({
  media,
  onSelect,
}: Readonly<{ media: MediaItem[]; onSelect: (media: MediaItem) => void }>) {
  if (!media.length) {
    return <EmptyState title="No media" message="Upload assets to use them here." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {media.map((item) => (
        <button
          className="rounded-lg border border-border bg-card p-2 text-left transition hover:border-primary"
          key={item._id}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item.resourceType === "image" ? (
            <ResponsiveImage
              alt={item.altText ?? "Media asset"}
              aspectRatio={item.selectedAspectRatio.replace(":", " / ")}
              src={item.secureUrl}
            />
          ) : item.resourceType === "video" ? (
            <div className="relative aspect-square overflow-hidden bg-black">
              <video
                aria-label={item.altText ?? "Video asset"}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
                src={item.secureUrl}
              />
              <span className="absolute bottom-2 left-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                Video
              </span>
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon aria-hidden="true" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
