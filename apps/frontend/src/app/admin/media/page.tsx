"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { useAuthStore } from "@/stores/authStore";

const aspectRatios = ["1:1", "4:5", "9:16", "16:9", "21:9", "3:2", "2:3", "custom"];

export default function AdminMediaPage() {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | undefined>();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const accessToken = useAuthStore((state) => state.accessToken);

  async function loadMedia() {
    setMessage("Loading media...");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (tag) {
      params.set("tag", tag);
    }

    const response = await fetch(`${apiBaseUrl}/media?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      setMessage("Media load failed");
      return;
    }

    const payload = (await response.json()) as { media: MediaItem[] };
    setMedia(payload.media);
    setMessage("Media loaded");
  }

  async function uploadMedia(formData: FormData) {
    setMessage("Uploading...");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      setMessage("Upload failed");
      return;
    }

    setMessage("Media uploaded");
    await loadMedia();
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto min-h-[calc(100vh-144px)] max-w-5xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <Upload aria-hidden="true" className="text-primary" />
        </div>

        <form
          action={uploadMedia}
          className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2"
        >
          <label className="text-sm font-medium">
            File
            <input
              className="mt-2 block w-full rounded-md border border-border p-2"
              name="file"
              required
              type="file"
            />
          </label>
          <label className="text-sm font-medium">
            Aspect ratio
            <select
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="aspectRatio"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Context
            <select
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="context"
            >
              <option value="product-media">Product media</option>
              <option value="payment-screenshot">Payment screenshot</option>
              <option value="review-photo">Review photo</option>
              <option value="catalog-pdf">Catalog PDF</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Object fit
            <select
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="objectFit"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Alt text
            <input
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="altText"
            />
          </label>
          <label className="text-sm font-medium">
            Tags
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3" name="tags" />
          </label>
          <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground md:col-span-2">
            Upload
          </button>
          {message ? (
            <p className="text-sm text-muted-foreground md:col-span-2">{message}</p>
          ) : null}
        </form>

        <div className="mt-8 grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="h-11 rounded-md border border-border px-3"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search alt text"
            value={search}
          />
          <input
            className="h-11 rounded-md border border-border px-3"
            onChange={(event) => setTag(event.target.value)}
            placeholder="Filter by tag"
            value={tag}
          />
          <button
            className="h-11 rounded-md border border-border px-4 font-semibold"
            onClick={loadMedia}
            type="button"
          >
            Search
          </button>
        </div>

        <div className="mt-6">
          <MediaPicker
            media={media}
            onSelect={(item) => {
              setSelectedMedia(item);
              setMessage(`Selected ${item.altText ?? item.secureUrl}`);
            }}
          />
        </div>

        {selectedMedia ? (
          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Selected media URL: {selectedMedia.secureUrl}
          </div>
        ) : null}
      </section>
    </ProtectedRoute>
  );
}
