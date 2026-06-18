"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

export function useSession() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const persistedUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["session", accessToken],
    enabled: hasHydrated && Boolean(accessToken),
    initialData: persistedUser,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<AuthUser> => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Session could not be loaded");
      }

      const payload = (await response.json()) as { user: AuthUser };
      return payload.user;
    },
  });
}
