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
    links?: CmsLink[];
    tagline?: string;
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
    tagline: "The Vastra House crafts soft-luxury Indian wear for modern wardrobes.",
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
    body: JSON.stringify(content),
    method: "PUT",
  });
}
