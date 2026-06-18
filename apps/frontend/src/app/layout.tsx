import type { Metadata } from "next";
import { RootChrome } from "@/components/layout/RootChrome";
import { AppProviders } from "@/components/providers/AppProviders";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Vastra House",
  description: "Soft-luxury Indian wear, festive edits, and everyday occasion pieces.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cms = await loadCms();

  return (
    <html lang="en">
      <body>
        <AppProviders>
          <RootChrome cms={cms}>{children}</RootChrome>
        </AppProviders>
      </body>
    </html>
  );
}

async function loadCms() {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content ?? defaultCmsContent;
  } catch {
    return defaultCmsContent;
  }
}
