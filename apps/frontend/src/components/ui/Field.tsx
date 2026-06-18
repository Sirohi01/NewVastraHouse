"use client";

export function Field({
  label,
  onChange,
  required,
  type = "text",
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}>) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <input
        className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
