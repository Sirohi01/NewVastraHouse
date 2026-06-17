"use client";

import { useState } from "react";

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
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-md items-center px-5 py-10">
      <form action={requestOtp} className="w-full rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">OTP Verification</h1>
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
        <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Request OTP
        </button>
        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </section>
  );
}
