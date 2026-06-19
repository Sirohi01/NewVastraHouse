"use client";

export type AreaLineChartPoint = {
  label: string;
  value: number;
};

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 36;
const TOP_PADDING = 4;

export function AreaLineChart({
  color = "var(--color-primary)",
  data,
  formatValue = (value) => String(value),
  height = 160,
}: Readonly<{
  color?: string;
  data: AreaLineChartPoint[];
  formatValue?: (value: number) => string;
  height?: number;
}>) {
  if (!data.length) {
    return (
      <div
        className="grid place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const stepX = data.length > 1 ? VIEW_WIDTH / (data.length - 1) : 0;
  const points = data.map((point, index) => {
    const x = data.length > 1 ? index * stepX : VIEW_WIDTH / 2;
    const y = TOP_PADDING + (1 - point.value / maxValue) * (VIEW_HEIGHT - TOP_PADDING);
    return { ...point, x, y };
  });
  const linePath = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = `0,${VIEW_HEIGHT} ${linePath} ${VIEW_WIDTH},${VIEW_HEIGHT}`;
  const gradientId = `area-fill-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div style={{ height }}>
      <svg
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${gradientId})`} points={areaPath} />
        <polyline
          fill="none"
          points={linePath}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={0.6}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point) => (
          <circle cx={point.x} cy={point.y} fill={color} key={point.label} r={0.9}>
            <title>
              {point.label}: {formatValue(point.value)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        {data.length > 2 ? <span>{data[Math.floor((data.length - 1) / 2)]?.label}</span> : null}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
