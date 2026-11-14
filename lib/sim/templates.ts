// Simulation templates: small, honest models of real science. Pure functions, unit tested.
//
// A template owns the maths (parameters, outputs, the model). A spec (lib/sim/spec.ts) owns the
// story: which question it answers, which sliders show, and the prediction. Specs can be written
// by hand or by the AI agent; the model underneath is always this tested code.

export type Subject = "physics" | "chemistry" | "biology";
export type TemplateId = "projectile" | "freefall" | "spring" | "reaction" | "population" | "ecosystem";

export type ParamDef = {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Named values, e.g. gravity on the Moon. Shown as quick-pick buttons. */
  presets?: { label: string; value: number }[];
};

export type MetricDef = { id: string; label: string; unit: string };
export type Point = [x: number, y: number];
export type Series = { label: string; points: Point[] };
export type Values = Record<string, number>;
/** A metric is null when it doesn't apply to this run (e.g. no oscillation to time). */
export type Result = { series: Series[]; metrics: Record<string, number | null> };

export type Template = {
  id: TemplateId;
  subject: Subject;
  name: string;
  summary: string;
  params: ParamDef[];
  metrics: MetricDef[];
  axes: { x: { label: string; unit: string }; y: { label: string; unit: string } };
  /** Draw a moving marker along the first series (motion), or just draw the lines (graphs). */
  marker: boolean;
  run: (v: Values) => Result;
};

const MAX_POINTS = 240;

/** Keeps charts light: at most MAX_POINTS points, always including the last one. */
export function downsample(points: Point[], max = MAX_POINTS): Point[] {
  if (points.length <= max) return points;
  const stride = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * stride)]);
}

const G_EARTH = 9.8;
const gravityPresets = [
  { label: "Moon", value: 1.6 },
  { label: "Mars", value: 3.7 },
  { label: "Earth", value: 9.8 },
  { label: "Jupiter", value: 24.8 },
];

// ---------- Physics: projectile ----------

/**
 * A ball thrown from the ground. Air drag is F = k·v², opposite the velocity, so with drag the
 * mass matters (a = F/m); with k = 0 the path is the textbook parabola and mass has no effect.
 */
function projectile(v: Values): Result {
  const { angle, speed, gravity, mass, drag } = v;
  const a = (angle * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let vx = speed * Math.cos(a);
  let vy = speed * Math.sin(a);
  let t = 0;
  let maxY = 0;
  const dt = 0.0005;
  const pts: Point[] = [[0, 0]];
  for (let i = 0; i < 2_000_000; i++) {
    const s = Math.hypot(vx, vy);
    const ax = (-drag * s * vx) / mass;
    const ay = -gravity - (drag * s * vy) / mass;
    vx += ax * dt;
    vy += ay * dt;
    const nx = x + vx * dt;
    const ny = y + vy * dt;
    t += dt;
    if (ny < 0) {
      // Land exactly on the ground by interpolating the last step.
      const f = y / (y - ny);
      x += (nx - x) * f;
      t -= dt * (1 - f);
      y = 0;
      pts.push([x, 0]);
      break;
    }
    x = nx;
    y = ny;
    maxY = Math.max(maxY, y);
    if (i % 20 === 0) pts.push([x, y]);
  }
  return {
    series: [{ label: "Path", points: downsample(pts) }],
    metrics: { range: x, flightTime: t, maxHeight: maxY },
  };
}

// ---------- Physics: free fall ----------

/** An object dropped from rest. Same drag model as the projectile. */
function freefall(v: Values): Result {
  const { height, gravity, mass, drag } = v;
  let y = height;
  let vy = 0;
  let t = 0;
  const dt = 0.0005;
  const pts: Point[] = [[0, height]];
  for (let i = 0; i < 2_000_000; i++) {
    const ay = -gravity + (drag * vy * vy) / mass;
    vy += ay * dt;
    const ny = y + vy * dt;
    t += dt;
    if (ny <= 0) {
      const f = y / (y - ny);
      t -= dt * (1 - f);
      pts.push([t, 0]);
      break;
    }
    y = ny;
    if (i % 20 === 0) pts.push([t, y]);
  }
  return {
    series: [{ label: "Height", points: downsample(pts) }],
    metrics: { fallTime: t, impactSpeed: Math.abs(vy) },
  };
}

// ---------- Physics: mass on a spring ----------

/** Mass on a spring with damping c (force −c·v). Simulated for 10 s from rest at the amplitude. */
function spring(v: Values): Result {
  const { mass, stiffness, amplitude, damping } = v;
  const T_END = 10;
  const dt = 0.0005;
  let x = amplitude;
  let vx = 0;
  const pts: Point[] = [[0, x]];
  const steps = Math.round(T_END / dt);
  for (let i = 1; i <= steps; i++) {
    const ax = (-stiffness * x - damping * vx) / mass;
    vx += ax * dt;
    x += vx * dt;
    if (i % 20 === 0) pts.push([i * dt, x]);
  }
  const w0 = Math.sqrt(stiffness / mass);
  const gamma = damping / (2 * mass);
  const underdamped = gamma < w0;
  return {
    series: [{ label: "Position", points: downsample(pts) }],
    metrics: {
      period: underdamped ? (2 * Math.PI) / Math.sqrt(w0 * w0 - gamma * gamma) : null,
      // Envelope of the swing at the end, as a share of where it started.
      swingLeft: underdamped ? Math.exp(-gamma * T_END) * 100 : 0,
    },
  };
}

// ---------- Chemistry: reaction rate ----------

const R = 8.314;
const EA = 50_000; // J/mol without a catalyst
const EA_CATALYST = 46_000; // a catalyst offers a lower-energy route (about 5× faster at 25 °C)
// Chosen so that at 25 °C and 1 mol/L, half the reactant is used up in about 60 s.
const PRE_EXP = 1 / 60 / Math.exp(-EA / (R * 298.15));

/** Arrhenius rate constant in L/(mol·s). */
export function rateConstant(celsius: number, catalyst: boolean): number {
  return PRE_EXP * Math.exp(-(catalyst ? EA_CATALYST : EA) / (R * (celsius + 273.15)));
}

/**
 * A + B → products with equal starting concentrations, rate = k[A][B] (second order).
 * Exact solution: [A](t) = c₀ / (1 + k·c₀·t).
 */
function reaction(v: Values): Result {
  const { temperature, concentration, catalyst } = v;
  const k = rateConstant(temperature, catalyst >= 0.5);
  const c0 = concentration;
  const T_END = 300;
  const pts: Point[] = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * T_END;
    pts.push([t, c0 - c0 / (1 + k * c0 * t)]);
  }
  return {
    series: [{ label: "Product made", points: pts }],
    metrics: {
      halfTime: 1 / (k * c0),
      initialRate: k * c0 * c0,
      doneAt60: (1 - 1 / (1 + k * c0 * 60)) * 100,
    },
  };
}

// ---------- Biology: population growth ----------

/** Logistic growth: N(t) = K / (1 + ((K − N₀)/N₀)·e^(−rt)). Food and space set the cap K. */
function population(v: Values): Result {
  const { rate, capacity, start } = v;
  const T_END = 24;
  const n = (t: number) => capacity / (1 + ((capacity - start) / start) * Math.exp(-rate * t));
  const pts: Point[] = Array.from({ length: 201 }, (_, i) => {
    const t = (i / 200) * T_END;
    return [t, n(t)];
  });
  return {
    series: [{ label: "Population", points: pts }],
    metrics: {
      final: n(T_END),
      timeToHalf: start >= capacity / 2 ? 0 : Math.log((capacity - start) / start) / rate,
    },
  };
}

// ---------- Biology: predators and prey ----------

/**
 * Lotka–Volterra rabbits (prey) and foxes (predators), integrated with RK4.
 * Rabbits breed at `rabbitBirth`; foxes catch rabbits at 0.02 per pair per year, gain 0.01
 * foxes per rabbit eaten per fox, and die at `foxDeath` without food.
 */
function ecosystem(v: Values): Result {
  const { rabbits, foxes, rabbitBirth, foxDeath } = v;
  const CATCH = 0.02;
  const GAIN = 0.01;
  const f = (r: number, x: number): [number, number] => [rabbitBirth * r - CATCH * r * x, GAIN * r * x - foxDeath * x];
  const T_END = 40;
  const dt = 0.01;
  let r = rabbits;
  let x = foxes;
  const pr: Point[] = [[0, r]];
  const px: Point[] = [[0, x]];
  let peakR = r;
  let peakX = x;
  let lowR = r;
  const steps = Math.round(T_END / dt);
  for (let i = 1; i <= steps; i++) {
    const k1 = f(r, x);
    const k2 = f(r + (dt / 2) * k1[0], x + (dt / 2) * k1[1]);
    const k3 = f(r + (dt / 2) * k2[0], x + (dt / 2) * k2[1]);
    const k4 = f(r + dt * k3[0], x + dt * k3[1]);
    r += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    x += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    peakR = Math.max(peakR, r);
    peakX = Math.max(peakX, x);
    lowR = Math.min(lowR, r);
    if (i % 10 === 0) {
      pr.push([i * dt, r]);
      px.push([i * dt, x]);
    }
  }
  return {
    series: [
      { label: "Rabbits", points: downsample(pr) },
      { label: "Foxes", points: downsample(px) },
    ],
    metrics: { peakRabbits: peakR, peakFoxes: peakX, lowestRabbits: lowR },
  };
}

// ---------- Registry ----------

const mass = (def: number): ParamDef => ({ id: "mass", label: "Mass", unit: "kg", min: 0.1, max: 10, step: 0.1, default: def });
const gravity: ParamDef = {
  id: "gravity",
  label: "Gravity",
  unit: "m/s²",
  min: 1,
  max: 25,
  step: 0.1,
  default: G_EARTH,
  presets: gravityPresets,
};
const drag: ParamDef = {
  id: "drag",
  label: "Air resistance",
  unit: "kg/m",
  min: 0,
  max: 0.05,
  step: 0.001,
  default: 0,
  presets: [
    { label: "None", value: 0 },
    { label: "Ball", value: 0.005 },
    { label: "Feather-like", value: 0.05 },
  ],
};

export const templates: Record<TemplateId, Template> = {
  projectile: {
    id: "projectile",
    subject: "physics",
    name: "Projectile motion",
    summary: "Throw a ball: change the angle, speed, gravity and air resistance.",
    params: [
      { id: "angle", label: "Launch angle", unit: "°", min: 5, max: 85, step: 1, default: 45 },
      { id: "speed", label: "Launch speed", unit: "m/s", min: 5, max: 40, step: 1, default: 20 },
      gravity,
      mass(1),
      drag,
    ],
    metrics: [
      { id: "range", label: "Distance travelled", unit: "m" },
      { id: "flightTime", label: "Time in the air", unit: "s" },
      { id: "maxHeight", label: "Highest point", unit: "m" },
    ],
    axes: { x: { label: "Distance", unit: "m" }, y: { label: "Height", unit: "m" } },
    marker: true,
    run: projectile,
  },
  freefall: {
    id: "freefall",
    subject: "physics",
    name: "Free fall",
    summary: "Drop an object: change its mass, the height, gravity and air resistance.",
    params: [{ id: "height", label: "Drop height", unit: "m", min: 1, max: 100, step: 1, default: 20 }, mass(1), gravity, drag],
    metrics: [
      { id: "fallTime", label: "Time to land", unit: "s" },
      { id: "impactSpeed", label: "Speed when it lands", unit: "m/s" },
    ],
    axes: { x: { label: "Time", unit: "s" }, y: { label: "Height", unit: "m" } },
    marker: true,
    run: freefall,
  },
  spring: {
    id: "spring",
    subject: "physics",
    name: "Mass on a spring",
    summary: "Pull a mass on a spring and let go: change the mass, stiffness and damping.",
    params: [
      { id: "mass", label: "Mass", unit: "kg", min: 0.1, max: 5, step: 0.1, default: 1 },
      { id: "stiffness", label: "Spring stiffness", unit: "N/m", min: 1, max: 100, step: 1, default: 20 },
      { id: "amplitude", label: "Pulled down by", unit: "m", min: 0.05, max: 0.5, step: 0.01, default: 0.2 },
      { id: "damping", label: "Damping (friction)", unit: "kg/s", min: 0, max: 2, step: 0.05, default: 0 },
    ],
    metrics: [
      { id: "period", label: "Time for one bounce", unit: "s" },
      { id: "swingLeft", label: "Swing left after 10 s", unit: "%" },
    ],
    axes: { x: { label: "Time", unit: "s" }, y: { label: "Position", unit: "m" } },
    marker: false,
    run: spring,
  },
  reaction: {
    id: "reaction",
    subject: "chemistry",
    name: "Reaction rate",
    summary: "Mix two reactants: change the temperature, concentration and add a catalyst.",
    params: [
      { id: "temperature", label: "Temperature", unit: "°C", min: 0, max: 80, step: 1, default: 25 },
      { id: "concentration", label: "Concentration", unit: "mol/L", min: 0.1, max: 2, step: 0.1, default: 1 },
      {
        id: "catalyst",
        label: "Catalyst",
        unit: "",
        min: 0,
        max: 1,
        step: 1,
        default: 0,
        presets: [
          { label: "None", value: 0 },
          { label: "Added", value: 1 },
        ],
      },
    ],
    metrics: [
      { id: "halfTime", label: "Time to use up half", unit: "s" },
      { id: "initialRate", label: "Starting rate", unit: "mol/(L·s)" },
      { id: "doneAt60", label: "Reacted after 60 s", unit: "%" },
    ],
    axes: { x: { label: "Time", unit: "s" }, y: { label: "Product made", unit: "mol/L" } },
    marker: false,
    run: reaction,
  },
  population: {
    id: "population",
    subject: "biology",
    name: "Population growth",
    summary: "Grow bacteria in a dish: change how fast they divide and how much food there is.",
    params: [
      { id: "rate", label: "Growth rate", unit: "per hour", min: 0.1, max: 2, step: 0.05, default: 0.7 },
      { id: "capacity", label: "Food and space (max population)", unit: "cells", min: 100, max: 5000, step: 100, default: 1000 },
      { id: "start", label: "Starting cells", unit: "cells", min: 1, max: 100, step: 1, default: 10 },
    ],
    metrics: [
      { id: "final", label: "Population after 24 h", unit: "cells" },
      { id: "timeToHalf", label: "Time to reach half the max", unit: "h" },
    ],
    axes: { x: { label: "Time", unit: "h" }, y: { label: "Population", unit: "cells" } },
    marker: false,
    run: population,
  },
  ecosystem: {
    id: "ecosystem",
    subject: "biology",
    name: "Predators and prey",
    summary: "Rabbits and foxes on an island: watch both populations rise and fall.",
    params: [
      { id: "rabbits", label: "Starting rabbits", unit: "", min: 10, max: 200, step: 5, default: 40 },
      { id: "foxes", label: "Starting foxes", unit: "", min: 2, max: 100, step: 1, default: 20 },
      { id: "rabbitBirth", label: "Rabbit birth rate", unit: "per year", min: 0.2, max: 1.5, step: 0.05, default: 0.6 },
      { id: "foxDeath", label: "Fox death rate", unit: "per year", min: 0.1, max: 1.5, step: 0.05, default: 0.5 },
    ],
    metrics: [
      { id: "peakRabbits", label: "Most rabbits", unit: "" },
      { id: "peakFoxes", label: "Most foxes", unit: "" },
      { id: "lowestRabbits", label: "Fewest rabbits", unit: "" },
    ],
    axes: { x: { label: "Time", unit: "years" }, y: { label: "Animals", unit: "" } },
    marker: false,
    run: ecosystem,
  },
};

export const templateIds = Object.keys(templates) as TemplateId[];

/** Template defaults with any overrides applied, clamped to the template's ranges. */
export function valuesFor(t: Template, overrides: Values = {}): Values {
  const out: Values = {};
  for (const p of t.params) {
    const v = overrides[p.id] ?? p.default;
    out[p.id] = Math.min(p.max, Math.max(p.min, v));
  }
  return out;
}
