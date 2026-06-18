"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  type: "customer" | "admin";
  email: string;
  firstName?: string;
  lastName?: string;
  roleSlug?: string;
  customerType?: "retail" | "wholesale";
};

type AuthState = {
  accessToken?: string;
  hasHydrated: boolean;
  refreshToken?: string;
  user?: AuthUser;
  setHasHydrated: (value: boolean) => void;
  setSession: (session: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated(value) {
        set({ hasHydrated: value });
      },
      setSession(session) {
        set(session);
      },
      clearSession() {
        set({ accessToken: undefined, refreshToken: undefined, user: undefined });
      },
    }),
    {
      name: "vastra-auth-session",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
