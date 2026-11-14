// Mock "break-planner agent": builds an off-screen task and recall quiz from the section just
// studied. Deterministic, so the demo behaves the same every time. If this becomes a model call,
// its prompt must include PLANNER_GUARDRAIL.
import { lecture, type Check, type Section } from "@/lib/data";
import type { TaskType } from "./engine";

export const PLANNER_GUARDRAIL =
  "Never infer, guess or mention a medical condition or diagnosis. Describe needs and preferences only.";

export type BreakTask = {
  type: TaskType | "final_summary";
  title: string;
  instruction: string;
  steps: string[];
  /** Hidden until the student chooses to check themselves. */
  reveal?: string[];
};

export const taskLabels: Record<TaskType, string> = {
  teach_back: "Teach it back",
  paper_sketch: "Paper sketch",
  walk_and_listen: "Walk and listen",
  move_and_recall: "Move and recall",
  real_world_link: "Real-world link",
};

export function sectionForBlock(blockNumber: number): Section {
  return lecture.sections[(blockNumber - 1) % lecture.sections.length];
}

/** Off-screen task of the chosen type from the module seed, tied to the section just studied. */
export function planTask(type: TaskType, section: Section): BreakTask {
  const base = lecture.offscreenTasks.find((t) => t.type === type)!;
  return {
    type,
    title: taskLabels[type],
    instruction: base.instruction,
    steps: [`Linked to: ${section.title}.`, ...base.steps],
    reveal: type === "move_and_recall" ? section.points.slice(0, 3) : undefined,
  };
}

export function planFinalTask(): BreakTask {
  return {
    type: "final_summary",
    title: "Off-screen summary",
    instruction: "You've reached today's screen limit. Close the laptop and say, or write on paper, the 3 things you'll remember from today.",
    steps: lecture.keyIdeas.map((_, i) => `Idea ${i + 1}, in your own words.`),
  };
}

/** Two recall questions on a section: its quick check plus a key-term meaning. */
export function recallQuestions(section: Section): Check[] {
  const term = section.terms[0];
  const distractors = lecture.sections
    .filter((s) => s.id !== section.id)
    .map((s) => s.terms[0].def)
    .slice(0, 2);
  const options = [distractors[0], term.def, distractors[1]];
  return [
    section.check,
    {
      q: `What does “${term.term}” mean?`,
      options,
      answer: 1,
      why: `${term.term}: ${term.def}`,
    },
  ];
}
