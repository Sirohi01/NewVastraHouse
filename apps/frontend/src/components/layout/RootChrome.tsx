"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { CmsContent } from "@/lib/cms";

export function RootChrome({
  children,
  cms,
}: Readonly<{ children: React.ReactNode; cms: CmsContent }>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return children;
  }

  return (
    <>
      <Header cms={cms} />
      <main>{children}</main>
      <Footer cms={cms} />
    </>
  );
}
