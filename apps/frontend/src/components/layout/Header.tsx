import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

const navItems = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/shop" },
  { label: "Compare", href: "/compare" },
  { label: "Pre-Order", href: "/pre-order" },
  { label: "Blog", href: "/blog" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a className="text-base font-semibold tracking-wide sm:text-lg" href="/">
          The Vastra House
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {navItems.map((item) => (
            <a className="transition hover:text-primary" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <IconLink href="/shop" label="Search">
            <Search aria-hidden="true" size={19} />
          </IconLink>
          <IconLink href="/wishlist" label="Wishlist">
            <Heart aria-hidden="true" size={19} />
          </IconLink>
          <IconLink href="/account" label="Account">
            <UserRound aria-hidden="true" size={19} />
          </IconLink>
          <IconLink href="/cart" label="Cart">
            <ShoppingBag aria-hidden="true" size={19} />
          </IconLink>

          <details className="group relative lg:hidden">
            <summary
              aria-label="Menu"
              className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
              title="Menu"
            >
              <Menu aria-hidden="true" size={20} />
            </summary>
            <nav className="absolute right-0 mt-3 w-56 rounded-lg border border-border bg-card p-2 text-sm font-medium shadow-lifted">
              {navItems.map((item) => (
                <a
                  className="block rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function IconLink({
  children,
  href,
  label,
}: Readonly<{ children: React.ReactNode; href: string; label: string }>) {
  return (
    <a
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
      href={href}
      title={label}
    >
      {children}
    </a>
  );
}
