"use client";

import { useState } from "react";

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
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-md items-center px-5 py-10">
      <form action={submit} className="w-full rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <input
          className="mt-6 h-11 w-full rounded-md border border-border px-3"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Send Reset
        </button>
        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </section>
  );
}
