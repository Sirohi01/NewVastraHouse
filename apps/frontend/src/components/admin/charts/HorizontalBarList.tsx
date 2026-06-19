"use client";

export type HorizontalBarItem = {
  key: string;
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
};

export function HorizontalBarList({
  emptyMessage = "No data yet",
  formatValue = (value) => String(value),
  items,
}: Readonly<{
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  items: HorizontalBarItem[];
}>) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="grid gap-2.5">
      {items.map((item) => (
        <div className="grid gap-1" key={item.key}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 font-semibold text-foreground">
              {formatValue(item.value)}
            </span>
          </div>
          {item.sublabel ? (
            <span className="text-[11px] text-muted-foreground">{item.sublabel}</span>
          ) : null}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: item.color ?? "var(--color-primary)",
                width: `${Math.max(4, (item.value / maxValue) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
