import { LoaderCircle } from "lucide-react";

export function LoadingState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-5 text-card-foreground">
      <LoaderCircle aria-hidden="true" className="animate-spin text-primary" size={22} />
      <p className="font-medium">{label}</p>
    </div>
  );
}
