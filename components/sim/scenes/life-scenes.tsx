"use client";

import { useCallback, useEffect, useState } from "react";
import { formatNumber } from "@/lib/sim/spec";
import { rateConstant } from "@/lib/sim/templates";
import { label, rng, sampleAt, SceneCanvas, type DrawFn } from "./scene-canvas";
import type { SceneProps } from "./physics-scenes";

// ---------- Reaction: a particle chamber ----------

type P = { x: number; y: number; vx: number; vy: number; kind: 0 | 1 | 2; flash: number };

/** The chamber's state lives outside React: the canvas loop moves it every frame. */
class Chamber {
  parts: P[] = [];
  history: number[] = [];
  private tick = 0;
  private seed = 1;

  reset(seed: number, perKind: number) {
    const r = rng(seed);
    this.seed = seed;
    this.tick = 0;
    this.history = [];
    this.parts = Array.from({ length: perKind * 2 }, (_, i) => ({ x: r(), y: r(), vx: r() - 0.5, vy: r() - 0.5, kind: (i % 2) as 0 | 1, flash: 0 }));
  }

  /** Moves particles; an A meeting a B reacts with probability `chance`. Returns the reacted share. */
  step(dt: number, speed: number, chance: number, radius: number): number {
    const ps = this.parts;
    const step = Math.min(dt, 0.033) * speed;
    for (const p of ps) {
      const slow = p.kind === 2 ? 0.6 : 1;
      p.x += p.vx * step * slow;
      p.y += p.vy * step * slow;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      p.x = Math.min(1, Math.max(0, p.x));
      p.y = Math.min(1, Math.max(0, p.y));
      p.flash = Math.max(0, p.flash - dt * 2);
    }
    if (dt > 0) {
      const r = rng((this.tick += 1) * 31 + this.seed);
      for (const a of ps) {
        if (a.kind !== 0) continue;
        const j = ps.findIndex((b) => b.kind === 1 && Math.abs(a.x - b.x) < radius && Math.abs(a.y - b.y) < radius);
        if (j < 0) continue;
        const b = ps[j];
        if (r() < chance) {
          a.kind = 2;
          a.flash = 1;
          a.vx = (a.vx + b.vx) / 2;
          a.vy = (a.vy + b.vy) / 2;
          ps.splice(j, 1);
        } else {
          // Not enough energy: they just bounce apart.
          a.vx *= -1;
          a.vy *= -1;
        }
      }
    }
    const made = ps.filter((p) => p.kind === 2).length;
    const total = made + ps.filter((p) => p.kind === 0).length;
    const share = total ? made / total : 0;
    if (dt > 0) {
      this.history.push(share);
      if (this.history.length > 600) this.history.shift();
    }
    return share;
  }
}

/**
 * Particles of A (blue) and B (red) bounce around; when an A meets a B, they react into C with a
 * chance set by the real model's rate constant (Arrhenius), relative to 25 °C without a catalyst.
 * Hotter means faster particles and more successful collisions; more concentration means more
 * particles. An illustration of the same model the chart uses, not a separate one.
 */
export function ReactionScene({ current, runKey }: SceneProps) {
  const { temperature, concentration, catalyst } = current.values;
  const [chamber] = useState(() => new Chamber());

  useEffect(() => {
    chamber.reset(runKey * 97 + 1, Math.round(10 + concentration * 22));
  }, [chamber, runKey, concentration]);

  const speed = 0.16 * Math.sqrt((temperature + 273.15) / 298.15);
  const chance = Math.min(0.95, 0.05 * (rateConstant(temperature, catalyst >= 0.5) / rateConstant(25, false)));

  const draw: DrawFn = useCallback(
    (ctx, w, h, _t, dt) => {
      const box = { x: 70, y: 16, w: w - 86 - 150, h: h - 32 };
      // Background and chamber
      ctx.fillStyle = "#14110f";
      ctx.fillRect(0, 0, w, h);
      const heat = Math.min(1, temperature / 80);
      const bg = ctx.createLinearGradient(0, box.y + box.h, 0, box.y);
      bg.addColorStop(0, `rgba(${Math.round(80 + heat * 150)},${Math.round(60 + heat * 30)},40,0.35)`);
      bg.addColorStop(1, "rgba(40,40,60,0.15)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (catalyst >= 0.5) {
        ctx.fillStyle = "rgba(200,200,210,0.5)";
        for (let x = box.x + 10; x < box.x + box.w - 10; x += 14) ctx.fillRect(x, box.y + box.h - 10, 8, 4);
        label(ctx, "catalyst", box.x + box.w - 12, box.y + box.h - 22, { align: "right", size: 10, color: "rgba(255,255,255,0.7)" });
      }

      // Thermometer
      const tx = 30;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.roundRect(tx - 6, box.y + 10, 12, box.h - 40, 6);
      ctx.fill();
      const level = (box.h - 40) * (temperature / 80);
      ctx.fillStyle = "#ff5a3c";
      ctx.beginPath();
      ctx.roundRect(tx - 4, box.y + 10 + (box.h - 40) - level, 8, level + 6, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, box.y + box.h - 20, 11, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, `${Math.round(temperature)} °C`, tx, box.y + box.h - 2, { align: "center", size: 10 });

      // Move, bounce, react
      const share = chamber.step(dt, speed, chance, 14 / Math.min(box.w, box.h));
      const ps = chamber.parts;

      for (const p of ps) {
        const x = box.x + 10 + p.x * (box.w - 20);
        const y = box.y + 10 + p.y * (box.h - 20);
        if (p.flash > 0) {
          ctx.strokeStyle = `rgba(255,211,107,${p.flash})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 8 + (1 - p.flash) * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = p.kind === 0 ? "#6cc4ff" : p.kind === 1 ? "#ff7a6b" : "#ffd36b";
        ctx.beginPath();
        ctx.arc(x, y, p.kind === 2 ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Side panel: legend and live graph
      const px = box.x + box.w + 16;
      label(ctx, "A", px + 10, box.y + 12, { color: "#6cc4ff" });
      label(ctx, "+  B", px + 26, box.y + 12, { color: "#ff7a6b" });
      label(ctx, "→  product", px + 64, box.y + 12, { color: "#ffd36b" });
      label(ctx, `Reacted ${Math.round(share * 100)}%`, px, box.y + 44, { size: 16 });
      const gy = box.y + 70;
      const gh = box.h - 90;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(px, gy, 130, gh);
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      chamber.history.forEach((s, i) => {
        const X = px + (i / 600) * 130;
        const Y = gy + gh - s * gh;
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      });
      ctx.stroke();
      label(ctx, "product over time", px, gy + gh + 12, { size: 10, color: "rgba(255,255,255,0.6)" });
    },
    [temperature, catalyst, speed, chance, chamber],
  );

  return (
    <SceneCanvas
      draw={draw}
      duration={30}
      loop
      runKey={`${runKey}-${concentration}`}
      aspect={16 / 8}
      label={`Particle view at ${Math.round(temperature)} °C${catalyst >= 0.5 ? " with a catalyst" : ""}: blue and red particles collide and some react into yellow product.`}
    />
  );
}

// ---------- Population: a petri dish ----------

export function PopulationScene({ current, runKey }: SceneProps) {
  const T = 24;
  const duration = 8;
  const cap = current.values.capacity;
  const draw: DrawFn = useCallback(
    (ctx, w, h, t) => {
      ctx.fillStyle = "#1a1714";
      ctx.fillRect(0, 0, w, h);
      const hours = (Math.min(t, duration) / duration) * T;
      const N = sampleAt(current.result.series[0].points, hours);
      const cx = w * 0.38;
      const cy = h / 2;
      const R = Math.min(w * 0.33, h * 0.44);
      // Dish and agar
      const agar = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
      agar.addColorStop(0, "#f4e7b8");
      agar.addColorStop(1, "#d9c27c");
      ctx.fillStyle = agar;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Food: dots that disappear as the colony eats
      const food = Math.round(110 * Math.max(0, 1 - N / cap));
      const fr = rng(11);
      ctx.fillStyle = "rgba(120,170,80,0.75)";
      for (let i = 0; i < 110; i++) {
        const a = fr() * Math.PI * 2;
        const d = Math.sqrt(fr()) * R * 0.92;
        if (i < food) {
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Cells grow out from the centre in a sunflower spiral
      const maxCells = 320;
      const cells = Math.round(maxCells * Math.pow(N / 5000, 0.6));
      const spacing = (R * 0.9) / Math.sqrt(maxCells);
      for (let i = 0; i < cells; i++) {
        const a = i * 2.39996;
        const d = spacing * Math.sqrt(i + 0.5);
        const fresh = i > cells - 6;
        ctx.fillStyle = fresh ? "#c2410c" : "#9a4710";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, fresh ? 3.4 : 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Readout and growth curve
      const px = cx + R + 30;
      label(ctx, `Hour ${Math.floor(hours)}`, px, 34, { size: 16 });
      label(ctx, `${formatNumber(N)} cells`, px, 60, { size: 13, color: "#ffd36b" });
      label(ctx, `Room for ${formatNumber(cap)}`, px, 82, { size: 11, color: "rgba(255,255,255,0.65)" });
      const gx = px;
      const gy = 104;
      const gw = w - px - 20;
      const gh = h - gy - 36;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(gx, gy, gw, gh);
      const maxN = Math.max(cap, 1000);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh - (cap / maxN) * gh);
      ctx.lineTo(gx + gw, gy + gh - (cap / maxN) * gh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      current.result.series[0].points
        .filter((p) => p[0] <= hours)
        .forEach(([x, y], i) => {
          const X = gx + (x / T) * gw;
          const Y = gy + gh - (y / maxN) * gh;
          if (i) ctx.lineTo(X, Y);
          else ctx.moveTo(X, Y);
        });
      ctx.stroke();
      label(ctx, "food and space limit", gx + gw, gy + gh - (cap / maxN) * gh - 10, { align: "right", size: 10, color: "rgba(255,255,255,0.6)" });
    },
    [current, cap],
  );
  return <SceneCanvas draw={draw} duration={duration} runKey={runKey} aspect={16 / 8} label={`Petri dish over 24 hours: the colony grows to ${formatNumber(current.result.metrics.final ?? 0)} cells.`} />;
}

// ---------- Predators and prey: a meadow ----------

export function EcosystemScene({ current, runKey }: SceneProps) {
  const T = 40;
  const duration = 14;
  const [rabbits, foxes] = current.result.series;
  const draw: DrawFn = useCallback(
    (ctx, w, h, t) => {
      const years = (Math.min(t, duration) / duration) * T;
      const R = sampleAt(rabbits.points, years);
      const F = sampleAt(foxes.points, years);
      const fieldH = h - 70;
      const g = ctx.createLinearGradient(0, 0, 0, fieldH);
      g.addColorStop(0, "#4f7d32");
      g.addColorStop(1, "#3c6526");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, fieldH);
      const gr = rng(5);
      ctx.strokeStyle = "rgba(160,210,110,0.35)";
      for (let i = 0; i < 160; i++) {
        const x = gr() * w;
        const y = gr() * fieldH;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y - 6);
        ctx.stroke();
      }
      // Animals wander on smooth paths; how many are shown follows the model exactly.
      const pos = (i: number, seed: number, speed: number) => {
        const r = rng(i * 7919 + seed);
        const bx = r();
        const by = r();
        const ph = r() * 6.28;
        return [
          (((bx + Math.sin(t * speed + ph) * 0.06 + t * 0.004 * (r() - 0.5)) % 1) + 1) % 1,
          (((by + Math.cos(t * speed * 0.8 + ph) * 0.06) % 1) + 1) % 1,
        ];
      };
      const showR = Math.round(R);
      for (let i = 0; i < Math.min(220, showR); i++) {
        const [x, y] = pos(i, 1, 1.4);
        const X = 10 + x * (w - 20);
        const Y = 10 + y * (fieldH - 20);
        ctx.fillStyle = "#f5f1e8";
        ctx.beginPath();
        ctx.ellipse(X, Y, 4.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(X + 1, Y - 7, 1.6, 4);
        ctx.fillRect(X + 3, Y - 7, 1.6, 4);
      }
      for (let i = 0; i < Math.min(120, Math.round(F)); i++) {
        const [x, y] = pos(i, 2, 0.9);
        const X = 10 + x * (w - 20);
        const Y = 10 + y * (fieldH - 20);
        ctx.fillStyle = "#e8742a";
        ctx.beginPath();
        ctx.moveTo(X - 7, Y + 4);
        ctx.lineTo(X + 7, Y + 4);
        ctx.lineTo(X + 4, Y - 3);
        ctx.lineTo(X + 2, Y - 8);
        ctx.lineTo(X, Y - 3);
        ctx.lineTo(X - 4, Y - 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(X - 8, Y + 2, 3, 2);
      }
      // Bottom strip: counts and the two curves so far
      ctx.fillStyle = "#1a1714";
      ctx.fillRect(0, fieldH, w, h - fieldH);
      label(ctx, `Year ${Math.floor(years)}`, 14, fieldH + 20, { size: 13 });
      label(ctx, `🐇 ${Math.round(R)}`, 14, fieldH + 46, { size: 13, color: "#f5f1e8" });
      label(ctx, `🦊 ${Math.round(F)}`, 84, fieldH + 46, { size: 13, color: "#ffb37a" });
      const gx = 160;
      const gw = w - gx - 14;
      const gy = fieldH + 8;
      const gh = h - fieldH - 16;
      const maxY = Math.max(...rabbits.points.map((p) => p[1]), ...foxes.points.map((p) => p[1]));
      const curve = (pts: [number, number][], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts
          .filter((p) => p[0] <= years)
          .forEach(([x, y], i) => {
            const X = gx + (x / T) * gw;
            const Y = gy + gh - (y / maxY) * gh;
            if (i) ctx.lineTo(X, Y);
            else ctx.moveTo(X, Y);
          });
        ctx.stroke();
      };
      curve(rabbits.points, "#f5f1e8");
      curve(foxes.points, "#ffb37a");
    },
    [rabbits, foxes],
  );
  return (
    <SceneCanvas
      draw={draw}
      duration={duration}
      runKey={runKey}
      aspect={16 / 9}
      label={`Meadow over 40 years: rabbits peak at ${Math.round(current.result.metrics.peakRabbits ?? 0)} and foxes at ${Math.round(current.result.metrics.peakFoxes ?? 0)}.`}
    />
  );
}
