"use client";

import { Heart, Menu, Search, ShoppingBag, Truck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { commerceFetch, type Cart } from "@/lib/commerce";
import type { CmsContent } from "@/lib/cms";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const navItems = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=-newest" },
  { label: "Best Sellers", href: "/shop?sort=-bestSelling" },
  { label: "About", href: "/about" },
  { label: "Pre-Order", href: "/pre-order" },
  { label: "Track Order", href: "/track-order" },
];

const leftNavItems = navItems.slice(0, 3);
const rightNavItems = navItems.slice(3);
const actionItems = [
  { icon: Search, label: "Search", href: "/shop" },
  { icon: UserRound, label: "Admin Login", href: "/admin/login" },
  { icon: Heart, label: "Wishlist", href: "/wishlist" },
  { icon: ShoppingBag, label: "Cart", href: "/cart" },
];

export function Header({ cms }: Readonly<{ cms?: CmsContent }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const itemCount = useCartStore((state) => state.itemCount);
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    async function hydrateCartCount() {
      try {
        const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart", { accessToken });
        setCart(payload.cart);
      } catch {
        // Header should never block navigation if a guest cart cannot be loaded.
      }
    }

    void hydrateCartCount();
  }, [accessToken, setCart]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5dac7] bg-[#fffaf1]/96 backdrop-blur">
      <div className="bg-[#3a250f] text-[#fff7e8]">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-5 text-[11px] font-semibold uppercase tracking-wide">
          <span>Free shipping on orders above Rs. 1999</span>
          <div className="hidden items-center gap-4 normal-case tracking-normal md:flex">
            <a className="inline-flex items-center gap-1" href="/track-order">
              <Truck aria-hidden="true" size={13} />
              Track Order
            </a>

            <span className="text-white/35">|</span>
            <div className="flex items-center gap-1">
              {actionItems.map((item) => (
                <HeaderActionItem item={item} itemCount={itemCount} key={item.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 xl:grid xl:h-20 xl:grid-cols-[1fr_auto_1fr] xl:gap-5">
        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-wide text-[#3b3128] xl:flex">
          {leftNavItems.map((item) => (
            <a className="transition hover:text-primary" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="grid min-w-0 place-items-start text-left leading-none xl:min-w-48 xl:place-items-center xl:text-center"
          href="/"
        >
          {cms?.footer?.brandLogo?.url ? (
            <span className="block w-28 xl:w-32">
              <ResponsiveImage
                alt={cms.footer.brandLogo.altText ?? "The Vastra House logo"}
                aspectRatio={cms.footer.brandLogo.aspectRatio ?? "1:1"}
                objectFit={cms.footer.brandLogo.objectFit ?? "contain"}
                src={cms.footer.brandLogo.url}
              />
            </span>
          ) : (
            <>
              <span className="block font-serif text-3xl uppercase tracking-[0.18em] text-[#8a6a42] sm:text-4xl">
                Vastra
              </span>
              <span className="block pl-1 text-[9px] font-semibold uppercase tracking-[0.45em] text-[#8a6a42] sm:text-[10px] xl:pl-0">
                House
              </span>
            </>
          )}
        </a>

        <div className="flex items-center justify-end gap-3">
          <nav className="mr-3 hidden items-center gap-8 text-xs font-semibold uppercase tracking-wide text-[#3b3128] xl:flex">
            {rightNavItems.map((item) => (
              <a className="transition hover:text-primary" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>

          <details className="group relative xl:hidden">
            <summary
              aria-label="Menu"
              className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-foreground transition hover:text-primary"
              title="Menu"
            >
              <Menu aria-hidden="true" size={21} />
            </summary>
            <nav className="absolute right-0 mt-3 w-60 rounded-md border border-border bg-card p-2 text-sm font-medium shadow-lifted">
              {navItems.map((item) => (
                <a
                  className="block rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
              <div className="my-2 h-px bg-border" />
              {actionItems.map((item) => (
                <HeaderActionItem
                  item={item}
                  itemCount={itemCount}
                  key={item.label}
                  variant="mobile"
                />
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function HeaderActionItem({
  item,
  itemCount,
  variant = "top",
}: Readonly<{
  item: (typeof actionItems)[number];
  itemCount: number;
  variant?: "mobile" | "top";
}>) {
  const Icon = item.icon;
  const showBadge = item.label === "Cart" && itemCount > 0;

  if (variant === "mobile") {
    return (
      <a
        className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
        href={item.href}
      >
        <span className="inline-flex items-center gap-3">
          <Icon aria-hidden="true" size={17} />
          {item.label}
        </span>
        {showBadge ? (
          <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {itemCount}
          </span>
        ) : null}
      </a>
    );
  }

  return (
    <a
      aria-label={item.label}
      className="relative inline-flex size-7 items-center justify-center transition hover:text-[#d8b66d]"
      href={item.href}
      title={item.label}
    >
      <Icon aria-hidden="true" size={15} />
      {showBadge ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#d8b66d] px-1 text-[10px] font-bold leading-4 text-[#2b1a09]">
          {itemCount}
        </span>
      ) : null}
    </a>
  );
}
