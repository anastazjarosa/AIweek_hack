"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { formatNumber } from "@/lib/sim/spec";
import type { Result, Template } from "@/lib/sim/templates";

// A narrower drawing on phones keeps the axis labels readable once the SVG is scaled down.
const narrowQuery = "(max-width: 639px)";
function useNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(narrowQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(narrowQuery).matches,
    () => false,
  );
}

/** Round tick values ("nice numbers") covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, count: number): number[] {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

const SERIES_CLASS = ["stroke-accent", "stroke-series-2"];
const DOT_CLASS = ["fill-accent", "fill-series-2"];

export function SimChart({
  template,
  result,
  previous,
  runKey,
  description,
}: {
  template: Template;
  result: Result;
  /** The run before this one, drawn dashed for comparison. */
  previous?: Result | null;
  /** Changes on every run so the line redraws. */
  runKey: number;
  /** Screen-reader summary of what the chart shows. */
  description: string;
}) {
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const W = narrow ? 340 : 680;
  const H = narrow ? 260 : 300;
  const font = narrow ? 13 : 12;
  const PAD = { l: narrow ? 46 : 56, r: 18, t: 18, b: 44 };

  const all = [...result.series, ...(previous?.series ?? [])].flatMap((s) => s.points);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const x0 = Math.min(0, ...xs);
  const x1 = Math.max(...xs) || 1;
  const y0 = Math.min(0, ...ys);
  const y1 = Math.max(...ys) * 1.08 || 1;
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => PAD.t + (1 - (v - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");

  const xt = niceTicks(x0, x1, narrow ? 4 : 6).filter((v) => v <= x1);
  const yt = niceTicks(y0, y1, 4).filter((v) => v <= y1);
  const draw = reduce
    ? {}
    : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, ease: "easeOut" as const } };
  const unit = (u: string) => (u ? ` (${u})` : "");
  const multi = result.series.length > 1;

  // The marker retraces the main line, like a ball in flight.
  const lead = result.series[0].points;
  const frames = lead.filter((_, i) => i % Math.max(1, Math.floor(lead.length / 60)) === 0).concat([lead.at(-1)!]);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={description}>
        {yt.map((v) => (
          <g key={`y${v}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} className={v === 0 ? "stroke-ink/30" : "stroke-line"} />
            <text x={PAD.l - 8} y={sy(v) + 4} textAnchor="end" fontSize={font} className="fill-muted tabular-nums">
              {formatNumber(v)}
            </text>
          </g>
        ))}
        {xt.map((v) => (
          <text key={`x${v}`} x={sx(v)} y={H - PAD.b + 18} textAnchor="middle" fontSize={font} className="fill-muted tabular-nums">
            {formatNumber(v)}
          </text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" fontSize={font} className="fill-muted">
          {template.axes.x.label}
          {unit(template.axes.x.unit)}
        </text>
        <text
          transform={`translate(${narrow ? 12 : 14} ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={font}
          className="fill-muted"
        >
          {template.axes.y.label}
          {unit(template.axes.y.unit)}
        </text>

        {previous?.series.map((s, i) => (
          <path
            key={`prev-${s.label}`}
            d={path(s.points)}
            fill="none"
            strokeWidth={2}
            strokeDasharray="6 5"
            className={i === 0 ? "stroke-ink/35" : "stroke-ink/20"}
          />
        ))}
        {result.series.map((s, i) => (
          <motion.path
            key={`${runKey}-${s.label}-${W}`}
            d={path(s.points)}
            fill="none"
            strokeWidth={3}
            strokeLinejoin="round"
            className={SERIES_CLASS[i % 2]}
            {...draw}
          />
        ))}
        {template.marker &&
          (reduce ? (
            <circle cx={sx(lead.at(-1)![0])} cy={sy(lead.at(-1)![1])} r={7} className="fill-accent" />
          ) : (
            <motion.circle
              key={`dot-${runKey}-${W}`}
              r={7}
              className="fill-accent"
              initial={{ cx: sx(frames[0][0]), cy: sy(frames[0][1]) }}
              animate={{ cx: frames.map((p) => sx(p[0])), cy: frames.map((p) => sy(p[1])) }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ))}
        {!template.marker &&
          result.series.map((s, i) => {
            const end = s.points.at(-1)!;
            return <circle key={`end-${s.label}`} cx={sx(end[0])} cy={sy(end[1])} r={5} className={DOT_CLASS[i % 2]} />;
          })}
      </svg>
      {(multi || previous) && (
        <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {result.series.map((s, i) => (
            <span key={s.label} className="inline-flex items-center gap-2">
              <span className={`h-[3px] w-5 rounded-full ${i % 2 ? "bg-series-2" : "bg-accent"}`} aria-hidden />
              {s.label}
            </span>
          ))}
          {previous && (
            <span className="inline-flex items-center gap-2">
              <svg width="20" height="4" aria-hidden>
                <line x1="0" x2="20" y1="2" y2="2" strokeWidth="2" strokeDasharray="5 3" className="stroke-ink/40" />
              </svg>
              Last run
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
