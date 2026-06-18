"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { apiBaseUrl } from "@/lib/api";
import { getGuestSessionId } from "@/lib/commerce";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setMessage("Signing in...");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Session-Id": getGuestSessionId(),
        },
        method: "POST",
      });

      if (!response.ok) {
        setMessage((await response.text()) || "Login failed");
        return;
      }

      const payload = (await response.json()) as LoginResponse;

      if (payload.user.type !== "customer") {
        setMessage("Use the admin login page for admin accounts.");
        return;
      }

      setSession(payload);
      router.push(searchParams.get("redirect") || "/checkout");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicPageFrame
      eyebrow="Account"
      title="Customer Login"
      description="Sign in to checkout, track orders, and keep your cart synced."
    >
      <section className="mx-auto max-w-md">
        <form
          action={submit}
          className="w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck aria-hidden="true" size={19} />
            </span>
            <div>
              <h2 className="font-serif text-2xl uppercase text-[#3d1620]">Sign In</h2>
              <p className="text-sm text-muted-foreground">Customer checkout access</p>
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium">
            Email
            <input
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="password"
              required
              type="password"
            />
          </label>

          <button
            className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Signing in" : "Continue"}
          </button>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <Link className="font-semibold text-primary hover:underline" href="/register">
              Create account
            </Link>
            <Link className="text-muted-foreground hover:text-primary" href="/admin/login">
              Admin login
            </Link>
          </div>

          {message ? <p className="mt-4 text-sm font-semibold text-accent">{message}</p> : null}
        </form>
      </section>
    </PublicPageFrame>
  );
}
