// All mock data for the demo lives here or in lib/seed. Nothing is fetched or generated.
import seed from "@/lib/seed/psyc0101-lecture5.json";
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
    id: "psyc0101",
    title: "Introduction to Psychology",
    code: "PSYC0101",
    progress: 40,
    lectures: [
      { title: "Lecture 4: Perception", minutes: 11, done: true },
      { slug: "memory", title: "Lecture 5: How memory works", minutes: 16, done: false },
      { title: "Lecture 6: How we learn", minutes: 12, done: false },
    ],
  },
  {
    id: "cardiology",
    title: "Cardiology",
    code: "MED2041",
    progress: 62,
    lectures: [
      { title: "Heart failure", minutes: 12, done: true },
      { title: "Atrial fibrillation", minutes: 10, done: true },
    ],
  },
  {
    id: "respiratory",
    title: "Respiratory",
    code: "MED2043",
    progress: 38,
    lectures: [
      { title: "Asthma and COPD", minutes: 11, done: true },
      { title: "Pneumonia", minutes: 9, done: false },
    ],
  },
];

export const todaysPlan = [
  { title: "Memory: the forgetting curve", minutes: 5, module: "Psychology" },
  { title: "Memory: the spacing effect", minutes: 4, module: "Psychology" },
  { title: "Memory: flashcards", minutes: 3, module: "Psychology" },
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
  moduleShort: "Psychology",
  title: seed.lecture.title,
  source: `Lecture ${seed.lecture.number} · ${seed.slides.length} slides`,
  minutes: sections.reduce((n, s) => n + s.minutes, 0),
  nextLecture: { title: "Lecture 6: How we learn", sections: 4, minutes: 12 },
  sections,
  keyIdeas: seed.key_ideas,
  references: seed.references,
  visualMap: seed.visual_map,
  offscreenTasks: seed.offscreen_tasks as { type: TaskType; instruction: string; steps: string[] }[],
  analogy: seed.interest_examples satisfies Record<Interest, { title: string; lines: string[] }>,
  flashcards: seed.glossary.map((g) => ({ front: g.term[0].toUpperCase() + g.term.slice(1), back: g.def })),
};

export type LectureData = typeof lecture;
