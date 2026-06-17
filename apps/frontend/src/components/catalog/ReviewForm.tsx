"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { submitReview } from "@/lib/catalog";

export function ReviewForm({ slug }: Readonly<{ slug: string }>) {
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(undefined);

    try {
      await submitReview(slug, {
        body: String(formData.get("body") ?? ""),
        guestEmail: String(formData.get("guestEmail") ?? ""),
        guestName: String(formData.get("guestName") ?? ""),
        rating: Number(formData.get("rating") ?? 5),
        title: String(formData.get("title") ?? ""),
      });
      setMessage("Review submitted for moderation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="mt-5 grid gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase text-muted-foreground">Name</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            name="guestName"
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-muted-foreground">Email</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            name="guestEmail"
            type="email"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <label>
          <span className="text-xs font-semibold uppercase text-muted-foreground">Rating</span>
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            defaultValue="5"
            name="rating"
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold uppercase text-muted-foreground">Title</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
            name="title"
          />
        </label>
      </div>
      <label>
        <span className="text-xs font-semibold uppercase text-muted-foreground">Review</span>
        <textarea
          className="mt-1 min-h-28 w-full rounded-md border border-border bg-background p-3"
          minLength={10}
          name="body"
          required
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {message ? <p className="text-sm font-semibold text-accent">{message}</p> : <span />}
        <button
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          disabled={submitting}
          type="submit"
        >
          <Send aria-hidden="true" size={16} />
          {submitting ? "Submitting" : "Submit"}
        </button>
      </div>
    </form>
  );
}
