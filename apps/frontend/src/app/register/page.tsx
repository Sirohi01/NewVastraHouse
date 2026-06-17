"use client";

import { useState } from "react";

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
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-md items-center px-5 py-10">
      <form action={submit} className="w-full rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Register</h1>
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
        <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Create Account
        </button>
        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </section>
  );
}
