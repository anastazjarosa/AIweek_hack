// All mock data for the demo lives here or in lib/seed. Nothing is fetched or generated.
import seed from "@/lib/seed/biol0104-history-of-life.json";
import type { TaskType } from "@/lib/screentime/engine";

export type Interest = "trains" | "football";

export const interests: { id: Interest; label: string }[] = [
  { id: "trains", label: "Trains" },
  { id: "football", label: "Football" },
];

// ---------- Dashboard ----------

export const user = { name: "Maya", streak: 6 };

/** slug is set only for lectures that open in the demo. */
export type Lecture = { slug?: string; title: string; minutes: number; done: boolean };
export type Module = { id: string; title: string; code: string; progress: number; lectures: Lecture[] };

export const modules: Module[] = [
  {
    id: "biol0104",
    title: "The History of Life",
    code: "BIOL0104",
    progress: 40,
    lectures: [
      { title: "Lecture 2: Fossils and deep time", minutes: 11, done: true },
      { slug: "history-of-life", title: "Lecture 3: The story of life on Earth", minutes: 16, done: false },
      { title: "Lecture 4: How new species form", minutes: 12, done: false },
    ],
  },
  {
    id: "biol0105",
    title: "Evolution in Action",
    code: "BIOL0105",
    progress: 62,
    lectures: [
      { title: "Variation and inheritance", minutes: 12, done: true },
      { title: "Natural selection in the wild", minutes: 10, done: true },
    ],
  },
  {
    id: "biol0106",
    title: "The Fossil Record",
    code: "BIOL0106",
    progress: 38,
    lectures: [
      { title: "How fossils form", minutes: 11, done: true },
      { title: "Reading rock layers", minutes: 9, done: false },
    ],
  },
];

export const todaysPlan = [
  { title: "History of life: deep time", minutes: 5, module: "History of Life" },
  { title: "History of life: the Cambrian explosion", minutes: 4, module: "History of Life" },
  { title: "History of life: flashcards", minutes: 3, module: "History of Life" },
];

export const processingSteps = ["Reading your slides", "Finding key concepts", "Adapting to how you learn"];
// ---------- Lecture: demo module from lib/seed (written once, rendered four ways) ----------

export type Term = { term: string; def: string };
export type Check = { q: string; options: string[]; answer: number; why: string };
export type Section = {
  id: string;
  title: string;
  /** Standard notes: the transcript paragraph for this slide. */
  body: string;
  /** Short sentences: slide bullets, used by the sprint, listen and structured layouts. */
  points: string[];
  terms: Term[];
  check: Check;
  minutes: number;
};

const paragraphs = seed.notes.split("\n\n");

const sections: Section[] = seed.slides.map((sl, i) => {
  const q = seed.quiz.find((x) => x.slide === sl.id)!;
  return {
    id: sl.id,
    title: sl.title,
    body: paragraphs[i],
    points: sl.bullets,
    terms: seed.glossary.filter((g) => g.slide === sl.id).map(({ term, def }) => ({ term, def })),
    check: { q: q.q, options: q.options, answer: q.answer, why: q.why },
    minutes: 2,
  };
});

export const lecture = {
  slug: seed.lecture.slug,
  module: `${seed.module.code} ${seed.module.title}`,
  moduleShort: "History of Life",
  title: seed.lecture.title,
  source: `Lecture ${seed.lecture.number} · ${seed.slides.length} slides`,
  minutes: sections.reduce((n, s) => n + s.minutes, 0),
  nextLecture: { title: "Lecture 4: How new species form", sections: 4, minutes: 12 },
  sections,
  keyIdeas: seed.key_ideas,
  references: seed.references,
  visualMap: seed.visual_map,
  offscreenTasks: seed.offscreen_tasks as { type: TaskType; instruction: string; steps: string[] }[],
  analogy: seed.interest_examples satisfies Record<Interest, { title: string; lines: string[] }>,
  flashcards: seed.glossary.map((g) => ({ front: g.term[0].toUpperCase() + g.term.slice(1), back: g.def })),
};

export type LectureData = typeof lecture;
