export type Pt = [number, number];

const toPath = (pts: Pt[], sx: (v: number) => number, sy: (v: number) => number) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");

export default function LineChart({
  title,
  unit,
  points,
  xMax,
  yMax,
  xTicks,
  yTicks,
  regions = [],
  markers = [],
}: {
  title: string;
  unit: string;
  points: Pt[];
  xMax: number;
  yMax: number;
  xTicks: { v: number; label: string }[];
  yTicks: number[];
  regions?: { from: number; to: number; label: string }[];
  markers?: { x: number; label: string }[];
}) {
  const W = 720;
  const H = 230;
  const pad = { top: 30, right: 14, bottom: 26, left: 40 };
  const sx = (v: number) => pad.left + (v / xMax) * (W - pad.left - pad.right);
  const sy = (v: number) => H - pad.bottom - (v / yMax) * (H - pad.top - pad.bottom);
  const areaPath = `${toPath(points, sx, sy)} L${sx(points[points.length - 1][0]).toFixed(1)},${sy(0)} L${sx(
    points[0][0],
  ).toFixed(1)},${sy(0)} Z`;

  return (
    <figure className="rounded-lg border border-border bg-secondary/20 p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{unit}</span>
      </figcaption>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="min-w-[560px] w-full">
          {regions.map((r, i) => (
            <g key={r.label}>
              <rect
                x={sx(r.from)}
                y={pad.top}
                width={sx(r.to) - sx(r.from)}
                height={H - pad.top - pad.bottom}
                className={i % 2 === 0 ? "fill-accent/10" : "fill-accent/5"}
              />
              <text
                x={(sx(r.from) + sx(r.to)) / 2}
                y={pad.top - 8}
                textAnchor="middle"
                className="fill-muted-foreground font-mono text-[10px]"
              >
                {r.label}
              </text>
            </g>
          ))}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={sy(t)} y2={sy(t)} className="stroke-border" strokeWidth={1} />
              <text x={pad.left - 6} y={sy(t) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t.label} x={sx(t.v)} y={H - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
              {t.label}
            </text>
          ))}
          {markers.map((m) => (
            <g key={m.label}>
              <line
                x1={sx(m.x)}
                x2={sx(m.x)}
                y1={pad.top - 4}
                y2={H - pad.bottom}
                className="stroke-destructive"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <text x={sx(m.x) + 5} y={pad.top + 6} className="fill-destructive font-mono text-[10px]">
                {m.label}
              </text>
            </g>
          ))}
          <path d={areaPath} className="fill-accent/10" />
          <path d={toPath(points, sx, sy)} className="stroke-accent" strokeWidth={2} fill="none" strokeLinejoin="round" />
        </svg>
      </div>
    </figure>
  );
}
