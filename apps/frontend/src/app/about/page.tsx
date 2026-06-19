import { ArrowRight, Award, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { defaultCmsContent, fetchCmsContent, type CmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  care: HeartHandshake,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

export default async function AboutPage() {
  const content = await loadAboutContent();
  const about = content.about ?? defaultCmsContent.about;
  const cta = about?.primaryCta ?? { href: "/shop", label: "Explore Shop" };

  return (
    <PublicPageFrame
      eyebrow={about?.eyebrow ?? "Our Story"}
      title={about?.title ?? "Crafted With Passion, Worn With Pride"}
      description={
        about?.description ??
        "The Vastra House brings timeless Indian wear into a polished modern commerce experience."
      }
    >
      <section className="overflow-hidden rounded-md border border-[#e5dac7] bg-[#fffaf1] shadow-[0_24px_60px_-44px_rgba(46,12,18,0.5)]">
        <div className="h-[3px] bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
        <div className="grid lg:grid-cols-[42%_58%]">
          <div className="flex items-center p-6 sm:p-8">
            <div className="vh-rise">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6d35]">
                <span aria-hidden="true" className="text-sm text-[#caa14e]">
                  ❖
                </span>
                {about?.storyEyebrow ?? "The Vastra House"}
              </p>
              <h2 className="mt-4 font-serif text-3xl uppercase leading-tight text-[#3d1620] sm:text-[34px]">
                {about?.storyTitle ?? "Clothing that feels rooted, refined, and ready."}
              </h2>
              <FiligreeDivider align="start" className="my-5" />
              <p className="text-sm leading-7 text-[#6f6256]">
                {about?.storyCopy ??
                  "We design for customers who want familiar craft language with a cleaner, more international shopping experience."}
              </p>
              {cta.enabled !== false ? (
                <a
                  className="group relative mt-7 inline-flex h-11 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#84182c]"
                  href={cta.href}
                >
                  <span className="pointer-events-none absolute left-1 top-1 size-1.5 border-l border-t border-[#f0d9a4]/70" />
                  <span className="pointer-events-none absolute bottom-1 right-1 size-1.5 border-b border-r border-[#f0d9a4]/70" />
                  {cta.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    size={14}
                  />
                </a>
              ) : null}
            </div>
          </div>
          <div className="relative min-h-[260px]">
            <ResponsiveImage
              alt={about?.media?.altText ?? "The Vastra House embroidered ethnic wear story image"}
              aspectRatio={about?.media?.aspectRatio ?? "16 / 9"}
              className="h-full"
              objectFit={about?.media?.objectFit}
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              src={about?.media?.url ?? "/images/home-hero.jpg"}
            />
            <span className="pointer-events-none absolute inset-4 border border-[#caa14e]/40" />
            <CornerFiligree className="pointer-events-none absolute left-3 top-3 text-[#caa14e]/80" />
            <CornerFiligree className="pointer-events-none absolute right-3 top-3 rotate-90 text-[#caa14e]/80" />
            <CornerFiligree className="pointer-events-none absolute bottom-3 right-3 rotate-180 text-[#caa14e]/80" />
            <CornerFiligree className="pointer-events-none absolute bottom-3 left-3 -rotate-90 text-[#caa14e]/80" />
          </div>
        </div>
      </section>

      {(about?.values ?? []).length ? (
        <section className="mt-10">
          <div className="text-center">
            <FiligreeDivider align="center" />
            <h2 className="mt-3 font-serif text-2xl uppercase tracking-[0.08em] text-[#3d1620]">
              What We Stand For
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {(about?.values ?? []).map((item) => {
              const Icon = iconMap[item.icon ?? "sparkles"] ?? Sparkles;

              return (
                <article
                  className="group relative rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#caa14e] hover:shadow-[0_16px_34px_-22px_rgba(110,20,35,0.6)]"
                  key={item.title}
                >
                  <span className="grid size-12 place-items-center rounded-full border border-[#caa14e] bg-[#fdf6e8] shadow-[inset_0_0_0_3px_rgba(202,161,78,0.18)]">
                    <Icon aria-hidden="true" className="text-[#6e1423]" size={22} />
                  </span>
                  <h3 className="mt-4 font-serif text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f6256]">{item.text}</p>
                  <span className="pointer-events-none absolute right-3 top-3 text-xs text-[#caa14e]/0 transition-colors duration-200 group-hover:text-[#caa14e]/70">
                    ✦
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <style>{`
        @keyframes vhRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .vh-rise { animation: vhRise 0.7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .vh-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </PublicPageFrame>
  );
}

async function loadAboutContent(): Promise<CmsContent> {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content ?? defaultCmsContent;
  } catch {
    return defaultCmsContent;
  }
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
      height="30"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="30"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
