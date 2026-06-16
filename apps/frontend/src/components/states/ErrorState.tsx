import { AlertTriangle } from "lucide-react";

export function ErrorState({ title, message }: Readonly<{ title: string; message: string }>) {
  return (
    <div className="w-full rounded-lg border border-red-200 bg-white p-6 text-red-950 shadow-sm">
      <AlertTriangle aria-hidden="true" className="text-red-700" size={26} />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
    </div>
  );
}
