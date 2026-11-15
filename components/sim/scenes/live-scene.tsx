"use client";

import type { TemplateId } from "@/lib/sim/templates";
import { EcosystemScene, PopulationScene, ReactionScene } from "./life-scenes";
import { FreefallScene, ProjectileScene, SpringScene, type SceneProps } from "./physics-scenes";

const scenes: Record<TemplateId, (p: SceneProps) => React.ReactNode> = {
  projectile: ProjectileScene,
  freefall: FreefallScene,
  spring: SpringScene,
  reaction: ReactionScene,
  population: PopulationScene,
  ecosystem: EcosystemScene,
};

/** The live, animated view of a simulation run, chosen by template. */
export function LiveScene({ template, ...props }: SceneProps & { template: TemplateId }) {
  const Scene = scenes[template];
  return <Scene {...props} />;
}
