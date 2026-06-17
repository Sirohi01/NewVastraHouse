import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { homeContent, type HomeCollection, type HomeProduct } from "@/lib/cms/homeContent";

export const dynamic = "force-static";

export default function HomePage() {
  try {
    if (!homeContent.featuredCollections.length || !homeContent.newArrivals.length) {
      return (
        <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Home content unavailable"
            message="Seed storefront content is empty."
          />
        </section>
      );
    }

    return (
      <div className="bg-background">
        <HeroSection />
        <FeaturedCollections collections={homeContent.featuredCollections} />
        <NewArrivals products={homeContent.newArrivals} />
        <Testimonials />
        <Newsletter />
      </div>
    );
  } catch (error) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Home page could not load"
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </section>
    );
  }
}

function HeroSection() {
  const { hero } = homeContent;

  return (
    <section className="relative min-h-[calc(100svh-72px)] overflow-hidden">
      <ResponsiveImage
        alt={hero.media.alt}
        aspectRatio={hero.media.aspectRatio}
        className="absolute inset-0 h-full"
        priority
        sizes="100vw"
        src={hero.media.src}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(33_31_28/0.78),rgb(33_31_28/0.28)_52%,rgb(33_31_28/0.1))]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-primary-foreground">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.04] sm:text-6xl lg:text-7xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/88 sm:text-lg">
            {hero.copy}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </CtaLink>
            <CtaLink href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCollections({ collections }: Readonly<{ collections: HomeCollection[] }>) {
  return (
    <section className="px-4 py-section sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Collections"
          title="Designed around the way your calendar fills up"
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {collections.map((collection) => (
            <a
              className="group overflow-hidden rounded-lg border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
              href={collection.href}
              key={collection.href}
            >
              <ResponsiveImage
                alt={collection.media.alt}
                aspectRatio={collection.media.aspectRatio}
                sizes="(max-width: 768px) 100vw, 33vw"
                src={collection.media.src}
              />
              <div className="p-5">
                <h3 className="text-lg font-semibold">{collection.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                  {collection.subtitle}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  View Collection <ArrowRight aria-hidden="true" size={16} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewArrivals({ products }: Readonly<{ products: HomeProduct[] }>) {
  return (
    <section className="bg-surface-strong px-4 py-section sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="New Arrivals" title="Fresh pieces with ready-to-wear polish" />
          <a
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            href="/shop"
          >
            Shop All <ArrowRight aria-hidden="true" size={16} />
          </a>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <a
              className="group rounded-lg border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
              href={product.href}
              key={product.href}
            >
              <ResponsiveImage
                alt={product.media.alt}
                aspectRatio={product.media.aspectRatio}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                src={product.media.src}
              />
              <div className="pt-4">
                <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-semibold text-primary">
                  {product.badge}
                </span>
                <h3 className="mt-3 font-semibold">{product.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.price}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-4 py-section sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Reviews" title="Loved for comfort after the compliments" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {homeContent.testimonials.map((testimonial) => (
            <figure
              className="rounded-lg border border-border bg-card p-5 shadow-soft"
              key={testimonial.name}
            >
              <Sparkles aria-hidden="true" className="text-secondary" size={22} />
              <blockquote className="mt-4 text-sm leading-6 text-muted-foreground">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold">
                {testimonial.name}
                <span className="block font-normal text-muted-foreground">
                  {testimonial.location}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="px-4 pb-section sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-border bg-primary p-6 text-primary-foreground shadow-lifted md:grid-cols-[1fr_420px] md:items-center md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Newsletter
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">
            First look at drops and edits
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/85">
            Seasonal launches, limited editions, and styling notes from The Vastra House.
          </p>
        </div>
        <form
          action="/newsletter"
          className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Email
          </label>
          <input
            className="h-12 min-w-0 flex-1 rounded-md border border-primary-foreground/25 bg-primary-foreground px-3 text-foreground outline-none focus:border-secondary"
            id="newsletter-email"
            name="email"
            placeholder="Email address"
            required
            type="email"
          />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-secondary px-4 font-semibold text-secondary-foreground">
            <Mail aria-hidden="true" size={18} />
            Join
          </button>
        </form>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: Readonly<{ eyebrow: string; title: string }>) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function CtaLink({
  children,
  href,
  variant,
}: Readonly<{ children: React.ReactNode; href: string; variant: "primary" | "secondary" }>) {
  const className =
    variant === "primary"
      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
      : "border border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/18";

  return (
    <a
      className={`inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-semibold transition ${className}`}
      href={href}
    >
      {children}
    </a>
  );
}
