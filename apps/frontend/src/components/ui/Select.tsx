"use client";

export function Select({
  label,
  onChange,
  options,
  required,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="block text-xs font-medium">
      {label}
      <select
        className="mt-1 h-9 w-full rounded-md border border-border px-2.5 text-sm"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
