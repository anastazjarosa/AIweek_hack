import { describe, expect, it } from "vitest";
import { escalate, getEscalation, listEscalations, resolveEscalation } from "@/lib/teacher/store";

describe("teacher checkpoint store", () => {
  it("saves a checkpoint and resolves it exactly once", () => {
    const item = escalate({
      session: "hitl-store-test",
      question: "Why is this unclear?",
      context: "Lecture",
      trigger: "ambiguous",
      reason: "Ambiguous edge case",
      checkpoint: {
        history: [{ role: "user", content: "Earlier question" }],
        contextData: { kind: "lecture" },
        mode: "ask",
        tone: "friendly",
        patterns: [],
        sources: [{ id: "slide-1", title: "Slide 1" }],
        confidence: 0.5,
        draft: "A draft answer.",
      },
    });

    expect(getEscalation(item.id)).toMatchObject({ status: "open", checkpoint: { draft: "A draft answer." } });
    expect(listEscalations("hitl-store-test")[0].id).toBe(item.id);
    expect(resolveEscalation(item.id, "resume", "Reviewed answer", "Use the lecture's example")).toMatchObject({
      status: "answered",
      resolution: { action: "resume", text: "Reviewed answer", guidance: "Use the lecture's example" },
    });
    expect(resolveEscalation(item.id, "answer", "Second answer")).toBeNull();
  });
});
