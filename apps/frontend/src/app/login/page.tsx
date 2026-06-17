"use client";

import { useState } from "react";
import { getGuestSessionId } from "@/lib/commerce";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export default function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Signing in...");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Guest-Session-Id": getGuestSessionId() },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        totpToken: formData.get("totpToken") || undefined,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string; otpauthUrl?: string };
      setMessage(payload.otpauthUrl ?? payload.error ?? "Login failed");
      return;
    }

    const payload = (await response.json()) as LoginResponse;
    setSession(payload);
    setMessage("Signed in");
  }

  return <AuthForm title="Login" action={submit} message={message} includeTotp />;
}

function AuthForm({
  title,
  action,
  message,
  includeTotp = false,
}: Readonly<{
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  includeTotp?: boolean;
}>) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-md items-center px-5 py-10">
      <form action={action} className="w-full rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            className="mt-2 h-11 w-full rounded-md border border-border px-3"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            className="mt-2 h-11 w-full rounded-md border border-border px-3"
            name="password"
            required
            type="password"
          />
        </label>
        {includeTotp ? (
          <label className="mt-4 block text-sm font-medium">
            TOTP
            <input
              className="mt-2 h-11 w-full rounded-md border border-border px-3"
              name="totpToken"
            />
          </label>
        ) : null}
        <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Continue
        </button>
        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </section>
  );
}
