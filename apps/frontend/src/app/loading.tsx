import { LoadingState } from "@/components/states/LoadingState";

export default function Loading() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-5">
      <LoadingState label="Checking platform health" />
    </section>
  );
}
