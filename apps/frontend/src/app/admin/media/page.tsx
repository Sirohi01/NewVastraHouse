"use client";

import { Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiBaseUrl, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const aspectRatios = ["1:1", "4:5", "9:16", "16:9", "21:9", "3:2", "2:3", "custom"];

export default function AdminMediaPage() {
  const toast = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem>();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem>();
  const accessToken = useAuthStore((state) => state.accessToken);

  async function loadMedia() {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (tag) {
        params.set("tag", tag);
      }

      const payload = await apiFetch<{ media: MediaItem[] }>(`/media?${params.toString()}`, {
        accessToken,
      });
      setMedia(payload.media);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load media"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadMedia();
    }
  }, [accessToken]);

  async function uploadMedia(formData: FormData) {
    setUploading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }

      toast.success("Media uploaded");
      setUploadOpen(false);
      await loadMedia();
    } catch (error) {
      toast.error(errorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await apiFetch(`/media/${deleteTarget._id}`, { accessToken, method: "DELETE" });
      toast.success("Media deleted");
      if (selectedMedia?._id === deleteTarget._id) {
        setSelectedMedia(undefined);
      }
      setDeleteTarget(undefined);
      await loadMedia();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete media"));
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Media Library</h1>
            <p className="text-sm text-muted-foreground">
              Manage product, payment, and review media.
            </p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            onClick={() => setUploadOpen(true)}
            type="button"
          >
            <Upload aria-hidden="true" size={16} />
            Upload
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="h-9 flex-1 rounded-md border border-border px-2.5 text-sm"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void loadMedia()}
            placeholder="Search alt text"
            value={search}
          />
          <input
            className="h-9 w-40 rounded-md border border-border px-2.5 text-sm"
            onChange={(event) => setTag(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void loadMedia()}
            placeholder="Filter by tag"
            value={tag}
          />
          <button
            className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
            onClick={() => void loadMedia()}
            type="button"
          >
            Search
          </button>
        </div>

        <MediaPicker media={media} onSelect={(item) => setSelectedMedia(item)} />
        {!loading && !media.length ? null : null}

        {selectedMedia ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{selectedMedia.altText ?? "Untitled media"}</p>
              <p className="truncate text-xs text-muted-foreground">{selectedMedia.secureUrl}</p>
            </div>
            <button
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 text-xs font-semibold text-destructive"
              onClick={() => setDeleteTarget(selectedMedia)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete
            </button>
          </div>
        ) : null}

        <Modal
          onClose={() => setUploadOpen(false)}
          open={uploadOpen}
          size="md"
          title="Upload media"
        >
          <form action={uploadMedia} className="grid gap-3 sm:grid-cols-2">
            <label className="col-span-2 text-xs font-medium">
              File
              <input
                className="mt-1 block w-full rounded-md border border-border p-1.5 text-sm"
                name="file"
                required
                type="file"
              />
            </label>
            <label className="text-xs font-medium">
              Aspect ratio
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="aspectRatio"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              Context
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="context"
              >
                <option value="product-media">Product media</option>
                <option value="payment-screenshot">Payment screenshot</option>
                <option value="review-photo">Review photo</option>
                <option value="catalog-pdf">Catalog PDF</option>
              </select>
            </label>
            <label className="text-xs font-medium">
              Object fit
              <select
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="objectFit"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>
            </label>
            <label className="text-xs font-medium">
              Alt text
              <input
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="altText"
                required
                minLength={3}
              />
            </label>
            <label className="col-span-2 text-xs font-medium">
              Tags (comma separated)
              <input
                className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
                name="tags"
              />
            </label>
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
                disabled={uploading}
                onClick={() => setUploadOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          confirmLabel="Delete"
          message="This will remove the media asset from the library. This cannot be undone."
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={confirmDelete}
          open={!!deleteTarget}
          title="Delete media"
        />
      </section>
    </ProtectedRoute>
  );
}
