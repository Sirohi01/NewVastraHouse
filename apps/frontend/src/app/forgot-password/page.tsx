"use client";

import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    await fetch(`${apiBaseUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    });
    setMessage("If an account exists, reset instructions have been prepared.");
  }

  return (
    <PublicPageFrame
      eyebrow="Account"
      title="Forgot Password"
      description="Request reset instructions for your customer account."
    >
      <section className="mx-auto max-w-md">
        <form
          action={submit}
          className="w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6"
        >
          <h2 className="font-serif text-2xl uppercase text-[#3d1620]">Forgot Password</h2>
          <input
            className="mt-6 h-11 w-full rounded-md border border-border px-3"
            name="email"
            placeholder="Email"
            required
            type="email"
          />
          <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Send Reset
          </button>
          {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </section>
    </PublicPageFrame>
  );
}
