"use client";

export function Textarea({
  label,
  onChange,
  required,
  rows = 4,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  value: string;
}>) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <textarea
        className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
        value={value}
      />
    </label>
  );
}
