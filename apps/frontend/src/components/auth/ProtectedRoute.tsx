"use client";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { useSession } from "@/hooks/useSession";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProtectedRoute({
  adminOnly = false,
  children,
}: Readonly<{ adminOnly?: boolean; children: React.ReactNode }>) {
  const session = useSession();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const pathname = usePathname();

  if (!hasHydrated || session.isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (session.isError || !session.data) {
    const loginHref = adminOnly
      ? "/admin/login"
      : `/login?redirect=${encodeURIComponent(pathname)}`;

    return (
      <div className="grid gap-4">
        <ErrorState title="Authentication required" message="Please sign in to continue." />
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href={loginHref}
          >
            Sign in
          </Link>
          {!adminOnly ? (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold"
              href="/register"
            >
              Create account
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (adminOnly && session.data.type !== "admin") {
    return <ErrorState title="Admin access required" message="Use an admin account to continue." />;
  }

  return children;
}
