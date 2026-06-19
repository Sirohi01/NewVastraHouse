"use client";

export type DonutChartSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const RADIUS = 15.9155;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  emptyMessage = "No data yet",
  size = 140,
  slices,
}: Readonly<{ emptyMessage?: string; size?: number; slices: DonutChartSlice[] }>) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return (
      <div
        className="grid place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
        style={{ height: size }}
      >
        {emptyMessage}
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="flex items-center gap-4">
      <svg className="shrink-0" height={size} viewBox="0 0 36 36" width={size}>
        {slices.map((slice) => {
          const fraction = slice.value / total;
          const dashLength = fraction * CIRCUMFERENCE;
          const offset = cumulative * CIRCUMFERENCE;
          cumulative += fraction;

          return (
            <circle
              cx="18"
              cy="18"
              fill="none"
              key={slice.key}
              r={RADIUS}
              stroke={slice.color}
              strokeDasharray={`${dashLength} ${CIRCUMFERENCE - dashLength}`}
              strokeDashoffset={-offset}
              strokeWidth={5}
              transform="rotate(-90 18 18)"
            >
              <title>
                {slice.label}: {slice.value} ({Math.round(fraction * 100)}%)
              </title>
            </circle>
          );
        })}
        <text
          className="fill-foreground"
          dominantBaseline="middle"
          fontSize="6.5"
          fontWeight={600}
          textAnchor="middle"
          x="18"
          y="18"
        >
          {total}
        </text>
      </svg>
      <ul className="grid gap-1.5 text-xs">
        {slices.map((slice) => (
          <li className="flex items-center gap-2" key={slice.key}>
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="font-semibold text-foreground">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
