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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbf7ef] px-4 py-8 text-[#211f1c] sm:px-5">
      {/* Ambient royal glows + faint damask lattice */}
      <div
        aria-hidden="true"
        className="vh-drift pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-[#6e1423]/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="vh-drift-slow pointer-events-none absolute -bottom-24 -right-16 size-[420px] rounded-full bg-[#caa14e]/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #6e1423 1px, transparent 0), radial-gradient(circle at 21px 21px, #caa14e 1.4px, transparent 0)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="vh-rise relative w-full max-w-6xl">
        <div className="h-[3px] rounded-t bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
        <section className="grid w-full overflow-hidden rounded-b-md border border-x border-b border-[#e5dac7] bg-[#fffdf8] shadow-[0_30px_80px_-40px_rgba(46,12,18,0.55)] lg:grid-cols-[1.08fr_440px]">
          {/* Brand / maroon panel */}
          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#842033] p-7 text-white sm:p-10 lg:min-h-[620px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.12),transparent_42%),linear-gradient(0deg,rgb(42_24_12/0.24),transparent)]" />

            {/* Gold inset frame + corner filigree */}
            <div className="pointer-events-none absolute inset-4 border border-[#d8b66d]/35 sm:inset-6">
              <CornerFiligree className="absolute -left-px -top-px text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#e4c17b]/85" />
            </div>

            <div className="relative">
              <div className="vh-glow relative inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10">
                <ShieldCheck aria-hidden="true" className="text-[#d8b66d]" size={28} />
              </div>
              <p className="relative mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#e4c17b]">
                Vastra House Admin
              </p>
              <h1 className="relative mt-4 max-w-xl font-serif text-4xl uppercase leading-tight sm:text-5xl">
                Secure Operations Console
              </h1>
              <div className="relative mt-5 flex items-center gap-2">
                <span
                  className="vh-sweep h-px w-24 rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(90deg,transparent,#e4c17b,transparent)",
                    backgroundSize: "200% 100%",
                  }}
                />
                <span aria-hidden="true" className="text-xs text-[#e4c17b]">
                  ✦
                </span>
              </div>
              <p className="relative mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
                Manage products, orders, inventory, payments, returns, pre-orders, and CMS content
                from one role-protected workspace.
              </p>
            </div>

            <div className="relative mt-8 grid gap-3 text-sm text-white/78 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <LockKeyhole aria-hidden="true" className="text-[#d8b66d]" size={16} />
                Protected access
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles aria-hidden="true" className="text-[#d8b66d]" size={16} />
                Premium workspace
              </span>
            </div>
          </div>

          {/* Form panel */}
          <form action={submit} className="flex flex-col justify-center p-6 sm:p-9">
            <div className="vh-field" style={{ animationDelay: "0.05s" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a2713f]">
                Sign in
              </p>
              <h2 className="mt-3 font-serif text-3xl uppercase text-[#2c231d]">Admin Login</h2>
              <div className="mt-3 flex items-center gap-2 text-[#caa14e]">
                <span className="h-px w-8 bg-[#caa14e]" />
                <span aria-hidden="true" className="text-[10px]">
                  ❖
                </span>
                <span className="h-px w-4 bg-[#caa14e]/60" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6f6256]">
                Use your admin credentials to open the dashboard.
              </p>
            </div>

            <label
              className="vh-field mt-7 text-sm font-medium text-[#2c231d]"
              style={{ animationDelay: "0.12s" }}
            >
              Email
              <input
                className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                name="email"
                required
                type="email"
              />
            </label>

            <label
              className="vh-field mt-4 text-sm font-medium text-[#2c231d]"
              style={{ animationDelay: "0.18s" }}
            >
              Password
              <input
                className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                name="password"
                required
                type="password"
              />
            </label>

            {needsTotpCode ? (
              <label className="vh-field mt-4 text-sm font-medium text-[#2c231d]">
                TOTP Code
                <input
                  className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 tracking-[0.4em] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                  inputMode="numeric"
                  maxLength={6}
                  name="totpToken"
                  placeholder="6 digits"
                />
              </label>
            ) : null}

            {totpSetupUrl ? (
              <div className="vh-field mt-4 space-y-3 rounded-md border border-[#ecd9b3] bg-[#fdf6e8] p-3">
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
              className="group vh-field relative mt-6 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-md bg-[#842033] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#6e1423] disabled:opacity-70"
              disabled={submitting}
              style={{ animationDelay: "0.24s" }}
            >
              <span className="pointer-events-none absolute left-1.5 top-1.5 size-1.5 border-l border-t border-[#e4c17b]/70" />
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 size-1.5 border-b border-r border-[#e4c17b]/70" />
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  Signing in
                  <span className="inline-flex gap-1">
                    <span className="vh-dot size-1.5 rounded-full bg-[#e4c17b]" />
                    <span
                      className="vh-dot size-1.5 rounded-full bg-[#e4c17b]"
                      style={{ animationDelay: "0.16s" }}
                    />
                    <span
                      className="vh-dot size-1.5 rounded-full bg-[#e4c17b]"
                      style={{ animationDelay: "0.32s" }}
                    />
                  </span>
                </span>
              ) : (
                "Continue"
              )}
            </button>

            {message ? (
              <p
                aria-live="polite"
                className="vh-field mt-4 break-words rounded-md border border-[#e1d6c4] bg-[#fffdf8] px-3 py-2 text-sm text-muted-foreground"
                role="status"
              >
                {message}
              </p>
            ) : null}
          </form>
        </section>
      </div>

      <style>{`
        @keyframes vhRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vhFieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vhSweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes vhGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(216,182,109,0); } 50% { box-shadow: 0 0 0 6px rgba(216,182,109,0.16); } }
        @keyframes vhDrift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(16px,-12px); } }
        @keyframes vhDriftSlow { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-18px,14px); } }
        @keyframes vhDots { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }

        .vh-rise { animation: vhRise 0.7s ease-out both; }
        .vh-field { animation: vhFieldIn 0.6s ease-out both; }
        .vh-sweep { animation: vhSweep 3.2s linear infinite; }
        .vh-glow { animation: vhGlow 2.6s ease-in-out infinite; }
        .vh-drift { animation: vhDrift 11s ease-in-out infinite; }
        .vh-drift-slow { animation: vhDriftSlow 13s ease-in-out infinite; }
        .vh-dot { animation: vhDots 1.1s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .vh-rise, .vh-field, .vh-sweep, .vh-glow, .vh-drift, .vh-drift-slow, .vh-dot {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="34"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="34"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
