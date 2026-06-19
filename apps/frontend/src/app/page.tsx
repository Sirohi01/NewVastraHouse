import {
  ArrowRight,
  Award,
  Instagram,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { InstagramMarquee } from "@/components/home/InstagramMarquee";
import { PreOrderAnnouncementModal } from "@/components/home/PreOrderAnnouncementModal";
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
  sizes?: string[];
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
  const storyImage =
    cms?.home?.storyMedia?.url ??
    productTiles[1]?.media.src ??
    collectionTiles[1]?.media.src ??
    heroImage;
  const storyImageAlt =
    cms?.home?.storyMedia?.altText ?? "Wide embroidered fabric detail for The Vastra House story";
  const socialTiles = [...productTiles, ...categoryTiles, ...collectionTiles].slice(0, 7);
  const instagramPosts = cms?.footer?.instagramPosts?.filter(Boolean) ?? [];

  return (
    <div className="relative bg-[#fbf7ef] text-[#211f1c]">
      <PreOrderAnnouncementModal />
      <DamaskBackdrop />
      <div className="relative">
        <div className="h-[3px] bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
        <div className="flex items-center justify-center gap-2 border-b border-[#e1d6c4] bg-[#fffdf8] py-1.5 text-[#9b6d35]">
          <span className="h-px w-6 bg-[#caa14e]/70" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em]">
            The Vastra House
          </span>
          <span className="h-px w-6 bg-[#caa14e]/70" />
        </div>
        <Hero slides={heroSlides} />
        <SquareTileRail tiles={topTiles} />
        <StoryBand image={storyImage} imageAlt={storyImageAlt} />
        <CollectionGrid tiles={collectionTiles.length ? collectionTiles : categoryTiles} />
        <ProductGrid products={productTiles} />
        <TrustStrip />
        <SocialGrid instagramPosts={instagramPosts} tiles={socialTiles} />
      </div>
      <style>{`
        @keyframes heroFade {
          0%, 100% { opacity: 0; }
          4%, 28% { opacity: 1; }
          34%, 96% { opacity: 0; }
        }
        @keyframes royalRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes instaMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="heroFade"], .royal-rise { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
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

const HERO_ASPECT_RATIO = "16 / 7";
const TALL_TILE_ASPECT_RATIO = "9 / 16";

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
                quality={95}
                sizes="100vw"
                src={slide.media?.url ?? fallbackHero}
                unoptimized
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(46_12_18/0.58),rgb(46_12_18/0.28)_48%,rgb(46_12_18/0.04))]" />

        {/* Royal inset frame + corner filigree */}
        <div className="pointer-events-none absolute inset-3 border border-[#caa14e]/45 sm:inset-5 md:inset-6">
          <div className="absolute inset-[3px] border border-[#caa14e]/20" />
          <CornerFiligree className="absolute -left-px -top-px text-[#caa14e]/80" />
          <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#caa14e]/80" />
          <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#caa14e]/80" />
          <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#caa14e]/80" />
        </div>

        <div className="absolute inset-0 hidden items-center md:flex">
          <div className="mx-auto w-full max-w-7xl px-8 sm:px-12">
            <div
              className={`royal-rise max-w-xl ${slides[0]?.fontFamily === "sans" ? "" : "font-serif"}`}
              style={{
                color: slides[0]?.textColor ?? "#ffffff",
                animation: "royalRise 0.9s ease-out both",
              }}
            >
              <span className="inline-flex items-center gap-2 border border-[#caa14e]/70 bg-[#2e0c12]/40 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f0d9a4] backdrop-blur-sm">
                <span aria-hidden="true" className="text-[#caa14e]">
                  ❖
                </span>
                {slides[0]?.eyebrow ?? "New Season Edit"}
              </span>
              <h1
                className={`mt-5 font-semibold leading-[1.06] drop-shadow-sm ${heroTitleSize(slides[0]?.fontSize)}`}
              >
                {slides[0]?.title ?? "Timeless Style, Rooted in Heritage"}
              </h1>
              <div className="mt-5 flex items-center gap-2">
                <span className="h-px w-16 bg-[#caa14e]" />
                <span aria-hidden="true" className="text-xs text-[#caa14e]">
                  ✦
                </span>
                <span className="h-px w-8 bg-[#caa14e]/60" />
              </div>
              <p className="mt-4 max-w-md font-sans text-sm leading-7 text-white/90 sm:text-base">
                {slides[0]?.copy ?? "Premium tops, suits and clothing crafted for the modern you."}
              </p>
              {slides[0]?.primaryCta?.href ? (
                <a
                  className="group relative mt-7 inline-flex h-12 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-7 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-12px_rgba(46,12,18,0.9)] transition-colors duration-200 hover:bg-[#84182c]"
                  href={slides[0].primaryCta.href}
                >
                  <span className="absolute left-1 top-1 size-1.5 border-l border-t border-[#f0d9a4]/70" />
                  <span className="absolute bottom-1 right-1 size-1.5 border-b border-r border-[#f0d9a4]/70" />
                  {slides[0].primaryCta.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    size={16}
                  />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SquareTileRail({ tiles }: Readonly<{ tiles: VisualTile[] }>) {
  if (!tiles.length) {
    return null;
  }

  return (
    <section className="border-b border-[#e1d6c4] px-5 py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-2 text-center sm:mb-6">
          <FiligreeDivider align="center" />
          <h2 className="font-serif text-2xl uppercase tracking-[0.08em] text-[#3d1620] sm:text-[28px]">
            Shop The Edit
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
            Curated categories, collections, and pre-order favourites for a refined wardrobe.
          </p>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-1">
          <div className="grid min-w-max grid-cols-5 gap-3 lg:min-w-0">
            {tiles.map((tile) => (
              <a
                className="group relative w-44 overflow-hidden rounded-sm border border-[#e1d6c4] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#caa14e] hover:shadow-[0_14px_30px_-18px_rgba(110,20,35,0.55)] sm:w-52 lg:w-auto"
                href={tile.href}
                key={tile.href}
              >
                <div className="overflow-hidden">
                  <ResponsiveImage
                    alt={tile.media.alt}
                    aspectRatio={TALL_TILE_ASPECT_RATIO}
                    className="transition-transform duration-500 group-hover:scale-105"
                    sizes="208px"
                    src={tile.media.src}
                  />
                  <span className="pointer-events-none absolute inset-2 border border-white/0 transition-colors duration-200 group-hover:border-[#caa14e]/60" />
                </div>
                <div className="border-t border-[#e1d6c4] px-3 py-3 text-center">
                  <h2 className="font-serif text-lg uppercase tracking-wide text-[#3d1620]">
                    {tile.title}
                  </h2>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b6d35] transition-transform duration-200 group-hover:translate-x-0.5">
                    Shop Now <ArrowRight aria-hidden="true" size={14} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryBand({ image, imageAlt }: Readonly<{ image: string; imageAlt: string }>) {
  return (
    <section className="grid border-y border-[#e1d6c4] bg-[#fffdf8] lg:grid-cols-[40%_60%]">
      <div className="flex items-center px-6 py-10 lg:justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-[#9b6d35]">
            <span aria-hidden="true" className="text-sm text-[#caa14e]">
              ❖
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]">Our Story</p>
          </div>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-[#3d1620] sm:text-4xl">
            Crafted with Passion, Worn with Pride.
          </h2>
          <FiligreeDivider align="start" className="my-5" />
          <p className="text-sm leading-7 text-muted-foreground">
            We blend timeless tradition with contemporary designs to bring premium quality clothing
            that celebrates your individuality.
          </p>
          <a
            className="mt-6 inline-flex h-10 items-center gap-2 border border-[#6e1423] px-5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6e1423] transition-colors duration-200 hover:bg-[#6e1423] hover:text-white"
            href="/about"
          >
            Know More About Us <ArrowRight aria-hidden="true" size={14} />
          </a>
        </div>
      </div>
      <div className="relative">
        <ResponsiveImage
          alt={imageAlt}
          aspectRatio="16 / 7"
          sizes="(max-width: 1024px) 100vw, 60vw"
          src={image}
        />
        <span className="pointer-events-none absolute inset-4 border border-[#caa14e]/40" />
      </div>
    </section>
  );
}

function CollectionGrid({ tiles }: Readonly<{ tiles: VisualTile[] }>) {
  if (!tiles.length) {
    return null;
  }

  return (
    <section className="relative z-0 isolate mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 pb-6 pt-5">
      <SectionTitle title="Our Collections" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {tiles.slice(0, 3).map((tile) => (
          <a
            className="group relative block overflow-hidden rounded-sm"
            href={tile.href}
            key={tile.href}
          >
            <div className="relative aspect-[4/5] max-h-[430px] overflow-hidden md:aspect-[5/6]">
              <ResponsiveImage
                alt={tile.media.alt}
                aspectRatio="5 / 6"
                className="z-0 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                src={tile.media.src}
              />
              <div className="absolute inset-0 z-10 bg-[linear-gradient(0deg,rgb(32_22_12/0.82),transparent_56%)]" />
              {/* Signature: cusped ogee arch window (jharokha) */}
              <ArchMatte className="absolute inset-0 z-20" />
              <div className="absolute bottom-0 left-0 z-30 p-6 text-white">
                <h3 className="font-serif text-2xl uppercase leading-tight tracking-wide pl-2">
                  {tile.title}
                </h3>
                <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f0d9a4] transition-transform duration-200 group-hover:translate-x-0.5 pl-2">
                  Explore Collection <ArrowRight aria-hidden="true" size={14} />
                </span>
              </div>
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
    <section className="mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 pb-8 pt-6">
      <SectionTitle title="New Arrivals" />
      <div className="mt-6 overflow-hidden">
        <div className="flex w-max animate-[instaMarquee_34s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
          {[...products.slice(0, 8), ...products.slice(0, 8)].map((product, index) => (
            <a
              className="group relative w-60 shrink-0 rounded-sm border border-[#e1d6c4] bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#caa14e] hover:shadow-[0_16px_34px_-20px_rgba(110,20,35,0.6)] sm:w-72"
              href={product.href}
              key={`${product.href}-${index}`}
            >
              <div className="relative overflow-hidden">
                <ResponsiveImage
                  alt={product.media.alt}
                  aspectRatio={TALL_TILE_ASPECT_RATIO}
                  className="transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 25vw"
                  src={product.media.src}
                />
                <span className="pointer-events-none absolute inset-1.5 border border-white/0 transition-colors duration-200 group-hover:border-[#caa14e]/55" />
                {product.pricing?.hasSale ? (
                  <span className="absolute left-2 top-2 rounded-sm border border-[#f0d9a4]/50 bg-[#6e1423] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                    Sale
                  </span>
                ) : null}
                {product.sizes?.length ? (
                  <div className="absolute inset-x-2 bottom-2 translate-y-2 rounded-sm border border-[#caa14e]/50 bg-white/95 px-2 py-2 opacity-0 shadow-soft transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9b6d35]">
                      Sizes
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.sizes.map((size) => (
                        <span
                          className="grid min-w-7 place-items-center rounded-sm border border-[#e1d6c4] px-1.5 py-0.5 text-[11px] font-semibold text-[#3d1620]"
                          key={size}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="pt-3">
                <h3 className="font-serif text-[15px] font-medium text-[#3d1620]">
                  {product.title}
                </h3>
                {product.subtitle ? (
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
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
    <section className="mx-auto max-w-7xl border-b border-[#e1d6c4] px-5 py-6">
      <div className="grid gap-0 rounded-sm border border-[#e1d6c4] bg-[linear-gradient(180deg,#fffdf8,#fdf6e8)] md:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="border-[#e1d6c4] p-5 text-center md:border-r last:md:border-r-0"
              key={item.label}
            >
              <span className="relative mx-auto flex size-12 items-center justify-center rounded-full border border-[#caa14e] bg-[#fdf6e8] shadow-[inset_0_0_0_3px_rgba(202,161,78,0.18)]">
                <Icon aria-hidden="true" className="text-[#6e1423]" size={22} />
              </span>
              <h3 className="mt-3 font-serif text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
                {item.label}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SocialGrid({
  instagramPosts,
  tiles,
}: Readonly<{ instagramPosts: string[]; tiles: VisualTile[] }>) {
  if (!tiles.length && !instagramPosts.length) {
    return null;
  }

  const tileItems = [...tiles, ...tiles];

  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-6">
      <div className="flex items-center justify-center gap-3 text-[#caa14e]">
        <span className="h-px w-8 bg-[#caa14e]/70" />
        <h2 className="text-center text-base font-semibold uppercase tracking-[0.18em] text-[#3d1620]">
          Follow Us @VastraHouse
        </h2>
        <span className="h-px w-8 bg-[#caa14e]/70" />
      </div>
      {instagramPosts.length ? (
        <InstagramMarquee posts={instagramPosts} />
      ) : (
        <div className="mt-5 overflow-hidden">
          <div className="flex w-max animate-[instaMarquee_28s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
            {tileItems.map((tile, index) => (
              <a
                className="group relative block w-36 shrink-0 overflow-hidden rounded-sm border border-[#e1d6c4] bg-white sm:w-40"
                href={tile.href}
                key={`${tile.href}-${index}`}
              >
                <ResponsiveImage
                  alt={tile.media.alt}
                  aspectRatio={TALL_TILE_ASPECT_RATIO}
                  className="transition-transform duration-500 group-hover:scale-110"
                  sizes="160px"
                  src={tile.media.src}
                />
                <span className="absolute inset-0 grid place-items-center bg-[#2e0c12]/0 text-white transition-colors duration-200 group-hover:bg-[#2e0c12]/35">
                  <Instagram aria-hidden="true" className="opacity-0 group-hover:opacity-100" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SectionTitle({ title }: Readonly<{ title: string }>) {
  return (
    <div className="text-center">
      <FiligreeDivider align="center" />
      <h2 className="mt-3 font-serif text-2xl uppercase tracking-[0.08em] text-[#3d1620] sm:text-[28px]">
        {title}
      </h2>
    </div>
  );
}

/* ---------- Royal ornamental helpers (presentational only) ---------- */

function FiligreeDivider({
  align = "center",
  className = "",
}: Readonly<{ align?: "center" | "start"; className?: string }>) {
  return (
    <div
      className={`flex items-center gap-2 text-[#caa14e] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
    >
      <span className="h-px w-10 bg-[linear-gradient(90deg,transparent,#caa14e)]" />
      <svg aria-hidden="true" height="14" viewBox="0 0 56 14" width="56">
        <path
          d="M2 7c8-6 14-6 18 0-4 6-10 6-18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="28" cy="7" fill="#6e1423" r="2.4" />
        <path
          d="M54 7c-8-6-14-6-18 0 4 6 10 6 18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="h-px w-10 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="34"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="34"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}

function ArchMatte({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg aria-hidden="true" className={className} preserveAspectRatio="none" viewBox="0 0 400 500">
      {/* Cream matte everywhere except a cusped ogee arch window */}
      <path
        d="M0 0 H400 V500 H0 Z M30 476 L30 210 C30 110 150 130 200 34 C250 130 370 110 370 210 L370 476 Z"
        fill="#fbf7ef"
        fillRule="evenodd"
      />
      {/* Gold arch outline (double rule) */}
      <path
        d="M30 476 L30 210 C30 110 150 130 200 34 C250 130 370 110 370 210 L370 476"
        fill="none"
        stroke="#caa14e"
        strokeWidth="3"
      />
      <path
        d="M40 476 L40 214 C40 122 152 140 200 50 C248 140 360 122 360 214 L360 476"
        fill="none"
        stroke="#caa14e"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
    </svg>
  );
}

function DamaskBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #6e1423 1px, transparent 0), radial-gradient(circle at 21px 21px, #caa14e 1.4px, transparent 0)",
        backgroundSize: "42px 42px",
      }}
    />
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
          aspectRatio: "16:7",
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
      aspectRatio: "16:7",
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
      sizes: [...new Set(product.variants.map((variant) => variant.size).filter(isString))],
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
    aspectRatio: TALL_TILE_ASPECT_RATIO,
    src: media?.url || fallbackHero,
  };
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}
