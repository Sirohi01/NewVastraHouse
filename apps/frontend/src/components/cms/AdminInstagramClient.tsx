"use client";

import { Instagram, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  defaultCmsContent,
  fetchAdminCmsContent,
  sanitizeCmsContent,
  saveAdminCmsContent,
  type CmsContent,
} from "@/lib/cms";
import { useAuthStore } from "@/stores/authStore";

export function AdminInstagramClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [content, setContent] = useState<CmsContent>(defaultCmsContent);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (accessToken) {
      void load();
    }
  }, [accessToken]);

  async function load() {
    try {
      const payload = await fetchAdminCmsContent("storefront-main", accessToken);
      setContent(normalizeContent(payload.content ?? defaultCmsContent));
      setMessage("Instagram feed loaded");
    } catch (error) {
      toast.error(errorMessage(error, "Instagram feed load failed"));
      setMessage(error instanceof Error ? error.message : "Instagram feed load failed");
    }
  }

  async function save() {
    try {
      const payload = await saveAdminCmsContent(
        "storefront-main",
        normalizeContent(content),
        accessToken,
      );
      setContent(normalizeContent(payload.content));
      setMessage("Instagram feed saved");
      toast.success("Instagram feed saved");
    } catch (error) {
      toast.error(errorMessage(error, "Instagram feed save failed"));
      setMessage(error instanceof Error ? error.message : "Instagram feed save failed");
    }
  }

  function updateProfile(value: string) {
    setContent((current) =>
      normalizeContent({
        ...current,
        footer: { ...current.footer, instagramUrl: value },
      }),
    );
  }

  function updatePost(index: number, value: string) {
    setContent((current) =>
      normalizeContent({
        ...current,
        footer: {
          ...current.footer,
          instagramPosts: (current.footer?.instagramPosts ?? []).map((item, itemIndex) =>
            itemIndex === index ? value : item,
          ),
        },
      }),
    );
  }

  function addPost() {
    setContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        instagramPosts: [...(current.footer?.instagramPosts ?? []), ""],
      },
    }));
  }

  function removePost(index: number) {
    setContent((current) =>
      normalizeContent({
        ...current,
        footer: {
          ...current.footer,
          instagramPosts: (current.footer?.instagramPosts ?? []).filter(
            (_, itemIndex) => itemIndex !== index,
          ),
        },
      }),
    );
  }

  return (
    <ProtectedRoute>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Instagram Feed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add Instagram post or reel URLs for the home page Follow Us marquee.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => void load()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={() => void save()}
              type="button"
            >
              <Save aria-hidden="true" size={16} />
              Save
            </button>
          </div>
        </div>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
          <label className="text-sm font-medium">
            Instagram profile URL
            <input
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
              onChange={(event) => updateProfile(event.target.value)}
              placeholder="https://www.instagram.com/vastrahouse/"
              value={content.footer?.instagramUrl ?? ""}
            />
          </label>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Instagram aria-hidden="true" size={18} />
              <h2 className="text-lg font-semibold">Post / Reel URLs</h2>
            </div>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
              onClick={addPost}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              Add URL
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(content.footer?.instagramPosts ?? []).map((url, index) => (
              <div className="rounded-md border border-border p-3" key={`${url}-${index}`}>
                <label className="text-sm font-medium">
                  URL {index + 1}
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                    onChange={(event) => updatePost(index, event.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    value={url}
                  />
                </label>
                <button
                  className="mt-3 inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2 text-xs font-semibold text-destructive"
                  onClick={() => removePost(index)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={13} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}

function normalizeContent(content: CmsContent): CmsContent {
  return sanitizeCmsContent(content);
}
