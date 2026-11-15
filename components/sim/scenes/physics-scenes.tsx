"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/sim/spec";
import type { Result, Values } from "@/lib/sim/templates";
import { alongPath, drawSky, label, rng, sampleAt, SceneCanvas, skyFor, type DrawFn, type PointerFn } from "./scene-canvas";

export type SceneRun = { values: Values; result: Result };
export type SceneProps = {
  current: SceneRun;
  previous?: SceneRun | null;
  runKey: number;
  /** Game input: the scene sets slider values (and may fire a new run). */
  onAim?: (patch: Values, fire: boolean) => void;
};

const niceStep = (span: number) => {
  const raw = span / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
};

// ---------- Projectile: the cannon game ----------

/** Celebration on a hit. State lives outside React; the canvas loop moves it. */
class Confetti {
  private bits: { x: number; y: number; vx: number; vy: number; c: string; life: number }[] = [];
  burst(x: number, y: number, seed: number) {
    const r = rng(seed);
    for (let i = 0; i < 70; i++)
      this.bits.push({ x, y, vx: (r() - 0.5) * 260, vy: -120 - r() * 220, c: ["#ffd36b", "#ff5a3c", "#7ee0ff", "#b6f27a"][i % 4], life: 1.6 });
  }
  draw(ctx: CanvasRenderingContext2D, dt: number) {
    this.bits = this.bits.filter((p) => (p.life -= dt) > 0);
    for (const p of this.bits) {
      p.vy += 380 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, 5, 3);
    }
  }
}

export function ProjectileScene({ current, previous, runKey, onAim }: SceneProps) {
  const range = current.result.metrics.range ?? 0;
  const flight = current.result.metrics.flightTime ?? 1;
  const duration = Math.min(4, Math.max(1.4, flight * 0.75));
  const g = current.values.gravity;
  const maxReach = (40 * 40) / g; // furthest any throw could go here: the target is always reachable
  const [target, setTarget] = useState(() => Math.round(maxReach * (0.35 + rng(Math.round(g * 10))() * 0.4)));
  const [score, setScore] = useState({ hits: 0, shots: 0 });
  const scored = useRef(-1);
  const aim = useRef<{ angle: number; speed: number } | null>(null);
  const [confetti] = useState(() => new Confetti());

  // World → screen: equal scale on both axes so the path has its true shape.
  const view = useCallback(
    (w: number, h: number) => {
      const groundY = h - 36;
      const prevRange = previous?.result.metrics.range ?? 0;
      const maxX = Math.max(range, prevRange, target, 20) * 1.15;
      const maxY = Math.max(current.result.metrics.maxHeight ?? 0, previous?.result.metrics.maxHeight ?? 0, 5) * 1.2;
      const s = Math.min((w - 70) / maxX, (groundY - 30) / maxY);
      return { groundY, s, ox: 44, X: (x: number) => 44 + x * s, Y: (y: number) => groundY - y * s, maxX };
    },
    [range, target, previous, current],
  );

  const draw: DrawFn = useCallback(
    (ctx, w, h, t, dt) => {
      const v = view(w, h);
      const sky = skyFor(g);
      drawSky(ctx, w, h, sky, v.groundY);
      // Ground scale
      const step = niceStep(v.maxX);
      for (let m = step; m < v.maxX; m += step) {
        const x = v.X(m);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x, v.groundY, 1, 6);
        label(ctx, `${formatNumber(m)} m`, x, v.groundY + 18, { align: "center", size: 10, color: "rgba(255,255,255,0.75)" });
      }
      // Target flag
      const tx = v.X(target);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(tx, v.groundY + 2, Math.max(10, 2.5 * v.s), 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, v.groundY);
      ctx.lineTo(tx, v.groundY - 34);
      ctx.stroke();
      ctx.fillStyle = "#ff5a3c";
      ctx.beginPath();
      ctx.moveTo(tx, v.groundY - 34);
      ctx.lineTo(tx + 18, v.groundY - 28);
      ctx.lineTo(tx, v.groundY - 22);
      ctx.fill();
      label(ctx, `Target ${target} m`, tx, v.groundY - 46, { align: "center", size: 11, bg: "rgba(0,0,0,0.45)" });

      // Previous shot, faded
      if (previous) {
        const pp = previous.result.series[0].points;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        pp.forEach(([x, y], i) => (i ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y))));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Cannon
      const a = ((aim.current?.angle ?? current.values.angle) * Math.PI) / 180;
      ctx.save();
      ctx.translate(v.ox, v.groundY - 6);
      ctx.rotate(-a);
      ctx.fillStyle = "#2b2b2b";
      ctx.beginPath();
      ctx.roundRect(-4, -7, 38, 14, 6);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#3d3d3d";
      ctx.beginPath();
      ctx.arc(v.ox, v.groundY - 4, 11, Math.PI, 0);
      ctx.fill();

      // Aiming arrow while dragging
      if (aim.current) {
        const len = 30 + (aim.current.speed / 40) * 110;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(v.ox, v.groundY - 6);
        ctx.lineTo(v.ox + Math.cos(a) * len, v.groundY - 6 - Math.sin(a) * len);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, `${Math.round(aim.current.angle)}° · ${Math.round(aim.current.speed)} m/s`, v.ox + Math.cos(a) * len + 8, v.groundY - 6 - Math.sin(a) * len - 12, { bg: "rgba(0,0,0,0.5)" });
      }

      // The shot: trail and ball
      const pts = current.result.series[0].points;
      const f = Math.min(1, t / duration);
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const n = Math.max(1, Math.floor(f * (pts.length - 1)));
      for (let i = 0; i <= n; i++) {
        const [x, y] = pts[i];
        if (i) ctx.lineTo(v.X(x), v.Y(y));
        else ctx.moveTo(v.X(x), v.Y(y));
      }
      ctx.stroke();
      const [bx, by] = alongPath(pts, f);
      const glow = ctx.createRadialGradient(v.X(bx), v.Y(by), 0, v.X(bx), v.Y(by), 16);
      glow.addColorStop(0, "rgba(255,211,107,0.9)");
      glow.addColorStop(1, "rgba(255,211,107,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(v.X(bx), v.Y(by), 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6dc";
      ctx.beginPath();
      ctx.arc(v.X(bx), v.Y(by), 6, 0, Math.PI * 2);
      ctx.fill();

      // Landing: distance, score, confetti on a hit
      if (f >= 1) {
        label(ctx, `${formatNumber(range)} m`, v.X(range), v.groundY - 18, { align: "center", bg: "rgba(0,0,0,0.6)", size: 13 });
        const hit = Math.abs(range - target) <= Math.max(1, target * 0.04);
        if (scored.current !== runKey) {
          scored.current = runKey;
          setScore((sc) => ({ hits: sc.hits + (hit ? 1 : 0), shots: sc.shots + 1 }));
          if (hit) confetti.burst(tx, v.groundY - 30, runKey + 3);
        }
        if (hit) label(ctx, "Hit!", tx, v.groundY - 72, { align: "center", size: 18, bg: "#ff5a3c" });
      }
      confetti.draw(ctx, dt);
      label(ctx, `${sky.name} · g = ${formatNumber(g)} m/s²`, w - 12, 18, { align: "right", size: 11, bg: "rgba(0,0,0,0.35)" });
    },
    [view, g, target, previous, current, duration, range, runKey, confetti],
  );

  const onPointer: PointerFn = useCallback(
    (kind, x, y, w, h) => {
      if (!onAim) return;
      const v = view(w, h);
      const dx = x - v.ox;
      const dy = v.groundY - 6 - y;
      const angle = Math.min(85, Math.max(5, (Math.atan2(dy, dx) * 180) / Math.PI));
      const speed = Math.min(40, Math.max(5, (Math.hypot(dx, dy) - 30) / 110 * 40));
      if (kind === "down" || kind === "move") {
        if (kind === "move" && !aim.current) return;
        aim.current = { angle, speed };
      } else if (aim.current) {
        const a = aim.current;
        aim.current = null;
        onAim({ angle: Math.round(a.angle), speed: Math.round(a.speed) }, true);
      }
    },
    [onAim, view],
  );

  return (
    <div>
      <SceneCanvas
        draw={draw}
        duration={duration}
        runKey={runKey}
        onPointer={onAim ? onPointer : undefined}
        hint={onAim ? "Drag from the cannon to aim, let go to fire" : undefined}
        label={`Cannon on ${skyFor(g).name}: the ball travels ${formatNumber(range)} metres. Target at ${target} metres.`}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          Hits: <span className="font-medium text-ink tabular-nums">{score.hits}</span> of {score.shots}
        </span>
        <button onClick={() => setTarget(Math.round(maxReach * (0.3 + Math.random() * 0.5)))} className="font-medium text-accent underline-offset-4 hover:underline">
          New target
        </button>
      </div>
    </div>
  );
}

// ---------- Free fall: a drop tower where this run races the last one ----------

export function FreefallScene({ current, previous, runKey }: SceneProps) {
  const runs = useMemo(() => [previous, current].filter(Boolean) as SceneRun[], [previous, current]);
  const longest = Math.max(...runs.map((r) => r.result.metrics.fallTime ?? 1));
  const timeScale = Math.max(1, longest / 3.5); // long falls play faster, the clock shows real seconds
  const duration = longest / timeScale + 0.6;
  const maxH = Math.max(...runs.map((r) => r.values.height));

  const draw: DrawFn = useCallback(
    (ctx, w, h, t) => {
      const groundY = h - 30;
      const top = 64; // room for the labels above the balls
      const g = current.values.gravity;
      drawSky(ctx, w, h, skyFor(g), groundY);
      const Y = (m: number) => groundY - (m / maxH) * (groundY - top);
      // Tower
      const towerX = w * 0.12;
      ctx.fillStyle = "rgba(43,43,43,0.85)";
      ctx.fillRect(towerX - 14, Y(maxH) - 4, 28, groundY - Y(maxH) + 4);
      for (let m = 0; m <= maxH; m += niceStep(maxH)) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(towerX + 14, Y(m), 8, 1);
        label(ctx, `${formatNumber(m)} m`, towerX + 26, Y(m), { size: 10, color: "rgba(255,255,255,0.8)" });
      }
      const realT = t * timeScale;
      const lanes = runs.map((r, i) => ({ r, x: w * (runs.length === 1 ? 0.55 : i === 0 ? 0.42 : 0.68), ghost: runs.length > 1 && i === 0 }));
      for (const { r, x, ghost } of lanes) {
        const ft = r.result.metrics.fallTime ?? 0;
        const y = Y(sampleAt(r.result.series[0].points, Math.min(realT, ft)));
        const radius = 7 + Math.cbrt(r.values.mass) * 5;
        // Air streaks rush up past a falling ball when there is drag
        if (r.values.drag > 0 && realT < ft) {
          const rr = rng(Math.round(x));
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 1;
          for (let k = 0; k < 6; k++) {
            const sx = x + (rr() - 0.5) * radius * 3;
            const sy = ((y + 60 - ((realT * 160 + rr() * 200) % 120)) | 0) + radius;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy + 14);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = ghost ? 0.55 : 1;
        ctx.fillStyle = ghost ? "#ffffff" : "#ffd36b";
        ctx.beginPath();
        ctx.arc(x, Math.min(y, groundY - radius) , radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        label(ctx, `${formatNumber(r.values.mass)} kg${ghost ? " · last run" : ""}`, x, Y(r.values.height) - radius - 14, { align: "center", size: 11, bg: "rgba(0,0,0,0.4)" });
        if (realT >= ft) label(ctx, `${formatNumber(ft)} s`, x, groundY - radius * 2 - 16, { align: "center", size: 13, bg: ghost ? "rgba(0,0,0,0.5)" : "#9a4710" });
      }
      label(ctx, `t = ${formatNumber(Math.min(realT, longest))} s${timeScale > 1 ? `  (shown ${formatNumber(timeScale)}× faster)` : ""}`, w - 12, 18, { align: "right", size: 12, bg: "rgba(0,0,0,0.4)" });
    },
    [current, runs, maxH, timeScale, longest],
  );

  return (
    <SceneCanvas
      draw={draw}
      duration={duration}
      runKey={runKey}
      label={`Drop tower: ${runs.map((r) => `${formatNumber(r.values.mass)} kg lands after ${formatNumber(r.result.metrics.fallTime ?? 0)} seconds`).join("; ")}.`}
    />
  );
}

// ---------- Spring: the block bounces, a pen traces the motion ----------

export function SpringScene({ current, previous, runKey }: SceneProps) {
  const T = 10;
  const draw: DrawFn = useCallback(
    (ctx, w, h, t) => {
      ctx.fillStyle = "#1f1a16";
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.22;
      const ceil = 18;
      const rest = h * 0.45;
      const scale = (h * 0.32) / 0.5;
      ctx.fillStyle = "#555";
      ctx.fillRect(cx - 50, ceil - 8, 100, 8);
      const drawMass = (run: SceneRun, x: number, ghost: boolean) => {
        const pos = sampleAt(run.result.series[0].points, Math.min(t, T));
        const y = rest + pos * scale;
        const coils = 12;
        ctx.strokeStyle = ghost ? "rgba(255,255,255,0.35)" : "#d9d9d9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, ceil);
        for (let i = 1; i <= coils * 2; i++) ctx.lineTo(x + (i % 2 ? 12 : -12), ceil + ((y - ceil - 8) * i) / (coils * 2));
        ctx.lineTo(x, y - 8);
        ctx.stroke();
        const size = 18 + Math.sqrt(run.values.mass) * 14;
        ctx.fillStyle = ghost ? "rgba(255,255,255,0.3)" : "#e07a2e";
        ctx.beginPath();
        ctx.roundRect(x - size / 2, y - 8, size, size, 6);
        ctx.fill();
        label(ctx, `${formatNumber(run.values.mass)} kg`, x, y + size / 2 - 8, { align: "center", size: 11, color: ghost ? "rgba(255,255,255,0.7)" : "#2b2b2b" });
        return y + size / 2 - 8;
      };
      if (previous) drawMass(previous, cx - 60, true);
      const penY = drawMass(current, previous ? cx + 30 : cx, false);

      // The trace: position over the last few seconds, like a seismograph
      const left = w * 0.42;
      const right = w - 16;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(left, rest);
      ctx.lineTo(right, rest);
      ctx.stroke();
      const plot = (run: SceneRun, color: string) => {
        const pts = run.result.series[0].points.filter((p) => p[0] <= t);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach(([tt, x], i) => {
          const X = left + (tt / T) * (right - left);
          const Yv = rest + x * scale;
          if (i) ctx.lineTo(X, Yv);
          else ctx.moveTo(X, Yv);
        });
        ctx.stroke();
      };
      if (previous) plot(previous, "rgba(255,255,255,0.35)");
      plot(current, "#ffd36b");
      ctx.strokeStyle = "rgba(255,211,107,0.4)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo((previous ? cx + 30 : cx) + 30, penY);
      ctx.lineTo(left + (Math.min(t, T) / T) * (right - left), penY);
      ctx.stroke();
      ctx.setLineDash([]);
      const period = current.result.metrics.period;
      label(ctx, `t = ${formatNumber(Math.min(t, T))} s${period ? ` · one bounce = ${formatNumber(period)} s` : ""}`, w - 12, 18, { align: "right", size: 12, bg: "rgba(255,255,255,0.1)" });
    },
    [current, previous],
  );

  return <SceneCanvas draw={draw} duration={T} runKey={runKey} label={`Mass on a spring bouncing for 10 seconds; one bounce takes ${formatNumber(current.result.metrics.period ?? 0)} seconds.`} />;
}
