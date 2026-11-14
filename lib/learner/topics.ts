// Study topics that results roll up into. Simulations map by template; the lecture is one topic.

import type { TemplateId } from "@/lib/sim/templates";

export type TopicId = "forces" | "reactions" | "populations" | "history-of-life";

export const topics: Record<TopicId, { label: string; subject: string; practiceHref: string }> = {
  forces: { label: "Forces and motion", subject: "Physics", practiceHref: "/lab/heavier-falls-faster" },
  reactions: { label: "Reaction rates", subject: "Chemistry", practiceHref: "/lab/hotter-reacts-faster" },
  populations: { label: "Populations and ecosystems", subject: "Biology", practiceHref: "/lab/foxes-and-rabbits" },
  "history-of-life": { label: "History of life", subject: "Biology", practiceHref: "/lecture/history-of-life" },
};

export const topicIds = Object.keys(topics) as TopicId[];

export const topicForTemplate = (t: TemplateId | string): TopicId =>
  t === "reaction" ? "reactions" : t === "population" || t === "ecosystem" ? "populations" : "forces";
