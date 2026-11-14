"use client";

// Planner settings: exams, chosen habit coach, minutes a day. Browser-only demo persistence.

import { useSyncExternalStore } from "react";
import type { Exam, Habit } from "@/lib/planner/plan";
import type { TopicId } from "@/lib/learner/topics";

export type PlannerState = { exams: Exam[]; habit: Habit | null; dailyMinutes: number };

export const PLANNER_KEY = "mosaic-planner-v1";
const DEFAULT: PlannerState = { exams: [], habit: null, dailyMinutes: 40 };

let state: PlannerState | null = null;
const listeners = new Set<() => void>();

function read(): PlannerState {
  if (state) return state;
  try {
    state = { ...DEFAULT, ...JSON.parse(localStorage.getItem(PLANNER_KEY) ?? "{}") };
  } catch {
    state = DEFAULT;
  }
  return state!;
}

function write(patch: Partial<PlannerState>) {
  state = { ...read(), ...patch };
  try {
    localStorage.setItem(PLANNER_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

export const plannerActions = {
  addExam(topic: TopicId, date: string) {
    write({ exams: [...read().exams, { id: `${topic}-${date}-${read().exams.length}`, topic, date }].sort((a, b) => a.date.localeCompare(b.date)) });
  },
  removeExam(id: string) {
    write({ exams: read().exams.filter((e) => e.id !== id) });
  },
  setExams(exams: Exam[]) {
    write({ exams });
  },
  setHabit(habit: Habit | null) {
    write({ habit });
  },
  setDailyMinutes(dailyMinutes: number) {
    write({ dailyMinutes });
  },
  reset() {
    write(DEFAULT);
  },
};

export function usePlanner(): PlannerState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => DEFAULT,
  );
}
