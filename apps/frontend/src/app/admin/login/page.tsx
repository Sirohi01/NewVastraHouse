"use client";

import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getGuestSessionId } from "@/lib/commerce";
import { apiBaseUrl } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type TotpSetupResponse = {
  error?: string;
  otpauthUrl?: string;
  totpSecret?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("");
  const [needsTotpCode, setNeedsTotpCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totpSetupKey, setTotpSetupKey] = useState("");
  const [totpSetupUrl, setTotpSetupUrl] = useState("");

  async function submit(formData: FormData) {
    setSubmitting(true);
    setMessage("Checking secure admin login...");

    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const totpToken = String(formData.get("totpToken") ?? "");

      if (totpSetupUrl && totpToken.length === 6) {
        const setupResponse = await fetch(`${apiBaseUrl}/auth/admin/totp/enable`, {
          body: JSON.stringify({ email, password, totpToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!setupResponse.ok) {
          const payload = (await setupResponse.json()) as TotpSetupResponse;
          if (payload.otpauthUrl) {
            setTotpSetupUrl(payload.otpauthUrl);
            setNeedsTotpCode(true);
          }
          if (payload.totpSecret) {
            setTotpSetupKey(payload.totpSecret);
          }
          setMessage(payload.error ?? "TOTP setup failed");
          return;
        }
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        body: JSON.stringify({
          email,
          password,
          totpToken: totpToken || undefined,
        }),
        headers: { "Content-Type": "application/json", "X-Guest-Session-Id": getGuestSessionId() },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as TotpSetupResponse;
        if (payload.otpauthUrl) {
          setTotpSetupUrl(payload.otpauthUrl);
          setNeedsTotpCode(true);
        }
        if (payload.totpSecret) {
          setTotpSetupKey(payload.totpSecret);
        }
        setMessage(
          payload.otpauthUrl
            ? "TOTP setup required. Add the setup key below to your authenticator app, then submit the 6-digit code."
            : (payload.error ?? "Admin login failed"),
        );
        if ((payload.error ?? "").toLowerCase().includes("totp")) {
          setNeedsTotpCode(true);
        }
        return;
      }

      const payload = (await response.json()) as LoginResponse;
      if (payload.user.type !== "admin") {
        setMessage("This login is only for admin users.");
        return;
      }

      setSession(payload);
      setNeedsTotpCode(false);
      setTotpSetupKey("");
      setTotpSetupUrl("");
      router.push("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#fbf7ef] px-5 py-8">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-md border border-[#e5dac7] bg-[#fffdf8] shadow-lifted lg:grid-cols-[1.08fr_440px]">
        <div className="relative flex min-h-[620px] flex-col justify-between overflow-hidden bg-[#842033] p-8 text-white sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.12),transparent_42%),linear-gradient(0deg,rgb(42_24_12/0.24),transparent)]" />
          <div>
            <div className="relative inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10">
              <ShieldCheck aria-hidden="true" className="text-[#d8b66d]" size={28} />
            </div>
            <p className="relative mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#e4c17b]">
              Vastra House Admin
            </p>
            <h1 className="relative mt-4 max-w-xl font-serif text-5xl uppercase leading-tight">
              Secure Operations Console
            </h1>
            <p className="relative mt-5 max-w-lg text-base leading-8 text-white/82">
              Manage products, orders, inventory, payments, returns, pre-orders, and CMS content
              from one role-protected workspace.
            </p>
          </div>
          <div className="relative grid gap-3 text-sm text-white/78 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole aria-hidden="true" size={16} />
              Protected access
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles aria-hidden="true" size={16} />
              Premium workspace
            </span>
          </div>
        </div>
        <form action={submit} className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a2713f]">
            Sign in
          </p>
          <h2 className="mt-3 font-serif text-3xl uppercase text-[#2c231d]">Admin Login</h2>
          <p className="mt-3 text-sm leading-6 text-[#6f6256]">
            Use your admin credentials to open the dashboard.
          </p>
          <label className="mt-7 text-sm font-medium text-[#2c231d]">
            Email
            <input
              className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition focus:border-[#a2713f]"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="mt-4 text-sm font-medium text-[#2c231d]">
            Password
            <input
              className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition focus:border-[#a2713f]"
              name="password"
              required
              type="password"
            />
          </label>
          {needsTotpCode ? (
            <label className="mt-4 text-sm font-medium text-[#2c231d]">
              TOTP Code
              <input
                className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition focus:border-[#a2713f]"
                inputMode="numeric"
                maxLength={6}
                name="totpToken"
                placeholder="6 digits"
              />
            </label>
          ) : null}
          {totpSetupUrl ? (
            <div className="mt-4 space-y-3">
              {totpSetupKey ? (
                <label className="block text-sm font-medium text-[#2c231d]">
                  Manual setup key
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-[#e1d6c4] bg-white px-3 font-mono text-xs"
                    readOnly
                    value={totpSetupKey}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-medium text-[#2c231d]">
                Authenticator setup URL
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-[#e1d6c4] bg-white px-3 py-2 text-xs"
                  readOnly
                  value={totpSetupUrl}
                />
              </label>
            </div>
          ) : null}
          <button
            className="mt-6 h-12 rounded-md bg-[#842033] px-4 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Signing in" : "Continue"}
          </button>
          {message ? (
            <p className="mt-4 break-words text-sm text-muted-foreground">{message}</p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
