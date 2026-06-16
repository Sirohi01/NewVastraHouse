import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: Readonly<{ title: string; message: string }>) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <Inbox aria-hidden="true" className="text-muted-foreground" size={26} />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  );
}
