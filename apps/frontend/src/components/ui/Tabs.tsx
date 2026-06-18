"use client";

export type TabItem<T extends string> = { label: string; value: T };

export function Tabs<T extends string>({
  active,
  items,
  onChange,
}: Readonly<{ active: T; items: readonly TabItem<T>[]; onChange: (value: T) => void }>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1" role="tablist">
      {items.map((item) => (
        <button
          aria-selected={active === item.value}
          className={`h-8 rounded px-3 text-xs font-semibold transition ${
            active === item.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          key={item.value}
          onClick={() => onChange(item.value)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
