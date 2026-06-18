"use client";

import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function OtpPage() {
  const [message, setMessage] = useState("");

  async function requestOtp(formData: FormData) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: formData.get("target"), purpose: formData.get("purpose") }),
    });
    setMessage(response.ok ? "OTP prepared" : "OTP request failed");
  }

  return (
    <PublicPageFrame
      eyebrow="Verification"
      title="OTP Verification"
      description="Request a one-time password for account and sensitive customer actions."
    >
      <section className="mx-auto max-w-md">
        <form
          action={requestOtp}
          className="w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6"
        >
          <h2 className="font-serif text-2xl uppercase text-[#3d1620]">OTP Verification</h2>
          <input
            className="mt-6 h-11 w-full rounded-md border border-border px-3"
            name="target"
            placeholder="Email or phone"
            required
          />
          <select className="mt-4 h-11 w-full rounded-md border border-border px-3" name="purpose">
            <option value="registration">Registration</option>
            <option value="login">Login</option>
            <option value="password-reset">Password reset</option>
            <option value="sensitive-action">Sensitive action</option>
          </select>
          <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Request OTP
          </button>
          {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </section>
    </PublicPageFrame>
  );
}
