// Mock "break-planner agent": builds an off-screen task and recall quiz from the section just
// studied. Deterministic, so the demo behaves the same every time.
import { lecture, type Check, type Interest, type Section } from "@/lib/data";
import type { TaskType } from "./engine";

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

const realWorld: Record<string, string> = {
  definition: "Find something around you that pumps or moves liquid: a tap, a kettle, a garden hose. What happens when the push gets weaker?",
  causes: "Look at a pipe, cable or road near you. What could narrow it or block it, like a narrowed heart artery?",
  symptoms: "Notice how you feel lying flat versus sitting up. Why would fluid in the lungs make lying flat harder?",
  diagnosis: "Find something with a warning light or gauge (a phone battery, a car dashboard). How is that like NT-proBNP?",
  treatment: "Find something with a pressure release: a bottle cap, a tyre valve. Which heart failure drug works like that?",
};

export function sectionForBlock(blockNumber: number): Section {
  return lecture.sections[(blockNumber - 1) % lecture.sections.length];
}

export function planTask(type: TaskType, section: Section, interest: Interest): BreakTask {
  const keyPoints = section.points.slice(0, 3);
  const terms = section.terms.map((t) => t.term);
  switch (type) {
    case "teach_back":
      return {
        type,
        title: taskLabels[type],
        instruction: `Explain “${section.title}” out loud in about a minute, as if to a friend.`,
        steps: [`Try to use: ${terms.join(", ")}.`, "Record it, or just say it to the room.", "Stuck? Start with: “Heart failure is when…”"],
      };
    case "paper_sketch":
      return {
        type,
        title: taskLabels[type],
        instruction: `On paper, draw a mind map of “${section.title}”.`,
        steps: [`Put “${section.title}” in the middle.`, `Add a branch for each of: ${terms.join(", ")}.`, "Add one fact to each branch. Snap a photo if you want to keep it."],
      };
    case "walk_and_listen":
      return {
        type,
        title: taskLabels[type],
        instruction: `Put the phone in your pocket and walk while you listen to a recap of “${section.title}”.`,
        steps: ["The screen dims while you're away.", "Listen once. No need to take notes."],
      };
    case "move_and_recall":
      return {
        type,
        title: taskLabels[type],
        instruction: "Stand up, stretch, and say 3 key points out loud.",
        steps: [`Topic: ${section.title}.`, "Walk to a window or another room while you think.", "Then check yourself below."],
        reveal: keyPoints,
      };
    case "real_world_link":
      return {
        type,
        title: taskLabels[type],
        instruction: realWorld[section.id] ?? "Find an example of this idea in the room around you.",
        steps: [`Linked to: ${section.title}.`, `Example idea: ${lecture.analogy[interest].lines[1]}`],
      };
  }
}

export function planFinalTask(): BreakTask {
  return {
    type: "final_summary",
    title: "Off-screen summary",
    instruction: "You've reached today's screen limit. Close the laptop and say, or write on paper, the 3 things you'll remember from today.",
    steps: ["One thing about what heart failure is.", "One thing about how it's diagnosed.", "One thing about how it's treated."],
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
