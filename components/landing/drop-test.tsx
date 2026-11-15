"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw, Wind } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/sim/spec";
import { templates, valuesFor, type Point } from "@/lib/sim/templates";
import { cn } from "@/lib/utils";

type Guess = "bowling" | "football" | "same";
type Phase = "idle" | "falling" | "landed";

const HEIGHT = 20;
// Same size, very different mass: the case the free-fall model describes.
const BALLS = {
  football: { mass: 0.43, name: "Football", kg: "0.43 kg" },
  bowling: { mass: 5, name: "Bowling ball", kg: "5 kg" },
} as const;

function fall(mass: number, air: boolean): { time: number; points: Point[] } {
  const r = templates.freefall.run(valuesFor(templates.freefall, { height: HEIGHT, mass, drag: air ? 0.02 : 0 }));
  return { time: r.metrics.fallTime!, points: r.series[0].points };
}
const heightAt = (pts: Point[], t: number) => {
  if (t <= 0) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (pts[i][0] >= t) {
    const [t0, h0] = pts[i - 1];
    const [t1, h1] = pts[i];
    return h0 + ((h1 - h0) * (t - t0)) / (t1 - t0 || 1);
  }
  return 0;
};

/**
 * The landing hero: Galileo's question, staged. A bowling ball and a football fall from a tower in
 * real time, with the physics from the same tested model the Simulation Lab uses. Then add air.
 */
export function DropTest() {
  const [guess, setGuess] = useState<Guess | null>(null);
  const [air, setAir] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const live = useRef({ phase: "idle" as Phase, air: false, start: 0 });

  const fb = fall(BALLS.football.mass, air);
  const bw = fall(BALLS.bowling.mass, air);
  const truth: Guess = Math.abs(fb.time - bw.time) / fb.time < 0.05 ? "same" : bw.time < fb.time ? "bowling" : "football";

  useEffect(() => {
    live.current = { phase, air, start: phase === "falling" ? performance.now() : live.current.start };
  }, [phase, air, run]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dust: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const landedAt: Record<string, number> = {};
    let lastRun = -1;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = Math.round(w * 0.62);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (now: number) => {
      const { phase: ph, air: withAir, start } = live.current;
      const groundY = h - 34;
      const topY = 92; // room above the ledge for the ball names
      const Y = (m: number) => groundY - (m / HEIGHT) * (groundY - topY);
      const tReal = ph === "idle" ? 0 : reduce ? 99 : (now - start) / 1000;
      if (ph === "falling" && lastRun !== run) {
        lastRun = run;
        delete landedAt.football;
        delete landedAt.bowling;
      }
      const runs = { football: fall(BALLS.football.mass, withAir), bowling: fall(BALLS.bowling.mass, withAir) };

      // Sky, sun and hills
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, "#ffc58f");
      sky.addColorStop(0.6, "#ffe0c2");
      sky.addColorStop(1, "#fff1e4");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      const sun = ctx.createRadialGradient(w * 0.8, h * 0.28, 4, w * 0.8, h * 0.28, w * 0.22);
      sun.addColorStop(0, "rgba(255,248,230,0.95)");
      sun.addColorStop(0.25, "rgba(255,224,170,0.6)");
      sun.addColorStop(1, "rgba(255,224,170,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(224,122,46,0.18)";
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, groundY - 38 - Math.sin(x / 90) * 16 - Math.sin(x / 37) * 6);
      ctx.lineTo(w, groundY);
      ctx.fill();
      ctx.fillStyle = "rgba(154,71,16,0.16)";
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, groundY - 18 - Math.sin(x / 60 + 2) * 10);
      ctx.lineTo(w, groundY);
      ctx.fill();

      // Wind streaks with air on
      if (withAir) {
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for (let i = 0; i < 9; i++) {
          const y = topY + 20 + i * ((groundY - topY - 40) / 9);
          const x = ((now / 6 + i * 137) % (w + 160)) - 80;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 30, y - 6, x + 60, y);
          ctx.stroke();
        }
      }

      // Ground: a paved plaza
      ctx.fillStyle = "#e7c39c";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(154,71,16,0.18)";
      for (let x = (now / 1000) * 0; x < w; x += 36) ctx.fillRect(x, groundY + 10, 22, 2);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, groundY, w, 3);

      // The tower, leaning a touch
      const tw = Math.max(64, w * 0.13);
      const tx = w * 0.13;
      ctx.save();
      ctx.translate(tx + tw / 2, groundY);
      ctx.rotate(0.05);
      const towerH = groundY - topY + 24;
      ctx.fillStyle = "#fbf1e4";
      ctx.beginPath();
      ctx.roundRect(-tw / 2, -towerH, tw, towerH, [10, 10, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = "rgba(154,71,16,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const rows = 6;
      for (let r = 0; r < rows; r++) {
        const y = -towerH + 18 + (r * (towerH - 30)) / rows;
        ctx.fillStyle = "rgba(154,71,16,0.12)";
        ctx.fillRect(-tw / 2, y + (towerH - 30) / rows - 4, tw, 3);
        for (let c = 0; c < 3; c++) {
          const ax = -tw / 2 + 10 + c * ((tw - 20) / 3);
          ctx.fillStyle = "rgba(120,60,20,0.22)";
          ctx.beginPath();
          ctx.roundRect(ax + 2, y + 4, (tw - 20) / 3 - 6, (towerH - 30) / rows - 14, [8, 8, 0, 0]);
          ctx.fill();
        }
      }
      ctx.restore();
      // Ledge the balls are dropped from
      const lx0 = tx + tw * 0.85;
      ctx.fillStyle = "#9a4710";
      ctx.fillRect(lx0, topY - 6, w * 0.45, 5);

      // Height scale
      const sx = w - 30;
      ctx.strokeStyle = "rgba(154,71,16,0.5)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, topY);
      ctx.lineTo(sx, groundY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "500 11px Lexend, system-ui, sans-serif";
      ctx.fillStyle = "#9a4710";
      ctx.textAlign = "right";
      ctx.fillText(`${HEIGHT} m`, sx - 6, topY + 4);

      // The balls
      const lanes: [keyof typeof BALLS, number][] = [
        ["bowling", lx0 + w * 0.13],
        ["football", lx0 + w * 0.32],
      ];
      for (const [k, x] of lanes) {
        const r = Math.max(15, w * 0.03);
        const runK = runs[k];
        const t = Math.min(tReal, runK.time);
        const landed = ph !== "idle" && tReal >= runK.time;
        const bob = ph === "idle" && !reduce ? Math.sin(now / 420 + (k === "bowling" ? 0 : 1.4)) * 3 : 0;
        let y = (ph === "idle" ? Y(HEIGHT) : Y(heightAt(runK.points, t))) - r - 2 + bob;
        if (ph === "idle") y = topY - 6 - r + bob;
        else y = Math.min(groundY - r, Math.max(y, topY - 6 - r));
        if (landed && landedAt[k] === undefined) {
          landedAt[k] = now;
          for (let i = 0; i < 14; i++) dust.push({ x, y: groundY, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 90, life: 0.8 });
        }
        // Motion trail
        if (ph === "falling" && !landed) {
          for (let i = 1; i <= 4; i++) {
            ctx.globalAlpha = 0.12 * (5 - i);
            ballShape(ctx, k, x, y - i * 9 * Math.min(1, t * 1.2), r);
          }
          ctx.globalAlpha = 1;
        }
        // Squash on impact
        const since = landedAt[k] !== undefined ? (now - landedAt[k]) / 1000 : 9;
        const squash = since < 0.18 ? 1 - 0.18 * Math.sin((since / 0.18) * Math.PI) : 1;
        ctx.save();
        ctx.translate(x, y + r);
        ctx.scale(1 / squash, squash);
        ctx.translate(-x, -(y + r));
        ballShape(ctx, k, x, y, r);
        ctx.restore();
        // Shadow
        const hFrac = Math.max(0, Math.min(1, (groundY - (y + r)) / (groundY - topY)));
        ctx.fillStyle = `rgba(0,0,0,${0.18 * (1 - hFrac)})`;
        ctx.beginPath();
        ctx.ellipse(x, groundY + 4, r * (1.1 - hFrac * 0.5), 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Labels
        ctx.textAlign = "center";
        ctx.font = "600 12px Lexend, system-ui, sans-serif";
        ctx.fillStyle = "#2b2b2b";
        if (ph === "idle") {
          ctx.fillText(BALLS[k].name, x, topY - 6 - r * 2 - 18);
          ctx.font = "500 11px Lexend, system-ui, sans-serif";
          ctx.fillStyle = "#9a4710";
          ctx.fillText(BALLS[k].kg, x, topY - 6 - r * 2 - 4);
        }
        if (landed) {
          const tag = `${formatNumber(runK.time)} s`;
          ctx.font = "600 13px Lexend, system-ui, sans-serif";
          const tw2 = ctx.measureText(tag).width + 16;
          ctx.fillStyle = "#2b2b2b";
          ctx.beginPath();
          ctx.roundRect(x - tw2 / 2, groundY - r * 2 - 30, tw2, 22, 11);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.fillText(tag, x, groundY - r * 2 - 15);
        }
      }

      // Dust
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i];
        d.life -= 1 / 60;
        if (d.life <= 0) {
          dust.splice(i, 1);
          continue;
        }
        d.vy += 200 / 60;
        d.x += d.vx / 60;
        d.y += d.vy / 60;
        ctx.fillStyle = `rgba(154,71,16,${d.life * 0.4})`;
        ctx.beginPath();
        ctx.arc(d.x, Math.min(d.y, groundY + 2), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stopwatch
      const shown = ph === "idle" ? 0 : Math.min(tReal, Math.max(runs.football.time, runs.bowling.time));
      ctx.fillStyle = "rgba(43,43,43,0.85)";
      ctx.beginPath();
      ctx.roundRect(w - 104, 14, 90, 30, 15);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "600 14px Lexend, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${shown.toFixed(2)} s`, w - 59, 34);

      if (ph === "falling" && tReal >= Math.max(runs.football.time, runs.bowling.time) + 0.25) setPhase("landed");
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [run]);

  const drop = () => {
    setRun((r) => r + 1);
    setPhase("falling");
  };
  const reset = (withAir: boolean) => {
    setGuess(null);
    setAir(withAir);
    setPhase("idle");
  };

  const options: { id: Guess; label: string; icon: React.ReactNode }[] = [
    { id: "bowling", label: "Bowling ball", icon: <BallIcon kind="bowling" /> },
    { id: "football", label: "Football", icon: <BallIcon kind="football" /> },
    { id: "same", label: "Same time", icon: <span className="flex -space-x-1.5"><BallIcon kind="bowling" /><BallIcon kind="football" /></span> },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_40px_100px_-50px_rgba(154,71,16,0.6)]">
      <div className="px-6 pt-6 sm:px-8 sm:pt-7">
        <p className="mb-1 text-xs font-medium tracking-[0.08em] text-accent uppercase">Galileo&rsquo;s question · try it</p>
        <p className="text-xl leading-snug font-medium sm:text-2xl">
          {air ? "Now with air pushing back. Which lands first?" : "Drop a bowling ball and a football from 20 m. Which hits the ground first?"}
        </p>
      </div>
      <div ref={wrapRef} className="relative mt-4">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`A tower with a bowling ball and a football at the top${phase === "landed" ? `. Bowling ball lands after ${formatNumber(bw.time)} s, football after ${formatNumber(fb.time)} s.` : "."}`}
          className="block w-full"
        />
      </div>
      <div className="px-6 pt-4 pb-6 sm:px-8 sm:pb-7">
        <AnimatePresence mode="wait" initial={false}>
          {phase !== "landed" ? (
            <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="Your guess" className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <button
                    key={o.id}
                    role="radio"
                    aria-checked={guess === o.id}
                    disabled={phase === "falling"}
                    onClick={() => setGuess(o.id)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-150",
                      guess === o.id ? "scale-[1.03] border-accent bg-accent-soft text-accent" : "border-line hover:border-accent",
                    )}
                  >
                    <span aria-hidden className="inline-flex">{o.icon}</span> {o.label}
                  </button>
                ))}
              </div>
              <button
                disabled={!guess || phase === "falling"}
                onClick={drop}
                className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-medium text-surface transition-opacity duration-150 disabled:opacity-35"
              >
                {phase === "falling" ? "Falling…" : "Drop them"} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} aria-live="polite">
              <p className={cn("mb-1 text-lg font-medium", guess === truth ? "text-accent" : "text-ink")}>
                {guess === truth ? "You called it." : "Surprised? Most people are."} {truth === "same" ? "They land together." : "The bowling ball wins."}
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-ink/75">
                {air
                  ? `Same size, so the same push from the air, but it slows the light football far more: ${formatNumber(bw.time)} s against ${formatNumber(fb.time)} s.`
                  : `Both take ${formatNumber(bw.time)} s. Gravity pulls ten times harder on the bowling ball, but it is also ten times harder to speed up.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {!air ? (
                  <button onClick={() => reset(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface">
                    <Wind className="h-4 w-4" /> Now add air
                  </button>
                ) : (
                  <Link href="/lab" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface">
                    Build one for your own question <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button onClick={() => reset(false)} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-muted ring-1 ring-line hover:text-ink">
                  <RotateCcw className="h-4 w-4" /> Start again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Small icons for the guess buttons, matching the balls in the scene. */
function BallIcon({ kind }: { kind: "bowling" | "football" }) {
  return kind === "bowling" ? (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#26304a" />
      <circle cx="7.6" cy="7" r="1.2" fill="#0b0f19" />
      <circle cx="10.8" cy="6.2" r="1.2" fill="#0b0f19" />
      <circle cx="9.5" cy="9.8" r="1.2" fill="#0b0f19" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#fff" stroke="#2b2b2b" strokeWidth="1" />
      <path d="M10 6.6 13.2 9 12 12.8H8L6.8 9Z" fill="#2b2b2b" />
      <path d="M10 1v2.5M18.6 7.6l-2.4.8M15.4 17.2l-1.5-2M4.6 17.2l1.5-2M1.4 7.6l2.4.8" stroke="#2b2b2b" strokeWidth="1.2" />
    </svg>
  );
}

/** A bowling ball (dark, finger holes) or a football (white, black patches). */
function ballShape(ctx: CanvasRenderingContext2D, kind: "bowling" | "football", x: number, y: number, r: number) {
  if (kind === "bowling") {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, "#5a6b8c");
    g.addColorStop(1, "#1d2436");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0f19";
    for (const [dx, dy] of [
      [-0.25, -0.3],
      [0.08, -0.38],
      [-0.05, 0.02],
    ]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#d9d4cc");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#2b2b2b";
  const pent = (cx: number, cy: number, s: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    }
    ctx.fill();
  };
  pent(x, y, r * 0.32);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pent(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.3);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}
