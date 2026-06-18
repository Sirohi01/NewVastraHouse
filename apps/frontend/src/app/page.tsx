import { ArrowRight, Award, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  getCatalogHome,
  getProductMedia,
  getProductPrice,
  getProductPricing,
  type CatalogProduct,
  type CatalogTile,
  type MediaReference,
} from "@/lib/catalog";
import { fetchCmsContent, type CmsHeroSlide } from "@/lib/cms";
import { homeContent } from "@/lib/cms/homeContent";

export const dynamic = "force-dynamic";

type HomeData = {
  categories: CatalogTile[];
  collections: CatalogTile[];
  products: CatalogProduct[];
};

type VisualTile = {
  title: string;
  subtitle?: string;
  href: string;
  media: {
    alt: string;
    aspectRatio: string;
    src: string;
  };
  pricing?: ReturnType<typeof getProductPricing>;
};

const fallbackHero = homeContent.hero.media.src;

export default async function HomePage() {
  const [data, cms] = await Promise.all([loadHomeData(), loadCmsData()]);
  const productTiles = toProductTiles(data.products);
  const categoryTiles = toTaxonomyTiles(data.categories, "categories");
  const collectionTiles = toTaxonomyTiles(data.collections, "collections");
  const topTiles = [...categoryTiles, ...collectionTiles, ...productTiles].slice(0, 5);
  const heroImage = productTiles[0]?.media.src ?? collectionTiles[0]?.media.src ?? fallbackHero;
  const heroSlides = normalizeHeroSlides(cms?.home?.hero?.slides, cms?.home?.hero, heroImage);
  const storyImage = productTiles[1]?.media.src ?? collectionTiles[1]?.media.src ?? heroImage;
  const socialTiles = [...productTiles, ...categoryTiles, ...collectionTiles].slice(0, 7);

  return (
    <div className="bg-[#fbf7ef] text-[#211f1c]">
      <div className="h-[3px] bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
      <Hero slides={heroSlides} />
      <SquareTileRail tiles={topTiles} />
      <StoryBand image={storyImage} />
      <CollectionGrid tiles={collectionTiles.length ? collectionTiles : categoryTiles} />
      <ProductGrid products={productTiles} />
      <TrustStrip />
      <SocialGrid tiles={socialTiles} />
    </div>
  );
}

async function loadCmsData() {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content;
  } catch {
    return null;
  }
}

async function loadHomeData(): Promise<HomeData> {
  try {
    return await getCatalogHome();
  } catch {
    return {
      categories: [],
      collections: homeContent.featuredCollections.map((item, index) => ({
        _id: `fallback-collection-${index}`,
        banner: {
          altText: item.media.alt,
          aspectRatio: item.media.aspectRatio,
          type: "image",
          url: item.media.src,
        },
        description: item.subtitle,
        name: item.title,
        slug: item.href.split("/").filter(Boolean).at(-1) ?? item.title.toLowerCase(),
      })),
      products: [],
    };
  }
}

const HERO_ASPECT_RATIO = "16 / 5";

function Hero({ slides }: Readonly<{ slides: CmsHeroSlide[] }>) {
  return (
    <section className="relative border-b border-[#e1d6c4]">
      <div className="relative overflow-hidden" style={{ aspectRatio: HERO_ASPECT_RATIO }}>
        {slides.map((slide, index) => (
          <div
            className="absolute inset-0 opacity-0 first:opacity-100"
            key={`${slide.title}-${index}`}
            style={{
              animation: slides.length > 1 ? `heroFade ${slides.length * 6}s infinite` : undefined,
              animationDelay: `${index * 6}s`,
            }}
          >
            {slide.media?.type === "video" ? (
              <video
                aria-label={slide.media.altText ?? slide.title ?? "The Vastra House hero video"}
                autoPlay
                className="size-full object-cover"
                loop
                muted
                playsInline
                src={slide.media.url}
              />
            ) : (
              <ResponsiveImage
                alt={
                  slide.media?.altText ?? "The Vastra House heritage inspired fashion hero banner"
                }
                aspectRatio={HERO_ASPECT_RATIO}
                priority={index === 0}
                sizes="100vw"
                src={slide.media?.url ?? fallbackHero}
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(46_12_18/0.82),rgb(46_12_18/0.46)_48%,rgb(46_12_18/0.1))]" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-5">
            <div
              className={`max-w-xl ${slides[0]?.fontFamily === "sans" ? "" : "font-serif"}`}
              style={{ color: slides[0]?.textColor ?? "#ffffff" }}
            >
              <span className="inline-flex items-center border border-[#caa14e]/70 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0d9a4]">
                {slides[0]?.eyebrow ?? "New Season Edit"}
              </span>
              <h1
                className={`mt-5 font-semibold leading-[1.08] drop-shadow-sm ${heroTitleSize(slides[0]?.fontSize)}`}
              >
                {slides[0]?.title ?? "Timeless Style, Rooted in Heritage"}
              </h1>
              <div className="mt-4 h-px w-20 bg-[#caa14e]" />
              <p className="mt-4 max-w-md font-sans text-sm leading-7 text-white/90 sm:text-base">
                {slides[0]?.copy ?? "Premium tops, suits and clothing crafted for the modern you."}
              </p>
              {slides[0]?.primaryCta?.href ? (
                <a
                  className="mt-6 inline-flex h-11 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-6 font-sans text-sm font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-[#84182c]"
                  href={slides[0].primaryCta.href}
                >
                  {slides[0].primaryCta.label} <ArrowRight aria-hidden="true" size={16} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes heroFade {
          0%, 100% { opacity: 0; }
          4%, 28% { opacity: 1; }
          34%, 96% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}

function SquareTileRail({ tiles }: Readonly<{ tiles: VisualTile[] }>) {
  if (!tiles.length) {
    return null;
  }

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 border-b border-[#e1d6c4] px-5 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <a
          className="group overflow-hidden rounded-sm border border-[#e1d6c4] bg-white transition-shadow duration-200 hover:shadow-md"
          href={tile.href}
          key={tile.href}
        >
          <div className="overflow-hidden">
            <ResponsiveImage
              alt={tile.media.alt}
              aspectRatio="1 / 1"
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 50vw, 20vw"
              src={tile.media.src}
            />
          </div>
          <div className="border-t border-[#e1d6c4] px-3 py-3 text-center">
            <h2 className="font-serif text-lg uppercase">{tile.title}</h2>
            <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b6d35] transition-transform duration-200 group-hover:translate-x-0.5">
              Shop Now <ArrowRight aria-hidden="true" size={14} />
            </span>
          </div>
        </a>
      ))}
    </section>
  );
}

function StoryBand({ image }: Readonly<{ image: string }>) {
  return (
    <section className="grid border-y border-[#e1d6c4] bg-[#fffdf8] lg:grid-cols-[40%_60%]">
      <div className="flex items-center px-6 py-8 lg:justify-center">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b6d35]">
            Our Story
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
            Crafted with Passion, Worn with Pride.
          </h2>
          <div className="my-4 h-px w-48 bg-[#bd9b6a]" />
          <p className="text-sm leading-6 text-muted-foreground">
            We blend timeless tradition with contemporary designs to bring premium quality clothing
            that celebrates your individuality.
          </p>
          <a
            className="mt-5 inline-flex h-10 items-center gap-2 border border-[#6e1423] px-4 text-xs font-semibold uppercase tracking-wide text-[#6e1423] transition-colors duration-200 hover:bg-[#6e1423] hover:text-white"
            href="/about"
          >
            Know More About Us <ArrowRight aria-hidden="true" size={14} />
          </a>
        </div>
      </div>
      <ResponsiveImage
        alt="Wide embroidered fabric detail for The Vastra House story"
        aspectRatio="16 / 7"
        className="h-full"
        sizes="(max-width: 1024px) 100vw, 60vw"
        src={image}
      />
    </section>
  );
}

function CollectionGrid({ tiles }: Readonly<{ tiles: VisualTile[] }>) {
  if (!tiles.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 pb-4 pt-2">
      <SectionTitle title="Our Collections" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tiles.slice(0, 3).map((tile) => (
          <a
            className="group relative block overflow-hidden rounded-sm"
            href={tile.href}
            key={tile.href}
          >
            <ResponsiveImage
              alt={tile.media.alt}
              aspectRatio="1 / 1"
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              src={tile.media.src}
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(32_22_12/0.78),transparent_62%)]" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <h3 className="font-serif text-2xl uppercase leading-tight">{tile.title}</h3>
              <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-transform duration-200 group-hover:translate-x-0.5">
                Explore Collection <ArrowRight aria-hidden="true" size={14} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ProductGrid({ products }: Readonly<{ products: VisualTile[] }>) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 pb-4 pt-2">
      <SectionTitle title="New Arrivals" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <a
            className="group rounded-sm border border-[#e1d6c4] bg-white p-2.5 transition-shadow duration-200 hover:shadow-md"
            href={product.href}
            key={product.href}
          >
            <div className="relative overflow-hidden">
              <ResponsiveImage
                alt={product.media.alt}
                aspectRatio="1 / 1"
                className="transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 25vw"
                src={product.media.src}
              />
              {product.pricing?.hasSale ? (
                <span className="absolute left-2 top-2 rounded-sm bg-[#6e1423] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Sale
                </span>
              ) : null}
            </div>
            <div className="pt-2.5">
              <h3 className="font-medium">{product.title}</h3>
              {product.subtitle ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-[#3d2a18]">
                    {product.pricing?.price ?? product.subtitle}
                  </span>
                  {product.pricing?.hasSale ? (
                    <>
                      <span className="text-muted-foreground line-through">
                        {product.pricing.original}
                      </span>
                      <span className="text-xs font-semibold uppercase text-[#6e1423]">
                        {product.pricing.discountPercent}% Off
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Award, label: "Premium Quality", text: "Fine fabrics and careful craftsmanship" },
    { icon: PackageCheck, label: "Timeless Designs", text: "Classic styles for repeat wear" },
    { icon: Truck, label: "Free Shipping", text: "On orders above Rs. 1999" },
    { icon: RotateCcw, label: "Easy Returns", text: "Hassle-free return support" },
    { icon: ShieldCheck, label: "Secure Payments", text: "Safe checkout experience" },
  ];

  return (
    <section className="mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 py-3">
      <div className="grid gap-0 rounded-sm border border-[#e1d6c4] bg-white md:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="border-[#e1d6c4] p-4 text-center md:border-r last:md:border-r-0"
              key={item.label}
            >
              <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#caa14e] bg-[#fdf6e8]">
                <Icon aria-hidden="true" className="text-[#6e1423]" size={22} />
              </span>
              <h3 className="mt-3 text-sm font-semibold uppercase">{item.label}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SocialGrid({ tiles }: Readonly<{ tiles: VisualTile[] }>) {
  if (!tiles.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-4 pt-2">
      <h2 className="text-center text-base font-semibold uppercase tracking-wide">
        Follow Us @VastraHouse
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map((tile) => (
          <div className="overflow-hidden" key={tile.href}>
            <ResponsiveImage
              alt={tile.media.alt}
              aspectRatio="1 / 1"
              className="transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 50vw, 14vw"
              src={tile.media.src}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title }: Readonly<{ title: string }>) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 text-[#caa14e]">
        <span className="h-px w-10 bg-[#caa14e]" />
        <span>✦</span>
        <span className="h-px w-10 bg-[#caa14e]" />
      </div>
      <h2 className="mt-2 font-serif text-2xl uppercase tracking-[0.06em] text-[#3d1620]">
        {title}
      </h2>
    </div>
  );
}

function normalizeHeroSlides(
  slides: CmsHeroSlide[] | undefined,
  hero: CmsHeroSlide | undefined,
  fallbackImage: string,
): CmsHeroSlide[] {
  const source = slides?.length ? slides : hero ? [hero] : [];

  if (!source.length) {
    return [
      {
        copy: "Premium tops, suits and clothing crafted for the modern you.",
        eyebrow: "New Season Edit",
        fontFamily: "serif",
        fontSize: "lg",
        media: {
          altText: "The Vastra House heritage inspired fashion hero banner",
          aspectRatio: "16:9",
          type: "image",
          url: fallbackImage,
        },
        primaryCta: { enabled: true, href: "/shop", label: "Shop New Arrivals" },
        textColor: "#ffffff",
        title: "Timeless Style, Rooted in Heritage",
      },
    ];
  }

  return source.map((slide) => ({
    ...slide,
    fontFamily: slide.fontFamily ?? "serif",
    fontSize: slide.fontSize ?? "lg",
    media: slide.media ?? {
      altText: slide.title ?? "The Vastra House hero banner",
      aspectRatio: "16:9",
      type: "image",
      url: fallbackImage,
    },
    textColor: slide.textColor ?? "#ffffff",
  }));
}

function heroTitleSize(size: CmsHeroSlide["fontSize"]) {
  if (size === "sm") {
    return "text-3xl sm:text-4xl";
  }

  if (size === "md") {
    return "text-4xl sm:text-5xl";
  }

  return "text-4xl sm:text-5xl lg:text-6xl";
}

function toProductTiles(products: CatalogProduct[]): VisualTile[] {
  return products.map((product) => {
    const media = getProductMedia(product)[0];

    return {
      href: `/shop/${product.slug}`,
      media: normalizeMedia(media, product.name),
      pricing: getProductPricing(product),
      subtitle: getProductPrice(product),
      title: product.name,
    };
  });
}

function toTaxonomyTiles(
  items: CatalogTile[],
  routePrefix: "categories" | "collections",
): VisualTile[] {
  return items.map((item) => ({
    href: `/${routePrefix}/${item.slug}`,
    media: normalizeMedia(item.banner, item.name),
    subtitle: item.description,
    title: item.name,
  }));
}

function normalizeMedia(media: MediaReference | undefined, fallbackAlt: string) {
  return {
    alt: media?.altText || fallbackAlt,
    aspectRatio: "1 / 1",
    src: media?.url || fallbackHero,
  };
}
