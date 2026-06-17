"use client";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { useSession } from "@/hooks/useSession";

export function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = useSession();

  if (session.isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (session.isError || !session.data) {
    return <ErrorState title="Authentication required" message="Please sign in to continue." />;
  }

  return children;
}
