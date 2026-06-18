"use client";

import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function RegisterPage() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Creating account...");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
      }),
    });

    setMessage(response.ok ? "Account created. Verify email next." : "Registration failed");
  }

  return (
    <PublicPageFrame
      eyebrow="Account"
      title="Create Account"
      description="Create your customer account for faster checkout and order tracking."
    >
      <section className="mx-auto max-w-md">
        <form
          action={submit}
          className="w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6"
        >
          <h2 className="font-serif text-2xl uppercase text-[#3d1620]">Register</h2>
          <input
            className="mt-6 h-11 w-full rounded-md border border-border px-3"
            name="firstName"
            placeholder="First name"
          />
          <input
            className="mt-4 h-11 w-full rounded-md border border-border px-3"
            name="lastName"
            placeholder="Last name"
          />
          <input
            className="mt-4 h-11 w-full rounded-md border border-border px-3"
            name="email"
            placeholder="Email"
            required
            type="email"
          />
          <input
            className="mt-4 h-11 w-full rounded-md border border-border px-3"
            name="password"
            placeholder="Password"
            required
            type="password"
          />
          <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Create Account
          </button>
          {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </section>
    </PublicPageFrame>
  );
}
