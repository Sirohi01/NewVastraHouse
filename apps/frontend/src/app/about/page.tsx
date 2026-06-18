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
      <section className="grid overflow-hidden rounded-md border border-[#e5dac7] bg-[#fffaf1] lg:grid-cols-[42%_58%]">
        <div className="flex items-center p-6 sm:p-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#caa14e]">
              <span className="h-px w-6 bg-[#caa14e]" />
              {about?.storyEyebrow ?? "The Vastra House"}
            </p>
            <h2 className="mt-4 font-serif text-3xl uppercase leading-tight text-[#3d1620]">
              {about?.storyTitle ?? "Clothing that feels rooted, refined, and ready."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6f6256]">
              {about?.storyCopy ??
                "We design for customers who want familiar craft language with a cleaner, more international shopping experience."}
            </p>
            {cta.enabled !== false ? (
              <a
                className="mt-6 inline-flex h-10 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-4 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#84182c]"
                href={cta.href}
              >
                {cta.label} <ArrowRight aria-hidden="true" size={14} />
              </a>
            ) : null}
          </div>
        </div>
        <ResponsiveImage
          alt={about?.media?.altText ?? "The Vastra House embroidered ethnic wear story image"}
          aspectRatio={about?.media?.aspectRatio ?? "16 / 9"}
          className="h-full"
          objectFit={about?.media?.objectFit}
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          src={about?.media?.url ?? "/images/home-hero.jpg"}
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {(about?.values ?? []).map((item) => {
          const Icon = iconMap[item.icon ?? "sparkles"] ?? Sparkles;

          return (
            <article
              className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5 transition-shadow duration-200 hover:shadow-md"
              key={item.title}
            >
              <span className="grid size-12 place-items-center rounded-full border border-[#caa14e] bg-[#fdf6e8]">
                <Icon aria-hidden="true" className="text-[#6e1423]" size={22} />
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6f6256]">{item.text}</p>
            </article>
          );
        })}
      </section>
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
