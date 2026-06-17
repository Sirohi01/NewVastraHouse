import { Instagram, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Festive Edit", href: "/collections/festive-edit" },
      { label: "Pre-Order", href: "/pre-order" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/returns" },
      { label: "Wash Care", href: "/policies/wash-care" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-strong">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <a className="text-lg font-semibold" href="/">
            The Vastra House
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Thoughtfully made Indian wear with polished details, comfortable fabrics, and
            occasion-ready styling.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <ContactLink href="mailto:hello@thevastrahouse.com" icon={<Mail size={16} />}>
              hello@thevastrahouse.com
            </ContactLink>
            <ContactLink href="tel:+910000000000" icon={<Phone size={16} />}>
              +91 00000 00000
            </ContactLink>
            <ContactLink href="/contact" icon={<MapPin size={16} />}>
              India
            </ContactLink>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <nav className="mt-3 grid gap-2 text-sm text-muted-foreground">
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

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 The Vastra House</span>
          <a
            className="inline-flex items-center gap-2 transition hover:text-primary"
            href="/social"
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
