export type HomeMedia = {
  src: string;
  alt: string;
  aspectRatio: string;
};

export type HomeCollection = {
  title: string;
  subtitle: string;
  href: string;
  media: HomeMedia;
};

export type HomeProduct = {
  title: string;
  badge: string;
  price: string;
  href: string;
  media: HomeMedia;
};

export type HomeTestimonial = {
  quote: string;
  name: string;
  location: string;
};

export const homeContent = {
  hero: {
    title: "The Vastra House",
    eyebrow: "Soft-luxury Indian wear",
    copy: "Festive silhouettes, everyday comfort, and thoughtful craftsmanship for wardrobes that move beautifully from morning plans to evening celebrations.",
    primaryCta: { label: "Shop New Arrivals", href: "/shop?sort=newest" },
    secondaryCta: { label: "Explore Collections", href: "/collections" },
    media: {
      src: "/images/home-hero.jpg",
      alt: "Textured floral fabric and soft light for The Vastra House storefront",
      aspectRatio: "16 / 9",
    },
  },
  featuredCollections: [
    {
      title: "Festive Edit",
      subtitle: "Rich colors, polished finishes, celebration-ready styling.",
      href: "/collections/festive-edit",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900/sample.jpg",
        alt: "Festive textile detail",
        aspectRatio: "4 / 5",
      },
    },
    {
      title: "Everyday Ease",
      subtitle: "Lightweight sets and breathable fabrics for repeat wear.",
      href: "/collections/everyday-ease",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900/docs/shoes.png",
        alt: "Neutral styling detail",
        aspectRatio: "4 / 5",
      },
    },
    {
      title: "Wedding Guest",
      subtitle: "Drapes, layers, and statement pieces with soft movement.",
      href: "/collections/wedding-guest",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900/docs/models.jpg",
        alt: "Editorial fashion styling",
        aspectRatio: "4 / 5",
      },
    },
  ] satisfies HomeCollection[],
  newArrivals: [
    {
      title: "Wine Silk Kurti Set",
      badge: "New Arrival",
      price: "Rs. 2,499",
      href: "/shop/wine-silk-kurti-set",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/docs/models.jpg",
        alt: "Wine silk kurti set",
        aspectRatio: "4 / 5",
      },
    },
    {
      title: "Ivory Cotton Co-ord",
      badge: "Trending",
      price: "Rs. 1,899",
      href: "/shop/ivory-cotton-coord",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/docs/shoes.png",
        alt: "Ivory cotton co-ord styling",
        aspectRatio: "4 / 5",
      },
    },
    {
      title: "Emerald Dupatta Layer",
      badge: "Limited Edition",
      price: "Rs. 1,299",
      href: "/shop/emerald-dupatta-layer",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/sample.jpg",
        alt: "Emerald dupatta layer",
        aspectRatio: "4 / 5",
      },
    },
    {
      title: "Rose Block Print Dress",
      badge: "Best Seller",
      price: "Rs. 2,199",
      href: "/shop/rose-block-print-dress",
      media: {
        src: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/docs/models.jpg",
        alt: "Rose block print dress",
        aspectRatio: "4 / 5",
      },
    },
  ] satisfies HomeProduct[],
  testimonials: [
    {
      quote:
        "The fabric feels premium without being heavy, and the fit stayed comfortable through a full family function.",
      name: "Ananya S.",
      location: "Jaipur",
    },
    {
      quote:
        "The styling is graceful and practical. I could pair the pieces separately after the event too.",
      name: "Meera K.",
      location: "Delhi",
    },
    {
      quote:
        "Clean finishing, quick delivery, and the colors looked exactly like the product photos.",
      name: "Ritika P.",
      location: "Mumbai",
    },
  ] satisfies HomeTestimonial[],
};
