"use client";

import { ImagePlus, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MediaPicker, type MediaItem } from "@/components/media/MediaPicker";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiBaseUrl, apiFetch } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";
import {
  defaultCmsContent,
  fetchAdminCmsContent,
  saveAdminCmsContent,
  type CmsContent,
  type CmsHeroSlide,
  type CmsLink,
} from "@/lib/cms";
import { useAuthStore } from "@/stores/authStore";

const contentTabs = [
  { label: "Home", value: "home" },
  { label: "About", value: "about" },
  { label: "Navigation", value: "navigation" },
  { label: "Footer", value: "footer" },
  { label: "Testimonials", value: "testimonials" },
  { label: "FAQs", value: "faqs" },
  { label: "Policies", value: "policies" },
] as const;

type ContentTab = (typeof contentTabs)[number]["value"];
type CmsList =
  | "navigation"
  | "testimonials"
  | "faqs"
  | "policies"
  | "aboutValues"
  | "instagramPosts";

export function AdminContentClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const heroUploadRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState<CmsContent>(defaultCmsContent);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<ContentTab>("home");
  const [uploadingHero, setUploadingHero] = useState(false);

  const heroMedia = content.home?.hero?.media;
  const imageMedia = useMemo(() => media.filter((item) => item.resourceType === "image"), [media]);

  useEffect(() => {
    if (accessToken) {
      void load();
      void loadMedia();
    }
  }, [accessToken]);

  async function load() {
    try {
      const payload = await fetchAdminCmsContent("storefront-main", accessToken);
      setContent(normalizeContent(payload.content ?? defaultCmsContent));
      setMessage(payload.content ? "Content loaded" : "Using starter content");
    } catch (error) {
      toast.error(errorMessage(error, "Content load failed"));
      setMessage(error instanceof Error ? error.message : "Content load failed");
    }
  }

  async function loadMedia() {
    try {
      const payload = await apiFetch<{ media: MediaItem[] }>("/media", {
        accessToken,
      });
      setMedia(payload.media);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load media"));
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
      setMessage("Content saved");
      toast.success("Content saved");
    } catch (error) {
      toast.error(errorMessage(error, "Content save failed"));
      setMessage(error instanceof Error ? error.message : "Content save failed");
    }
  }

  function updateContent(updater: (current: CmsContent) => CmsContent) {
    setContent((current) => normalizeContent(updater(normalizeContent(current))));
  }

  function updateHome(field: "announcement", value: string) {
    updateContent((current) => ({ ...current, home: { ...current.home, [field]: value } }));
  }

  function updateHero(field: "copy" | "eyebrow" | "title", value: string) {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        hero: {
          ...current.home?.hero,
          [field]: value,
        },
      },
    }));
  }

  function updateAbout(
    field: "description" | "eyebrow" | "storyCopy" | "storyEyebrow" | "storyTitle" | "title",
    value: string,
  ) {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        [field]: value,
      },
    }));
  }

  function updateAboutLink(key: keyof CmsLink, value: string | boolean) {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        primaryCta: {
          enabled: true,
          href: "",
          label: "",
          ...current.about?.primaryCta,
          [key]: value,
        },
      },
    }));
  }

  function setAboutMedia(item: MediaItem) {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        media: toMediaReference(item, current.about?.storyTitle ?? "About story image", "16:9"),
      },
    }));
  }

  function updateAboutValue(
    index: number,
    field: "icon" | "text" | "title",
    value: "award" | "care" | "shield" | "sparkles" | string,
  ) {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        values: (current.about?.values ?? []).map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function addAboutValue() {
    updateContent((current) => ({
      ...current,
      about: {
        ...current.about,
        values: [
          ...(current.about?.values ?? []),
          { icon: "sparkles", text: "Describe this brand value.", title: "New Value" },
        ],
      },
    }));
  }

  function updateHeroLink(
    field: "primaryCta" | "secondaryCta",
    key: keyof CmsLink,
    value: string | boolean,
  ) {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        hero: {
          ...current.home?.hero,
          [field]: {
            enabled: true,
            href: "",
            label: "",
            ...current.home?.hero?.[field],
            [key]: value,
          },
        },
      },
    }));
  }

  function setHeroMedia(item: MediaItem) {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        hero: {
          ...current.home?.hero,
          media: toMediaReference(item, content.home?.hero?.title ?? "Home hero image", "16:7"),
        },
      },
    }));
  }

  function heroSlides() {
    return content.home?.hero?.slides?.length
      ? content.home.hero.slides
      : [
          {
            copy: content.home?.hero?.copy,
            eyebrow: content.home?.hero?.eyebrow,
            fontFamily: "serif" as const,
            fontSize: "lg" as const,
            media: content.home?.hero?.media,
            primaryCta: content.home?.hero?.primaryCta,
            secondaryCta: content.home?.hero?.secondaryCta,
            textColor: "#ffffff",
            title: content.home?.hero?.title,
          },
        ];
  }

  function updateHeroSlide(index: number, patch: Partial<CmsHeroSlide>) {
    updateContent((current) => {
      const slides = current.home?.hero?.slides?.length
        ? [...current.home.hero.slides]
        : heroSlides();
      slides[index] = { ...slides[index], ...patch };

      return {
        ...current,
        home: {
          ...current.home,
          hero: {
            ...current.home?.hero,
            ...(index === 0 ? patch : {}),
            slides,
          },
        },
      };
    });
  }

  function updateHeroSlideLink(
    index: number,
    field: "primaryCta" | "secondaryCta",
    key: keyof CmsLink,
    value: string | boolean,
  ) {
    const slide = heroSlides()[index] ?? {};
    updateHeroSlide(index, {
      [field]: {
        enabled: true,
        href: "",
        label: "",
        ...slide[field],
        [key]: value,
      },
    });
  }

  function addHeroSlide() {
    updateContent((current) => ({
      ...current,
      home: {
        ...current.home,
        hero: {
          ...current.home?.hero,
          slides: [
            ...heroSlides(),
            {
              copy: "",
              eyebrow: "New Season Edit",
              fontFamily: "serif",
              fontSize: "lg",
              textColor: "#ffffff",
              title: "New Hero Slide",
            },
          ],
        },
      },
    }));
  }

  function removeHeroSlide(index: number) {
    updateContent((current) => {
      const slides = heroSlides().filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        home: {
          ...current.home,
          hero: {
            ...current.home?.hero,
            slides: slides.length ? slides : heroSlides().slice(0, 1),
          },
        },
      };
    });
  }

  function setHeroSlideMedia(index: number, item: MediaItem) {
    updateHeroSlide(index, {
      media: toMediaReference(item, heroSlides()[index]?.title ?? "Home hero slide", "16:7"),
    });
  }

  async function uploadHeroMedia() {
    const file = heroUploadRef.current?.files?.[0];

    if (!file) {
      toast.error("Select a hero image first");
      return;
    }

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("aspectRatio", "16:7");
      formData.set("context", "product-media");
      formData.set("objectFit", "cover");
      formData.set("altText", content.home?.hero?.title || "The Vastra House hero image");
      formData.set("tags", "cms,hero,home");

      const response = await fetch(`${apiBaseUrl}/media/upload`, {
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Upload failed");
      }

      const payload = (await response.json()) as { media: MediaItem };
      setHeroMedia(payload.media);
      if (heroUploadRef.current) {
        heroUploadRef.current.value = "";
      }
      await loadMedia();
      toast.success("Hero image uploaded");
    } catch (error) {
      toast.error(errorMessage(error, "Hero upload failed"));
    } finally {
      setUploadingHero(false);
    }
  }

  function updateLinkList(index: number, key: keyof CmsLink, value: string | boolean) {
    updateContent((current) => ({
      ...current,
      navigation: (current.navigation ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addLink() {
    updateContent((current) => ({
      ...current,
      navigation: [
        ...(current.navigation ?? []),
        { enabled: true, href: "/shop", label: "New Link" },
      ],
    }));
  }

  function removeFromList(list: CmsList, index: number) {
    if (list === "aboutValues") {
      updateContent((current) => ({
        ...current,
        about: {
          ...current.about,
          values: (current.about?.values ?? []).filter((_, itemIndex) => itemIndex !== index),
        },
      }));
      return;
    }

    if (list === "instagramPosts") {
      updateContent((current) => ({
        ...current,
        footer: {
          ...current.footer,
          instagramPosts: (current.footer?.instagramPosts ?? []).filter(
            (_, itemIndex) => itemIndex !== index,
          ),
        },
      }));
      return;
    }

    updateContent((current) => ({
      ...current,
      [list]: (current[list] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateFooterTagline(value: string) {
    updateContent((current) => ({
      ...current,
      footer: { ...current.footer, tagline: value },
    }));
  }

  function updateFooterField(
    field: "email" | "instagramUrl" | "location" | "phone" | "whatsappUrl",
    value: string,
  ) {
    updateContent((current) => ({
      ...current,
      footer: { ...current.footer, [field]: value },
    }));
  }

  function updateInstagramPost(index: number, value: string) {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        instagramPosts: (current.footer?.instagramPosts ?? []).map((item, itemIndex) =>
          itemIndex === index ? value : item,
        ),
      },
    }));
  }

  function addInstagramPost() {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        instagramPosts: [...(current.footer?.instagramPosts ?? []), ""],
      },
    }));
  }

  function setFooterLogo(item: MediaItem) {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        brandLogo: toMediaReference(item, "The Vastra House logo", "1:1"),
      },
    }));
  }

  function updateFooterLink(index: number, key: keyof CmsLink, value: string | boolean) {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        links: (current.footer?.links ?? []).map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  }

  function addFooterLink() {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        links: [
          ...(current.footer?.links ?? []),
          { enabled: true, href: "/shop", label: "Footer Link" },
        ],
      },
    }));
  }

  function removeFooterLink(index: number) {
    updateContent((current) => ({
      ...current,
      footer: {
        ...current.footer,
        links: (current.footer?.links ?? []).filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  function updateTestimonial(index: number, key: "location" | "name" | "quote", value: string) {
    updateContent((current) => ({
      ...current,
      testimonials: (current.testimonials ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addTestimonial() {
    updateContent((current) => ({
      ...current,
      testimonials: [
        ...(current.testimonials ?? []),
        { location: "", name: "Customer", quote: "" },
      ],
    }));
  }

  function updateFaq(index: number, key: "answer" | "question", value: string) {
    updateContent((current) => ({
      ...current,
      faqs: (current.faqs ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addFaq() {
    updateContent((current) => ({
      ...current,
      faqs: [...(current.faqs ?? []), { answer: "", question: "New question" }],
    }));
  }

  function updatePolicy(index: number, key: "body" | "slug" | "title", value: string) {
    updateContent((current) => ({
      ...current,
      policies: (current.policies ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addPolicy() {
    updateContent((current) => ({
      ...current,
      policies: [
        ...(current.policies ?? []),
        { body: "", slug: "new-policy", title: "New Policy" },
      ],
    }));
  }

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">CMS Content</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit website text, CTAs, hero media, navigation, footer, FAQs, policies, and
              testimonials.
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

        {message ? <p className="mb-3 text-sm text-muted-foreground">{message}</p> : null}

        <Tabs active={tab} items={contentTabs} onChange={setTab} />

        <div className="mt-4">
          {tab === "home" ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Home Hero</h2>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
                    onClick={addHeroSlide}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={15} />
                    Add Slide
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  <Field
                    label="Announcement bar"
                    onChange={(value) => updateHome("announcement", value)}
                    value={content.home?.announcement ?? ""}
                  />
                  <Field
                    label="Eyebrow"
                    onChange={(value) => updateHero("eyebrow", value)}
                    value={content.home?.hero?.eyebrow ?? ""}
                  />
                  <Field
                    label="Hero title"
                    onChange={(value) => updateHero("title", value)}
                    value={content.home?.hero?.title ?? ""}
                  />
                  <TextEditor
                    label="Hero copy"
                    onChange={(value) => updateHero("copy", value)}
                    value={content.home?.hero?.copy ?? ""}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <CtaEditor
                      label="Primary CTA"
                      link={content.home?.hero?.primaryCta}
                      onChange={(key, value) => updateHeroLink("primaryCta", key, value)}
                    />
                    <CtaEditor
                      label="Secondary CTA"
                      link={content.home?.hero?.secondaryCta}
                      onChange={(key, value) => updateHeroLink("secondaryCta", key, value)}
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  {heroSlides().map((slide, index) => (
                    <div
                      className="rounded-md border border-border p-3"
                      key={`${slide.title}-${index}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Hero Slide {index + 1}</h3>
                        {heroSlides().length > 1 ? (
                          <button
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2 text-xs font-semibold text-destructive"
                            onClick={() => removeHeroSlide(index)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={13} />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field
                          label="Eyebrow"
                          onChange={(value) => updateHeroSlide(index, { eyebrow: value })}
                          value={slide.eyebrow ?? ""}
                        />
                        <Field
                          label="Title"
                          onChange={(value) => updateHeroSlide(index, { title: value })}
                          value={slide.title ?? ""}
                        />
                      </div>
                      <TextEditor
                        label="Copy"
                        onChange={(value) => updateHeroSlide(index, { copy: value })}
                        value={slide.copy ?? ""}
                      />
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="text-sm font-medium">
                          Font family
                          <select
                            className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                            onChange={(event) =>
                              updateHeroSlide(index, {
                                fontFamily: event.target.value as "serif" | "sans",
                              })
                            }
                            value={slide.fontFamily ?? "serif"}
                          >
                            <option value="serif">Serif</option>
                            <option value="sans">Sans</option>
                          </select>
                        </label>
                        <label className="text-sm font-medium">
                          Font size
                          <select
                            className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                            onChange={(event) =>
                              updateHeroSlide(index, {
                                fontSize: event.target.value as "sm" | "md" | "lg",
                              })
                            }
                            value={slide.fontSize ?? "lg"}
                          >
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                          </select>
                        </label>
                        <Field
                          label="Text colour"
                          onChange={(value) => updateHeroSlide(index, { textColor: value })}
                          value={slide.textColor ?? "#ffffff"}
                        />
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <CtaEditor
                          label="Primary CTA"
                          link={slide.primaryCta}
                          onChange={(key, value) =>
                            updateHeroSlideLink(index, "primaryCta", key, value)
                          }
                        />
                        <CtaEditor
                          label="Secondary CTA"
                          link={slide.secondaryCta}
                          onChange={(key, value) =>
                            updateHeroSlideLink(index, "secondaryCta", key, value)
                          }
                        />
                      </div>
                      <div className="mt-3">
                        {slide.media?.url ? (
                          <p className="mb-2 rounded-md border border-border p-2 text-xs text-muted-foreground">
                            Selected media: {slide.media.altText ?? slide.media.url}
                          </p>
                        ) : null}
                        <MediaPicker
                          media={media}
                          onSelect={(item) => setHeroSlideMedia(index, item)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-lg border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ImagePlus aria-hidden="true" size={16} />
                  Hero Media
                </div>
                {heroMedia?.url ? (
                  <ResponsiveImage
                    alt={heroMedia.altText ?? "Home hero image"}
                    aspectRatio={heroMedia.aspectRatio?.replace(":", " / ") ?? "16 / 7"}
                    className="mt-3 rounded-md border border-border"
                    objectFit={heroMedia.objectFit}
                    src={heroMedia.url}
                  />
                ) : (
                  <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
                    No hero media selected.
                  </p>
                )}
                <div className="mt-4 grid gap-2">
                  <label className="text-xs font-medium">
                    Upload new hero image or video
                    <input
                      accept="image/*,video/*"
                      className="mt-1 block w-full rounded-md border border-border p-1.5 text-sm"
                      ref={heroUploadRef}
                      type="file"
                    />
                  </label>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold disabled:opacity-60"
                    disabled={uploadingHero}
                    onClick={() => void uploadHeroMedia()}
                    type="button"
                  >
                    <Upload aria-hidden="true" size={15} />
                    {uploadingHero ? "Uploading..." : "Upload Hero Media"}
                  </button>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold">Pick from media library</p>
                  <MediaPicker media={media} onSelect={setHeroMedia} />
                </div>
              </aside>
            </section>
          ) : null}

          {tab === "about" ? (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-semibold">About Page</h2>
                <div className="mt-4 grid gap-3">
                  <Field
                    label="Page eyebrow"
                    onChange={(value) => updateAbout("eyebrow", value)}
                    value={content.about?.eyebrow ?? ""}
                  />
                  <Field
                    label="Page title"
                    onChange={(value) => updateAbout("title", value)}
                    value={content.about?.title ?? ""}
                  />
                  <TextEditor
                    label="Page description"
                    onChange={(value) => updateAbout("description", value)}
                    value={content.about?.description ?? ""}
                  />
                  <Field
                    label="Story eyebrow"
                    onChange={(value) => updateAbout("storyEyebrow", value)}
                    value={content.about?.storyEyebrow ?? ""}
                  />
                  <Field
                    label="Story title"
                    onChange={(value) => updateAbout("storyTitle", value)}
                    value={content.about?.storyTitle ?? ""}
                  />
                  <TextEditor
                    label="Story copy"
                    minHeight="min-h-40"
                    onChange={(value) => updateAbout("storyCopy", value)}
                    value={content.about?.storyCopy ?? ""}
                  />
                  <CtaEditor
                    label="Primary CTA"
                    link={content.about?.primaryCta}
                    onChange={updateAboutLink}
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">Value Cards</h3>
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold"
                      onClick={addAboutValue}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={13} />
                      Add Value
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {(content.about?.values ?? []).map((item, index) => (
                      <CardRow
                        key={`${item.title}-${index}`}
                        onRemove={() => removeFromList("aboutValues", index)}
                      >
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="text-sm font-medium">
                            Icon
                            <select
                              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                              onChange={(event) =>
                                updateAboutValue(index, "icon", event.target.value)
                              }
                              value={item.icon ?? "sparkles"}
                            >
                              <option value="sparkles">Sparkles</option>
                              <option value="award">Award</option>
                              <option value="shield">Shield</option>
                              <option value="care">Care</option>
                            </select>
                          </label>
                          <div className="md:col-span-2">
                            <Field
                              label="Title"
                              onChange={(value) => updateAboutValue(index, "title", value)}
                              value={item.title}
                            />
                          </div>
                        </div>
                        <TextEditor
                          label="Text"
                          onChange={(value) => updateAboutValue(index, "text", value)}
                          value={item.text}
                        />
                      </CardRow>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="rounded-lg border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ImagePlus aria-hidden="true" size={16} />
                  About Image
                </div>
                {content.about?.media?.url ? (
                  <ResponsiveImage
                    alt={content.about.media.altText ?? "About story image"}
                    aspectRatio={content.about.media.aspectRatio ?? "16 / 9"}
                    className="mt-3 rounded-md border border-border"
                    objectFit={content.about.media.objectFit}
                    src={content.about.media.url}
                  />
                ) : (
                  <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
                    No about image selected.
                  </p>
                )}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold">Pick from media library</p>
                  <MediaPicker media={imageMedia} onSelect={setAboutMedia} />
                </div>
              </aside>
            </section>
          ) : null}

          {tab === "navigation" ? (
            <EditorSection title="Navigation Links" onAdd={addLink}>
              {(content.navigation ?? []).map((link, index) => (
                <LinkRow
                  key={`${link.href}-${index}`}
                  link={link}
                  onChange={(key, value) => updateLinkList(index, key, value)}
                  onRemove={() => removeFromList("navigation", index)}
                />
              ))}
            </EditorSection>
          ) : null}

          {tab === "footer" ? (
            <EditorSection title="Footer Content" onAdd={addFooterLink}>
              <div className="mb-4 grid gap-3 rounded-md border border-border p-3">
                <p className="text-sm font-semibold">Brand Logo</p>
                {content.footer?.brandLogo?.url ? (
                  <div className="w-32">
                    <ResponsiveImage
                      alt={content.footer.brandLogo.altText ?? "The Vastra House logo"}
                      aspectRatio={content.footer.brandLogo.aspectRatio ?? "1:1"}
                      objectFit={content.footer.brandLogo.objectFit ?? "contain"}
                      src={content.footer.brandLogo.url}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No logo selected. Header and footer will show text logo.
                  </p>
                )}
                <MediaPicker media={imageMedia} onSelect={setFooterLogo} />
              </div>
              <TextEditor
                label="Footer tagline"
                onChange={updateFooterTagline}
                value={content.footer?.tagline ?? ""}
              />
              <div className="mt-4 grid gap-3 rounded-md border border-border p-3 md:grid-cols-2">
                <Field
                  label="Customer email"
                  onChange={(value) => updateFooterField("email", value)}
                  value={content.footer?.email ?? ""}
                />
                <Field
                  label="Phone number"
                  onChange={(value) => updateFooterField("phone", value)}
                  value={content.footer?.phone ?? ""}
                />
                <Field
                  label="Location"
                  onChange={(value) => updateFooterField("location", value)}
                  value={content.footer?.location ?? ""}
                />
                <Field
                  label="Instagram profile URL"
                  onChange={(value) => updateFooterField("instagramUrl", value)}
                  value={content.footer?.instagramUrl ?? ""}
                />
                <Field
                  label="WhatsApp URL"
                  onChange={(value) => updateFooterField("whatsappUrl", value)}
                  value={content.footer?.whatsappUrl ?? ""}
                />
              </div>
              <div className="mt-4 rounded-md border border-border p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Instagram Post URLs</p>
                  <button
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold"
                    onClick={addInstagramPost}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={13} />
                    Add Post
                  </button>
                </div>
                <div className="grid gap-3">
                  {(content.footer?.instagramPosts ?? []).map((url, index) => (
                    <CardRow
                      key={`${url}-${index}`}
                      onRemove={() => removeFromList("instagramPosts", index)}
                    >
                      <Field
                        label={`Instagram post ${index + 1}`}
                        onChange={(value) => updateInstagramPost(index, value)}
                        value={url}
                      />
                    </CardRow>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {(content.footer?.links ?? []).map((link, index) => (
                  <LinkRow
                    key={`${link.href}-${index}`}
                    link={link}
                    onChange={(key, value) => updateFooterLink(index, key, value)}
                    onRemove={() => removeFooterLink(index)}
                  />
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "testimonials" ? (
            <EditorSection title="Testimonials" onAdd={addTestimonial}>
              <div className="grid gap-3">
                {(content.testimonials ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.name}-${index}`}
                    onRemove={() => removeFromList("testimonials", index)}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Name"
                        onChange={(value) => updateTestimonial(index, "name", value)}
                        value={item.name}
                      />
                      <Field
                        label="Location"
                        onChange={(value) => updateTestimonial(index, "location", value)}
                        value={item.location ?? ""}
                      />
                    </div>
                    <TextEditor
                      label="Quote"
                      onChange={(value) => updateTestimonial(index, "quote", value)}
                      value={item.quote}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "faqs" ? (
            <EditorSection title="FAQs" onAdd={addFaq}>
              <div className="grid gap-3">
                {(content.faqs ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.question}-${index}`}
                    onRemove={() => removeFromList("faqs", index)}
                  >
                    <Field
                      label="Question"
                      onChange={(value) => updateFaq(index, "question", value)}
                      value={item.question}
                    />
                    <TextEditor
                      label="Answer"
                      onChange={(value) => updateFaq(index, "answer", value)}
                      value={item.answer}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}

          {tab === "policies" ? (
            <EditorSection title="Policy Pages" onAdd={addPolicy}>
              <div className="grid gap-3">
                {(content.policies ?? []).map((item, index) => (
                  <CardRow
                    key={`${item.slug}-${index}`}
                    onRemove={() => removeFromList("policies", index)}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Title"
                        onChange={(value) => updatePolicy(index, "title", value)}
                        value={item.title}
                      />
                      <Field
                        label="Slug"
                        onChange={(value) => updatePolicy(index, "slug", value)}
                        value={item.slug}
                      />
                    </div>
                    <TextEditor
                      label="Body"
                      minHeight="min-h-48"
                      onChange={(value) => updatePolicy(index, "body", value)}
                      value={item.body}
                    />
                  </CardRow>
                ))}
              </div>
            </EditorSection>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EditorSection({
  children,
  onAdd,
  title,
}: Readonly<{ children: React.ReactNode; onAdd: () => void; title: string }>) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
          Add
        </button>
      </div>
      {children}
    </section>
  );
}

function CtaEditor({
  label,
  link,
  onChange,
}: Readonly<{
  label: string;
  link?: CmsLink;
  onChange: (key: keyof CmsLink, value: string | boolean) => void;
}>) {
  return (
    <div className="rounded-md border border-border p-3">
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input
          checked={link?.enabled !== false}
          onChange={(event) => onChange("enabled", event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
      <div className="mt-3 grid gap-2">
        <Field
          label="Label"
          onChange={(value) => onChange("label", value)}
          value={link?.label ?? ""}
        />
        <Field
          label="Href"
          onChange={(value) => onChange("href", value)}
          value={link?.href ?? ""}
        />
      </div>
    </div>
  );
}

function LinkRow({
  link,
  onChange,
  onRemove,
}: Readonly<{
  link: CmsLink;
  onChange: (key: keyof CmsLink, value: string | boolean) => void;
  onRemove: () => void;
}>) {
  return (
    <CardRow onRemove={onRemove}>
      <div className="grid gap-3 md:grid-cols-[120px_1fr_1fr]">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            checked={link.enabled !== false}
            onChange={(event) => onChange("enabled", event.target.checked)}
            type="checkbox"
          />
          Enabled
        </label>
        <Field label="Label" onChange={(value) => onChange("label", value)} value={link.label} />
        <Field label="Href" onChange={(value) => onChange("href", value)} value={link.href} />
      </div>
    </CardRow>
  );
}

function CardRow({
  children,
  onRemove,
}: Readonly<{ children: React.ReactNode; onRemove: () => void }>) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex justify-end">
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2 text-xs font-semibold text-destructive"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" size={13} />
          Remove
        </button>
      </div>
      <div className="mt-2 grid gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  onChange,
  value,
}: Readonly<{ label: string; onChange: (value: string) => void; value: string }>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextEditor({
  label,
  minHeight = "min-h-28",
  onChange,
  value,
}: Readonly<{
  label: string;
  minHeight?: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        className={`mt-1 w-full rounded-md border border-border px-3 py-2 text-sm leading-6 ${minHeight}`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function toMediaReference(
  item: MediaItem,
  fallbackAlt: string,
  aspectRatio = "1:1",
): MediaReference {
  return {
    altText: item.altText ?? fallbackAlt,
    aspectRatio: item.selectedAspectRatio || aspectRatio,
    mediaId: item._id,
    objectFit: "cover",
    type: item.resourceType === "video" ? "video" : "image",
    url: item.secureUrl,
  };
}

function cleanLink(link?: CmsLink): CmsLink | undefined {
  if (!link) {
    return undefined;
  }

  return {
    enabled: link.enabled !== false,
    href: link.href ?? "",
    label: link.label ?? "",
  };
}

function cleanMediaReference(mediaReference?: MediaReference): MediaReference | undefined {
  if (!mediaReference?.url) {
    return undefined;
  }

  return {
    altText: mediaReference.altText,
    aspectRatio: mediaReference.aspectRatio,
    mediaId: mediaReference.mediaId,
    objectFit: mediaReference.objectFit,
    type: mediaReference.type,
    url: mediaReference.url,
  };
}

function cleanHeroSlide(slide: CmsHeroSlide): CmsHeroSlide {
  return {
    copy: slide.copy,
    eyebrow: slide.eyebrow,
    fontFamily: slide.fontFamily ?? "serif",
    fontSize: slide.fontSize ?? "lg",
    media: cleanMediaReference(slide.media),
    primaryCta: cleanLink(slide.primaryCta),
    secondaryCta: cleanLink(slide.secondaryCta),
    textColor: slide.textColor ?? "#ffffff",
    title: slide.title,
  };
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function normalizeContent(content: CmsContent): CmsContent {
  const homeHero = {
    ...defaultCmsContent.home?.hero,
    ...content.home?.hero,
  };
  const aboutPrimaryCta = {
    enabled: true,
    href: "/shop",
    label: "Explore Shop",
    ...defaultCmsContent.about?.primaryCta,
    ...content.about?.primaryCta,
  };

  return {
    title: content.title ?? defaultCmsContent.title,
    status: content.status ?? defaultCmsContent.status,
    footer: {
      brandLogo: cleanMediaReference(
        content.footer?.brandLogo ?? defaultCmsContent.footer?.brandLogo,
      ),
      email: content.footer?.email ?? defaultCmsContent.footer?.email,
      instagramPosts: (
        content.footer?.instagramPosts ??
        defaultCmsContent.footer?.instagramPosts ??
        []
      ).filter(Boolean),
      instagramUrl: content.footer?.instagramUrl ?? defaultCmsContent.footer?.instagramUrl,
      links: (content.footer?.links ?? defaultCmsContent.footer?.links ?? [])
        .map((link) => cleanLink(link))
        .filter(isPresent),
      location: content.footer?.location ?? defaultCmsContent.footer?.location,
      phone: content.footer?.phone ?? defaultCmsContent.footer?.phone,
      tagline: content.footer?.tagline ?? defaultCmsContent.footer?.tagline,
      whatsappUrl: content.footer?.whatsappUrl ?? defaultCmsContent.footer?.whatsappUrl,
    },
    home: {
      announcement: content.home?.announcement ?? defaultCmsContent.home?.announcement,
      hero: {
        copy: homeHero.copy,
        eyebrow: homeHero.eyebrow,
        media: cleanMediaReference(homeHero.media),
        primaryCta: cleanLink(homeHero.primaryCta),
        secondaryCta: cleanLink(homeHero.secondaryCta),
        slides: (homeHero.slides ?? []).map((slide) => cleanHeroSlide(slide)),
        title: homeHero.title,
      },
    },
    about: {
      description: content.about?.description ?? defaultCmsContent.about?.description,
      eyebrow: content.about?.eyebrow ?? defaultCmsContent.about?.eyebrow,
      media: cleanMediaReference(content.about?.media ?? defaultCmsContent.about?.media),
      primaryCta: cleanLink(aboutPrimaryCta),
      storyCopy: content.about?.storyCopy ?? defaultCmsContent.about?.storyCopy,
      storyEyebrow: content.about?.storyEyebrow ?? defaultCmsContent.about?.storyEyebrow,
      storyTitle: content.about?.storyTitle ?? defaultCmsContent.about?.storyTitle,
      title: content.about?.title ?? defaultCmsContent.about?.title,
      values: (content.about?.values ?? defaultCmsContent.about?.values ?? []).map((item) => ({
        icon: item.icon ?? "sparkles",
        text: item.text,
        title: item.title,
      })),
    },
    navigation: (content.navigation ?? []).map((link) => cleanLink(link)).filter(isPresent),
    faqs: (content.faqs ?? []).map((item) => ({
      answer: item.answer,
      question: item.question,
    })),
    policies: (content.policies ?? []).map((item) => ({
      body: item.body,
      slug: item.slug,
      title: item.title,
    })),
    testimonials: (content.testimonials ?? []).map((item) => ({
      location: item.location,
      name: item.name,
      quote: item.quote,
    })),
  };
}
