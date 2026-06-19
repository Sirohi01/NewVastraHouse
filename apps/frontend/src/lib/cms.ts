import { apiFetch } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";

export type CmsLink = {
  enabled?: boolean;
  href: string;
  label: string;
};

export type CmsHeroSlide = {
  copy?: string;
  eyebrow?: string;
  fontFamily?: "serif" | "sans";
  fontSize?: "sm" | "md" | "lg";
  media?: MediaReference;
  primaryCta?: CmsLink;
  secondaryCta?: CmsLink;
  textColor?: string;
  title?: string;
};

export type CmsContent = {
  _id?: string;
  key?: string;
  title: string;
  status: "draft" | "published";
  home?: {
    announcement?: string;
    hero?: {
      copy?: string;
      eyebrow?: string;
      media?: MediaReference;
      primaryCta?: CmsLink;
      secondaryCta?: CmsLink;
      slides?: CmsHeroSlide[];
      title?: string;
    };
  };
  about?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    storyEyebrow?: string;
    storyTitle?: string;
    storyCopy?: string;
    media?: MediaReference;
    primaryCta?: CmsLink;
    values?: Array<{
      icon?: "sparkles" | "award" | "shield" | "care";
      title: string;
      text: string;
    }>;
  };
  navigation?: CmsLink[];
  footer?: {
    brandLogo?: MediaReference;
    email?: string;
    instagramPosts?: string[];
    instagramUrl?: string;
    links?: CmsLink[];
    location?: string;
    phone?: string;
    tagline?: string;
    whatsappUrl?: string;
  };
  testimonials?: Array<{ location?: string; name: string; quote: string }>;
  faqs?: Array<{ answer: string; question: string }>;
  policies?: Array<{ body: string; slug: string; title: string }>;
};

export const defaultCmsContent: CmsContent = {
  title: "Primary Website Content",
  status: "published",
  home: {
    announcement: "New festive drops are live.",
    hero: {
      copy: "Soft-luxury Indian wear for celebrations, workdays, and everything between.",
      eyebrow: "The Vastra House",
      primaryCta: { href: "/shop", label: "Shop New Arrivals" },
      secondaryCta: { href: "/pre-order", label: "View Pre-Orders" },
      slides: [],
      title: "Indian wear with a modern calm",
    },
  },
  about: {
    description:
      "The Vastra House brings timeless Indian wear into a polished modern commerce experience, with thoughtful cataloging, reliable operations, and premium presentation.",
    eyebrow: "Our Story",
    primaryCta: { href: "/shop", label: "Explore Shop" },
    storyCopy:
      "We design for customers who want familiar craft language with a cleaner, more international shopping experience. From product media to checkout, each touchpoint is built to feel calm, premium, and practical.",
    storyEyebrow: "The Vastra House",
    storyTitle: "Clothing that feels rooted, refined, and ready.",
    title: "Crafted With Passion, Worn With Pride",
    values: [
      {
        icon: "sparkles",
        text: "Classic Indian silhouettes shaped for daily confidence and occasion dressing.",
        title: "Heritage First",
      },
      {
        icon: "award",
        text: "Every range is planned around fabric handfeel, fall, durability, and finish.",
        title: "Fabric-Led Quality",
      },
      {
        icon: "shield",
        text: "Clear product information, secure checkout, and transparent order tracking.",
        title: "Honest Commerce",
      },
      {
        icon: "care",
        text: "Support workflows are built into the platform from order to return.",
        title: "Customer Care",
      },
    ],
  },
  navigation: [
    { href: "/shop", label: "Shop" },
    { href: "/pre-order", label: "Pre-Order" },
    { href: "/track-order", label: "Track" },
  ],
  footer: {
    brandLogo: undefined,
    email: "hello@thevastrahouse.com",
    instagramPosts: [],
    instagramUrl: "https://www.instagram.com/vastrahouse/",
    location: "India",
    phone: "+91 00000 00000",
    tagline: "The Vastra House crafts soft-luxury Indian wear for modern wardrobes.",
    whatsappUrl: "",
    links: [
      { href: "/return-policy", label: "Return Policy" },
      { href: "/shipping-policy", label: "Shipping Policy" },
    ],
  },
  testimonials: [],
  faqs: [],
  policies: [],
};

export function fetchCmsContent(key: string) {
  return apiFetch<{ content: CmsContent | null }>(`/cms/content/${key}`);
}

export function fetchAdminCmsContent(key: string, accessToken?: string) {
  return apiFetch<{ content: CmsContent | null }>(`/cms/admin/content/${key}`, { accessToken });
}

export function saveAdminCmsContent(key: string, content: CmsContent, accessToken?: string) {
  return apiFetch<{ content: CmsContent }>(`/cms/admin/content/${key}`, {
    accessToken,
    body: JSON.stringify(sanitizeCmsContent(content)),
    method: "PUT",
  });
}

export function sanitizeCmsContent(content: CmsContent): CmsContent {
  const mergedFooter = {
    ...defaultCmsContent.footer,
    ...content.footer,
  };
  const mergedHero = {
    ...defaultCmsContent.home?.hero,
    ...content.home?.hero,
  };
  const mergedAbout = {
    ...defaultCmsContent.about,
    ...content.about,
  };

  return {
    title: content.title ?? defaultCmsContent.title,
    status: content.status ?? defaultCmsContent.status,
    home: {
      announcement: content.home?.announcement ?? defaultCmsContent.home?.announcement,
      hero: {
        copy: mergedHero.copy,
        eyebrow: mergedHero.eyebrow,
        media: sanitizeMediaReference(mergedHero.media),
        primaryCta: sanitizeLink(mergedHero.primaryCta),
        secondaryCta: sanitizeLink(mergedHero.secondaryCta),
        slides: (mergedHero.slides ?? []).map((slide) => ({
          copy: slide.copy,
          eyebrow: slide.eyebrow,
          fontFamily: slide.fontFamily ?? "serif",
          fontSize: slide.fontSize ?? "lg",
          media: sanitizeMediaReference(slide.media),
          primaryCta: sanitizeLink(slide.primaryCta),
          secondaryCta: sanitizeLink(slide.secondaryCta),
          textColor: slide.textColor ?? "#ffffff",
          title: slide.title,
        })),
        title: mergedHero.title,
      },
    },
    about: {
      description: mergedAbout.description,
      eyebrow: mergedAbout.eyebrow,
      media: sanitizeMediaReference(mergedAbout.media),
      primaryCta: sanitizeLink(mergedAbout.primaryCta),
      storyCopy: mergedAbout.storyCopy,
      storyEyebrow: mergedAbout.storyEyebrow,
      storyTitle: mergedAbout.storyTitle,
      title: mergedAbout.title,
      values: (mergedAbout.values ?? []).map((item) => ({
        icon: item.icon ?? "sparkles",
        text: item.text,
        title: item.title,
      })),
    },
    navigation: (content.navigation ?? []).map((link) => sanitizeLink(link)).filter(isPresent),
    footer: {
      brandLogo: sanitizeMediaReference(mergedFooter.brandLogo),
      email: mergedFooter.email,
      instagramPosts: (mergedFooter.instagramPosts ?? []).filter(Boolean),
      instagramUrl: mergedFooter.instagramUrl,
      links: (mergedFooter.links ?? []).map((link) => sanitizeLink(link)).filter(isPresent),
      location: mergedFooter.location,
      phone: mergedFooter.phone,
      tagline: mergedFooter.tagline,
      whatsappUrl: mergedFooter.whatsappUrl,
    },
    testimonials: (content.testimonials ?? []).map((item) => ({
      location: item.location,
      name: item.name,
      quote: item.quote,
    })),
    faqs: (content.faqs ?? []).map((item) => ({
      answer: item.answer,
      question: item.question,
    })),
    policies: (content.policies ?? []).map((item) => ({
      body: item.body,
      slug: item.slug,
      title: item.title,
    })),
  };
}

function sanitizeLink(link?: CmsLink): CmsLink | undefined {
  if (!link) {
    return undefined;
  }

  return {
    enabled: link.enabled !== false,
    href: link.href ?? "",
    label: link.label ?? "",
  };
}

function sanitizeMediaReference(mediaReference?: MediaReference): MediaReference | undefined {
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

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}
