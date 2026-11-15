"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void;
export type PointerFn = (kind: "down" | "move" | "up", x: number, y: number, w: number, h: number) => void;

/**
 * A crisp, responsive canvas with a scene clock. `t` runs from 0 to `duration` (scene seconds)
 * and restarts when `runKey` changes. Play, pause, replay and slow motion are built in; with
 * reduced motion the scene jumps to its last frame. `loop` keeps the clock running past the end
 * (for ambient scenes like particles).
 */
export function SceneCanvas({
  draw,
  duration,
  runKey,
  label,
  loop = false,
  aspect = 16 / 9,
  onPointer,
  hint,
  className,
}: {
  draw: DrawFn;
  duration: number;
  runKey: number | string;
  label: string;
  loop?: boolean;
  aspect?: number;
  onPointer?: PointerFn;
  hint?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef(draw);
  const clock = useRef({ t: 0, last: 0 });
  // Paused only for the run it was paused on: a new run plays straight away.
  const [pausedKey, setPausedKey] = useState<number | string | null>(null);
  const playing = pausedKey !== runKey;
  const setPlaying = (p: boolean) => setPausedKey(p ? null : runKey);
  const [speed, setSpeed] = useState(1);
  const state = useRef({ playing: true, speed: 1, duration, loop, reduce: false });

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);
  useEffect(() => {
    state.current = { playing, speed, duration, loop, reduce: !!reduce };
  }, [playing, speed, duration, loop, reduce]);

  // New run: restart the clock.
  useEffect(() => {
    clock.current.t = reduce && !loop ? duration : 0;
  }, [runKey, reduce, loop, duration]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let size = { w: 0, h: 0 };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = Math.round(w / aspect);
      size = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const frame = (now: number) => {
      const s = state.current;
      const c = clock.current;
      const dt = c.last ? Math.min(0.05, (now - c.last) / 1000) : 0;
      c.last = now;
      if (s.playing && !(s.reduce && !s.loop)) {
        c.t += dt * s.speed;
        if (!s.loop && c.t >= s.duration) c.t = s.duration;
      }
      ctx.clearRect(0, 0, size.w, size.h);
      drawRef.current(ctx, size.w, size.h, c.t, s.playing ? dt * s.speed : 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [aspect]);

  const pointer = (kind: "down" | "move" | "up") => (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!onPointer) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (kind === "down") e.currentTarget.setPointerCapture(e.pointerId);
    onPointer(kind, e.clientX - r.left, e.clientY - r.top, r.width, r.height);
  };

  return (
    <figure className={cn("overflow-hidden rounded-3xl bg-ink ring-1 ring-line", className)}>
      <div ref={wrapRef} className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          className={cn("block w-full touch-none select-none", onPointer && "cursor-crosshair")}
          onPointerDown={pointer("down")}
          onPointerMove={pointer("move")}
          onPointerUp={pointer("up")}
        />
        {hint && <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90 backdrop-blur">{hint}</p>}
      </div>
      <figcaption className="flex flex-wrap items-center gap-2 bg-ink px-3 py-2 text-white/80">
        <button
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          onClick={() => {
            clock.current.t = 0;
            setPlaying(true);
          }}
          aria-label="Replay"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <div role="radiogroup" aria-label="Speed" className="ml-auto flex gap-1">
          {[0.25, 0.5, 1, 2].map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={speed === s}
              onClick={() => setSpeed(s)}
              className={cn("h-8 rounded-full px-2.5 text-xs font-medium tabular-nums", speed === s ? "bg-white text-ink" : "bg-white/10 hover:bg-white/20")}
            >
              {s === 0.25 ? "¼×" : s === 0.5 ? "½×" : `${s}×`}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

// ---------- Shared drawing helpers ----------

/** Value of a series at x, by linear interpolation (series sorted by x). */
export function sampleAt(points: [number, number][], x: number): number {
  if (!points.length) return 0;
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= x) lo = mid;
    else hi = mid;
  }
  const [x0, y0] = points[lo];
  const [x1, y1] = points[hi];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
}

/** Point along a path at fraction f (0-1), interpolating by index. */
export function alongPath(points: [number, number][], f: number): [number, number] {
  const i = Math.max(0, Math.min(points.length - 1, f * (points.length - 1)));
  const a = points[Math.floor(i)];
  const b = points[Math.min(points.length - 1, Math.floor(i) + 1)];
  const k = i - Math.floor(i);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

/** Deterministic pseudo-random numbers, so scenes look the same on every render. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export const SKIES: Record<string, { top: string; bottom: string; ground: string; stars: boolean; name: string }> = {
  moon: { top: "#05060c", bottom: "#1b1d2b", ground: "#8d8a84", stars: true, name: "Moon" },
  mars: { top: "#3b1a12", bottom: "#c96a3a", ground: "#7a3420", stars: false, name: "Mars" },
  earth: { top: "#5aa7e6", bottom: "#cfe8fb", ground: "#5c8f3c", stars: false, name: "Earth" },
  jupiter: { top: "#5b3b1e", bottom: "#e0a96b", ground: "#6b4a2a", stars: false, name: "Jupiter" },
};

/** Sky by gravity: nearest of Moon, Mars, Earth, Jupiter. */
export function skyFor(g: number) {
  const k = g < 2.6 ? "moon" : g < 6.5 ? "mars" : g < 17 ? "earth" : "jupiter";
  return SKIES[k];
}

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, sky: (typeof SKIES)[string], groundY: number) {
  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, sky.top);
  g.addColorStop(1, sky.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, groundY);
  if (sky.stars) {
    const r = rng(7);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 90; i++) ctx.fillRect(r() * w, r() * groundY * 0.9, r() < 0.15 ? 2 : 1, r() < 0.15 ? 2 : 1);
  }
  ctx.fillStyle = sky.ground;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, groundY, w, 3);
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: { color?: string; size?: number; align?: CanvasTextAlign; bg?: string } = {}) {
  ctx.font = `500 ${opts.size ?? 12}px Lexend, system-ui, sans-serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  if (opts.bg) {
    const m = ctx.measureText(text).width;
    const pad = 6;
    const x0 = opts.align === "center" ? x - m / 2 - pad : opts.align === "right" ? x - m - pad : x - pad;
    ctx.fillStyle = opts.bg;
    ctx.beginPath();
    ctx.roundRect(x0, y - 10, m + pad * 2, 20, 10);
    ctx.fill();
  }
  ctx.fillStyle = opts.color ?? "#fff";
  ctx.fillText(text, x, y);
}
