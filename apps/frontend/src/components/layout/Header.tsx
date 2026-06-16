import { Heart, Menu, Search, ShoppingBag } from "lucide-react";

const navItems = ["Shop", "Collections", "Pre-Order", "Blog"];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5">
        <a className="text-lg font-semibold" href="/">
          The Vastra House
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <a key={item} href="#">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <IconButton label="Search">
            <Search size={19} />
          </IconButton>
          <IconButton label="Wishlist">
            <Heart size={19} />
          </IconButton>
          <IconButton label="Cart">
            <ShoppingBag size={19} />
          </IconButton>
          <IconButton className="md:hidden" label="Menu">
            <Menu size={20} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  className = "",
}: Readonly<{ children: React.ReactNode; label: string; className?: string }>) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-primary hover:text-primary ${className}`}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
