// Pure screen-time rules. No React, no timers: easy to test and to move server-side later.
import rules from "./screentime_rules.json";

export { rules };

export type Level = "low" | "medium" | "high";
export type Need = "focus" | "processing" | "organising" | "predictability";
export type Needs = Record<Need, Level>;
export type TaskType = "teach_back" | "paper_sketch" | "walk_and_listen" | "move_and_recall" | "real_world_link";

export function baseBlockMinutes(needs: Needs): number {
  return rules.focus_block_minutes[needs.focus];
}

/** Warning points, in seconds before the break, largest first. */
export function warningSeconds(needs: Needs): number[] {
  const w = [...rules.warnings_seconds_before_break.always];
  if (needs.predictability === "high") w.push(...rules.warnings_seconds_before_break.predictability_high);
  return [...new Set(w)].sort((a, b) => b - a);
}

/** Break after the block with this 1-based number. */
export function breakAfter(blockNumber: number): { kind: "short" | "long"; minutes: number } {
  return blockNumber % rules.long_break_every_blocks === 0
    ? { kind: "long", minutes: rules.long_break_minutes }
    : { kind: "short", minutes: rules.short_break_minutes };
}

/** Planned schedule up to the daily cap, for the predictable-start view. */
export function schedule(needs: Needs, capMinutes: number) {
  const items: { type: "focus" | "short" | "long"; minutes: number }[] = [];
  const block = baseBlockMinutes(needs);
  let screen = 0;
  for (let n = 1; screen < capMinutes && n < 50; n++) {
    const m = Math.min(block, capMinutes - screen);
    items.push({ type: "focus", minutes: m });
    screen += m;
    if (screen >= capMinutes) break;
    const b = breakAfter(n);
    items.push({ type: b.kind, minutes: b.minutes });
  }
  return items;
}

export function taskScores(needs: Needs): Record<TaskType, number> {
  const w = rules.task_weights;
  const scores = { ...w.base } as Record<TaskType, number>;
  for (const need of ["focus", "processing", "organising"] as const) {
    const mult = rules.need_multiplier[needs[need]];
    for (const [t, v] of Object.entries(w[need])) scores[t as TaskType] += (v as number) * mult;
  }
  return scores;
}

/**
 * Pick a break task type. Predictability=high keeps the last type unless the student changed it.
 * Ties rotate with the break count so unchanging profiles still get variety.
 */
export function chooseTask(needs: Needs, breakIndex: number, lastType?: TaskType): TaskType {
  if (needs.predictability === "high" && lastType) return lastType;
  const scores = taskScores(needs);
  const types = rules.task_types as TaskType[];
  const best = Math.max(...types.map((t) => scores[t]));
  const top = types.filter((t) => scores[t] === best);
  return top[breakIndex % top.length];
}

/** After the recall quiz: keep length if all correct, otherwise shorten and simplify. */
export function adaptAfterRecall(currentMinutes: number, correct: number, total: number) {
  if (correct >= total) return { nextMinutes: currentMinutes, simplify: false };
  const r = rules.recall;
  return { nextMinutes: Math.max(r.min_block_minutes, currentMinutes - r.shorten_by_minutes), simplify: true };
}

export type StruggleSignals = { wrongInARow: number; idleEvents: number; maxReplays: number; overloaded: boolean };
export type StruggleReason = "wrong_answers" | "idle" | "replays" | "overloaded";

export function struggleReason(s: StruggleSignals): StruggleReason | null {
  const r = rules.struggle;
  if (s.overloaded) return "overloaded";
  if (s.wrongInARow >= r.wrong_in_a_row) return "wrong_answers";
  if (s.idleEvents >= r.idle_events_per_block) return "idle";
  if (s.maxReplays >= r.replays_same_content) return "replays";
  return null;
}
