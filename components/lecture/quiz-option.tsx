import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OptionState = "idle" | "right" | "wrong" | "dim";

export function optionState(picked: number | null, i: number, answer: number): OptionState {
  if (picked === null) return "idle";
  if (i === answer) return "right";
  if (i === picked) return "wrong";
  return "dim";
}

export function QuizOption({
  label,
  state,
  onClick,
  large,
}: {
  label: string;
  state: OptionState;
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={state !== "idle"}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-5 text-left transition-colors duration-150",
        large ? "py-4 text-lg" : "py-3",
        state === "idle" && "border-line bg-surface hover:border-accent",
        state === "right" && "border-accent bg-accent-soft text-accent",
        state === "wrong" && "border-clay bg-clay-soft text-clay",
        state === "dim" && "border-line bg-surface text-muted",
      )}
    >
      {label}
      {state === "right" && <Check className="h-4 w-4 shrink-0" />}
      {state === "wrong" && <X className="h-4 w-4 shrink-0" />}
    </button>
  );
}
