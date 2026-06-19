import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { defaultCmsContent, type CmsContent } from "@/lib/cms";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "Shop All", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=-newest" },
      { label: "Best Sellers", href: "/shop?sort=-bestSelling" },
      { label: "Pre-Order", href: "/pre-order" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Customer",
    links: [
      { label: "Cart", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Compare", href: "/compare" },
      { label: "Track Order", href: "/track-order" },
    ],
  },
  {
    title: "Admin & Orders",
    links: [
      { label: "Admin Login", href: "/admin/login" },
      { label: "Checkout", href: "/checkout" },
      { label: "Payments", href: "/payments" },
      { label: "Payment History", href: "/payments/history" },
    ],
  },
];

export function Footer({ cms }: Readonly<{ cms?: CmsContent }>) {
  const content = cms ?? defaultCmsContent;
  const logo = content.footer?.brandLogo;
  const email = content.footer?.email || "hello@thevastrahouse.com";
  const phone = content.footer?.phone || "+91 00000 00000";
  const location = content.footer?.location || "India";
  const instagramUrl = content.footer?.instagramUrl || "/";

  return (
    <footer className="border-t border-[#e5dac7] bg-[#fffaf1]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1.4fr_2fr]">
        <div>
          <a className="inline-block" href="/">
            {logo?.url ? (
              <span className="block w-36">
                <ResponsiveImage
                  alt={logo.altText ?? "The Vastra House logo"}
                  aspectRatio={logo.aspectRatio ?? "1:1"}
                  objectFit={logo.objectFit ?? "contain"}
                  src={logo.url}
                />
              </span>
            ) : (
              <span className="font-serif text-2xl uppercase tracking-[0.18em] text-[#8a6a42]">
                Vastra House
              </span>
            )}
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#6f6256]">
            {content.footer?.tagline ??
              "Thoughtfully made Indian wear with polished details, comfortable fabrics, and occasion-ready styling."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#6f6256]">
            <ContactLink href={`mailto:${email}`} icon={<Mail size={16} />}>
              {email}
            </ContactLink>
            <ContactLink href={`tel:${phone.replace(/\s+/g, "")}`} icon={<Phone size={16} />}>
              {phone}
            </ContactLink>
            <ContactLink href="/track-order" icon={<MapPin size={16} />}>
              {location}
            </ContactLink>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#3b3128]">
                {group.title}
              </h2>
              <nav className="mt-3 grid gap-2 text-sm text-[#6f6256]">
                {group.links.map((link) => (
                  <a className="transition hover:text-primary" href={link.href} key={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e5dac7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-[#6f6256] sm:flex-row sm:items-center sm:justify-between">
          <span>(c) 2026 The Vastra House</span>
          <a
            className="inline-flex items-center gap-2 transition hover:text-primary"
            href={instagramUrl}
            rel="noreferrer"
            target={instagramUrl.startsWith("http") ? "_blank" : undefined}
          >
            <Instagram aria-hidden="true" size={15} />
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}

function ContactLink({
  children,
  href,
  icon,
}: Readonly<{ children: React.ReactNode; href: string; icon: React.ReactNode }>) {
  return (
    <a className="inline-flex items-center gap-2 transition hover:text-primary" href={href}>
      {icon}
      {children}
    </a>
  );
}
