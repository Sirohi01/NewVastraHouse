"use client";

import { ErrorState } from "@/components/states/ErrorState";

export default function ErrorPage({ error }: Readonly<{ error: Error }>) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-5">
      <ErrorState title="Page failed to load" message={error.message} />
    </section>
  );
}
