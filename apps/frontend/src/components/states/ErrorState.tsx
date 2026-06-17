import { AlertTriangle } from "lucide-react";

export function ErrorState({ title, message }: Readonly<{ title: string; message: string }>) {
  return (
    <div className="w-full rounded-lg border border-destructive/30 bg-surface p-6 text-foreground shadow-soft">
      <AlertTriangle aria-hidden="true" className="text-destructive" size={26} />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}
