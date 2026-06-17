import { AppProviders } from "@/components/providers/AppProviders";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppProviders>{children}</AppProviders>;
}
