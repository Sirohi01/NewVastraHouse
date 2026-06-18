"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  ContactRound,
  Factory,
  FileText,
  Gift,
  Globe2,
  Home,
  Image,
  KeyRound,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Percent,
  ReceiptText,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Truck,
  UserCog,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

type EnabledItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type DisabledItem = {
  icon: LucideIcon;
  label: string;
  phase: string;
};

type SidebarSection<TItem> = {
  items: TItem[];
  label: string;
};

const enabledSections: SidebarSection<EnabledItem>[] = [
  {
    label: "Live Workspace",
    items: [
      { href: "/admin", icon: Home, label: "Dashboard" },
      { href: "/admin/products", icon: ShoppingBag, label: "Products" },
      { href: "/admin/catalog", icon: Layers3, label: "Catalog" },
      { href: "/admin/media", icon: Image, label: "Media Library" },
      { href: "/admin/inventory", icon: Boxes, label: "Inventory" },
      { href: "/admin/orders", icon: ClipboardList, label: "Orders" },
      { href: "/admin/payments", icon: WalletCards, label: "Payments" },
      { href: "/admin/returns", icon: RotateCcw, label: "Returns" },
      { href: "/admin/pre-orders", icon: Package, label: "Pre-Orders" },
      { href: "/admin/content", icon: FileText, label: "CMS Content" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const plannedSections: SidebarSection<DisabledItem>[] = [
  {
    label: "Commerce & Content",
    items: [
      { icon: Globe2, label: "SEO Management", phase: "Phase 18" },
      { icon: FileText, label: "Blog System", phase: "Phase 20" },
      { icon: FileText, label: "Static / Policy Pages", phase: "Phase 26" },
      { icon: Search, label: "Search & Discovery", phase: "Docs Module 20" },
      { icon: Store, label: "Wholesale / B2B", phase: "Phase 25" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Factory, label: "Manufacturing", phase: "Phase 16" },
      { icon: ReceiptText, label: "Invoicing", phase: "Phase 17" },
      { icon: Truck, label: "Logistics / Courier", phase: "Docs Module 24" },
      { icon: Bell, label: "Notifications", phase: "Phase 21" },
      { icon: LifeBuoy, label: "Support / Helpdesk", phase: "Docs Module 22" },
    ],
  },
  {
    label: "Customers & Growth",
    items: [
      { icon: Users, label: "CRM / Customers", phase: "Phase 22" },
      { icon: ContactRound, label: "Customer Account Admin", phase: "Phase 27" },
      { icon: Megaphone, label: "Marketing Automation", phase: "Phase 23" },
      { icon: Percent, label: "Coupons", phase: "Phase 23" },
      { icon: Gift, label: "Loyalty / Gift Cards", phase: "Phase 24" },
    ],
  },
  {
    label: "Platform & Governance",
    items: [
      { icon: BarChart3, label: "Analytics & Reports", phase: "Phase 28" },
      { icon: UserCog, label: "Roles / Users", phase: "Docs Module 11" },
      { icon: KeyRound, label: "Admin Sessions", phase: "Phase 29" },
      { icon: ShieldAlert, label: "Fraud & Risk", phase: "Docs Module 21" },
      { icon: LockKeyhole, label: "Data Privacy", phase: "Docs Module 23" },
      { icon: Shield, label: "Audit Logs", phase: "Phase 29" },
      { icon: Building2, label: "Company / GST Settings", phase: "Docs Module 11" },
      { icon: SlidersHorizontal, label: "Notification Templates", phase: "Phase 21" },
    ],
  },
];

function NavContent({
  onNavigate,
  pathname,
}: Readonly<{ onNavigate?: () => void; pathname: string }>) {
  return (
    <>
      {enabledSections.map((section) => (
        <div key={section.label}>
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </p>
          {section.items.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <a
                className={`mb-0.5 flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <Icon aria-hidden="true" size={16} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight aria-hidden="true" size={14} />
              </a>
            );
          })}
        </div>
      ))}

      <p className="mt-3 px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Planned From Docs
      </p>
      {plannedSections.map((section) => (
        <div className="mb-1.5" key={section.label}>
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase text-muted-foreground/70">
            {section.label}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className="mb-0.5 flex h-7 w-full cursor-not-allowed items-center gap-2 rounded-md px-2.5 text-left text-[12px] font-semibold text-muted-foreground/45"
                disabled
                key={item.label}
                title={`${item.label} is planned in ${item.phase}`}
                type="button"
              >
                <Icon aria-hidden="true" size={15} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="text-[9px] font-bold uppercase text-muted-foreground/40">
                  {item.phase}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-[#fffdf9] lg:block">
        <div className="flex h-12 items-center border-b border-border px-3">
          <a className="leading-tight" href="/admin">
            <span className="block text-sm font-semibold">The Vastra House</span>
            <span className="block text-[10px] font-medium uppercase text-muted-foreground">
              Admin
            </span>
          </a>
        </div>
        <nav className="h-[calc(100vh-48px)] overflow-y-auto px-2 py-2.5">
          <NavContent pathname={pathname} />
        </nav>
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/35" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] overflow-y-auto border-r border-border bg-[#fffdf9] px-2 py-2.5 shadow-lifted">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-sm font-semibold">The Vastra House Admin</span>
              <button
                aria-label="Close menu"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setMobileNavOpen(false)}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="rotate-180" size={18} />
              </button>
            </div>
            <NavContent onNavigate={() => setMobileNavOpen(false)} pathname={pathname} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-white/92 px-3 backdrop-blur sm:px-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              className="inline-flex size-8 items-center justify-center rounded-md border border-border lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" size={16} />
            </button>
            <a className="font-semibold lg:hidden" href="/admin">
              Admin
            </a>
            <div className="hidden text-sm text-muted-foreground lg:block">
              Operations workspace
            </div>
          </div>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-sm font-semibold"
            onClick={() => clearSession()}
            type="button"
          >
            <LogOut aria-hidden="true" size={15} />
            Logout
          </button>
        </header>
        <main className="px-3 py-3 sm:px-4 lg:px-5">{children}</main>
      </div>
    </div>
  );
}
