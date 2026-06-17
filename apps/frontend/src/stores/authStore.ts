"use client";

import { create } from "zustand";

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
  refreshToken?: string;
  user?: AuthUser;
  setSession: (session: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  setSession(session) {
    set(session);
  },
  clearSession() {
    set({ accessToken: undefined, refreshToken: undefined, user: undefined });
  },
}));
