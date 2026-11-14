// Ready-made simulations. Each is checked against its template when this module loads, so a
// broken spec fails the build and the tests rather than the demo.

import { checkSpec, type SimSpec } from "@/lib/sim/spec";
import type { Subject } from "@/lib/sim/templates";

const raw: unknown[] = [
  // ---------- Physics ----------
  {
    id: "heavier-falls-faster",
    template: "freefall",
    title: "Heavy ball, light ball",
    question: "Do heavier things fall faster?",
    intro: "Drop a ball from a 20 m tower, with no air in the way. Then make it ten times heavier and drop it again.",
    minutes: 2,
    params: { drag: { hidden: true, default: 0 } },
    prediction: {
      prompt: "The ball becomes 10 times heavier (1 kg to 10 kg). What happens to the time it takes to land?",
      param: "mass",
      from: 1,
      to: 10,
      metric: "fallTime",
    },
    explanation:
      "Without air, both balls land at the same moment. A heavier ball is pulled down with more force, but it is also harder to speed up by exactly the same amount, so its acceleration is the same: about 9.8 m/s² on Earth. Galileo argued this, and astronaut David Scott showed it on the Moon in 1971 by dropping a hammer and a feather together.",
    keyIdeas: [
      "Gravity pulls harder on a heavier object",
      "A heavier object needs more force to speed up by the same amount",
      "So every object falls with the same acceleration when there is no air",
    ],
    misconception: "Heavier things fall faster because gravity pulls them more.",
    realWorld: "On the Moon there is no air, so a hammer and a feather dropped together land together.",
  },
  {
    id: "falling-through-air",
    template: "freefall",
    title: "Falling through air",
    question: "Once there's air resistance, does mass matter?",
    intro: "Same 20 m drop, but now the air pushes back on the falling ball. Compare a light ball with a heavy one of the same size.",
    minutes: 2,
    params: { drag: { default: 0.02 } },
    prediction: {
      prompt: "With air resistance on, the ball goes from 0.5 kg to 5 kg (same size). What happens to the time it takes to land?",
      param: "mass",
      from: 0.5,
      to: 5,
      metric: "fallTime",
    },
    explanation:
      "With air, the heavier ball lands sooner. Air resistance depends on the ball's size and speed, not its mass, so the same push from the air slows a light ball much more than a heavy one. The light ball reaches its top speed (terminal velocity) sooner and at a lower speed.",
    keyIdeas: [
      "Air resistance pushes up against the motion and grows with speed",
      "The same air push slows a light object more than a heavy one",
      "Light objects reach a lower top speed, called terminal velocity",
    ],
    misconception: "Mass never matters when things fall.",
    realWorld: "Skydivers spread out to fall slowly, and tuck in to fall fast.",
  },
  {
    id: "best-throwing-angle",
    template: "projectile",
    title: "The best angle to throw",
    question: "Does throwing higher always throw further?",
    intro: "Throw a ball at 20 m/s across flat ground, with no air resistance. Try different angles and watch the path.",
    minutes: 3,
    params: { drag: { hidden: true, default: 0 }, mass: { hidden: true }, gravity: { hidden: true } },
    prediction: {
      prompt: "You raise the throw from 45° to 70°. What happens to how far the ball travels?",
      param: "angle",
      from: 45,
      to: 70,
      metric: "range",
    },
    explanation:
      "A 70° throw lands much closer than a 45° throw. Throwing steeper gives the ball more time in the air, but less of its speed goes forwards. Without air, 45° balances the two and travels furthest, and angles the same distance either side of 45° (like 30° and 60°) land in the same spot.",
    keyIdeas: [
      "The launch speed splits into an upward part and a forward part",
      "Steeper means more time in the air but slower forward speed",
      "Without air, 45° gives the longest distance",
    ],
    misconception: "Throwing higher always makes the ball go further.",
    realWorld: "Shot putters throw at a little under 45° because they release the shot above the ground.",
  },
  {
    id: "throwing-on-the-moon",
    template: "projectile",
    title: "Throwing on the Moon",
    question: "How high could you throw a ball on the Moon?",
    intro: "Throw a ball at 45° and 20 m/s, then switch gravity from Earth to the Moon. There is no air on the Moon.",
    minutes: 2,
    params: { drag: { hidden: true, default: 0 }, mass: { hidden: true } },
    prediction: {
      prompt: "Gravity drops from Earth's 9.8 m/s² to the Moon's 1.6 m/s². What happens to the highest point the ball reaches?",
      param: "gravity",
      from: 9.8,
      to: 1.6,
      metric: "maxHeight",
    },
    explanation:
      "On the Moon the ball goes about six times higher and six times further. Gravity slows the ball's upward motion; with weaker gravity it takes longer to stop rising, so it climbs higher and stays in the air longer. Height and distance both scale with 1 / gravity.",
    keyIdeas: [
      "Gravity slows the ball as it rises and speeds it up as it falls",
      "Weaker gravity means the ball keeps rising for longer",
      "Height and distance go up by the same factor that gravity goes down",
    ],
    realWorld: "Alan Shepard hit golf balls on the Moon in 1971; one flew about 36 m.",
  },
  {
    id: "spring-heavier-mass",
    template: "spring",
    title: "Bouncing on a spring",
    question: "Does a heavier mass bounce faster or slower on a spring?",
    intro: "Hang a mass on a spring, pull it down 20 cm and let go. Watch the position over 10 seconds.",
    minutes: 2,
    params: { damping: { hidden: true, default: 0 } },
    prediction: {
      prompt: "The mass goes from 1 kg to 4 kg on the same spring. What happens to the time for one full bounce?",
      param: "mass",
      from: 1,
      to: 4,
      metric: "period",
    },
    explanation:
      "Four times the mass doubles the time for one bounce. The spring's pull is the same, but a heavier mass speeds up and slows down more gently, so each bounce takes longer. The period is T = 2π√(m/k), so it grows with the square root of the mass.",
    keyIdeas: [
      "The spring pulls back harder the further it is stretched",
      "A heavier mass responds more slowly to the same pull",
      "Period grows with the square root of the mass: 4× mass, 2× time",
    ],
    realWorld: "Car suspension is a spring; a fully loaded car bounces more slowly.",
  },
  {
    id: "spring-friction",
    template: "spring",
    title: "When a spring loses energy",
    question: "Does friction make a spring bounce more slowly?",
    intro: "The same mass and spring, but now friction (damping) takes a little energy away on every bounce.",
    minutes: 2,
    params: {},
    prediction: {
      prompt: "Damping goes from none to 0.5 kg/s. What happens to the time for one full bounce?",
      param: "damping",
      from: 0,
      to: 0.5,
      metric: "period",
    },
    explanation:
      "The swings get smaller, but each one takes almost exactly the same time. Light damping removes energy, so the size of the swing shrinks, while the timing is still set by the mass and the spring. That's why a pendulum clock keeps good time even as its swing dies down.",
    keyIdeas: [
      "Damping removes energy, so the swings get smaller",
      "The time for one bounce is set by the mass and the spring",
      "Light damping barely changes the timing",
    ],
    misconception: "Friction makes each bounce take longer.",
  },

  // ---------- Chemistry ----------
  {
    id: "hotter-reacts-faster",
    template: "reaction",
    title: "Does heat speed up a reaction?",
    question: "Why do reactions go faster when it's hotter?",
    intro: "Two solutions are mixed and react. Track how much product forms over 5 minutes at different temperatures.",
    minutes: 2,
    params: { catalyst: { hidden: true, default: 0 } },
    prediction: {
      prompt: "The temperature goes from 25 °C to 35 °C. What happens to the time it takes to use up half the reactants?",
      param: "temperature",
      from: 25,
      to: 35,
      metric: "halfTime",
    },
    explanation:
      "At 35 °C half the reactants are used up in about half the time. Particles move faster when hot, so they collide more often, and far more of those collisions have enough energy (the activation energy) to react. For many reactions, every 10 °C rise roughly doubles the rate.",
    keyIdeas: [
      "Particles move faster at higher temperatures",
      "More collisions have at least the activation energy",
      "A 10 °C rise roughly doubles the rate for many reactions",
    ],
    misconception: "Heat only makes particles collide more often.",
    realWorld: "Fridges slow down the reactions that make food go off.",
  },
  {
    id: "catalyst",
    template: "reaction",
    title: "Adding a catalyst",
    question: "How does a catalyst speed up a reaction?",
    intro: "Run the reaction at room temperature, then add a catalyst. The catalyst is not used up.",
    minutes: 2,
    params: {},
    prediction: {
      prompt: "You add a catalyst. What happens to how much has reacted after 60 seconds?",
      param: "catalyst",
      from: 0,
      to: 1,
      metric: "doneAt60",
    },
    explanation:
      "With the catalyst, much more has reacted after 60 seconds. A catalyst offers a different route for the reaction with a lower activation energy, so many more collisions are successful at the same temperature. The catalyst itself is not used up, and it doesn't change how much product you finally get.",
    keyIdeas: [
      "A catalyst gives the reaction a route with lower activation energy",
      "More collisions succeed at the same temperature",
      "The catalyst is not used up",
    ],
    misconception: "A catalyst gets used up in the reaction.",
    realWorld: "Enzymes are biological catalysts; a car's catalytic converter cleans exhaust gases.",
  },
  {
    id: "concentration",
    template: "reaction",
    title: "Crowding the particles",
    question: "Why does a stronger solution react faster?",
    intro: "Mix the two solutions at different concentrations and compare how fast product forms at the start.",
    minutes: 2,
    params: { catalyst: { hidden: true, default: 0 } },
    prediction: {
      prompt: "Both solutions go from 0.5 mol/L to 1.5 mol/L. What happens to the starting rate of the reaction?",
      param: "concentration",
      from: 0.5,
      to: 1.5,
      metric: "initialRate",
    },
    explanation:
      "The starting rate goes up about nine times. With three times as many particles of each reactant in the same space, each particle meets three times as many partners, and there are three times as many particles doing the meeting. More collisions per second means a faster reaction.",
    keyIdeas: [
      "Higher concentration means more particles in the same volume",
      "More particles means more collisions per second",
      "Here, 3× each reactant gives 3 × 3 = 9× the starting rate",
    ],
  },

  // ---------- Biology ----------
  {
    id: "bacteria-in-a-dish",
    template: "population",
    title: "Bacteria in a dish",
    question: "Why does a population stop growing?",
    intro: "Put 10 bacteria in a dish of food and watch for 24 hours. Then give them more food and space.",
    minutes: 2,
    params: {},
    prediction: {
      prompt: "The dish holds 4 times as much food (room for 2,000 cells instead of 500). What happens to the population after 24 hours?",
      param: "capacity",
      from: 500,
      to: 2000,
      metric: "final",
    },
    explanation:
      "The population levels off at four times the size. At first each cell divides freely and the population doubles again and again, but as food and space run short, growth slows and stops at the carrying capacity. More food raises that ceiling; it doesn't change how fast cells divide at the start.",
    keyIdeas: [
      "With plenty of food, a population grows faster and faster",
      "Limited food and space slow growth down",
      "The population levels off at the carrying capacity",
    ],
    misconception: "A population keeps growing as long as the cells keep dividing.",
    realWorld: "Yeast in bread dough grows until it runs out of sugar.",
  },
  {
    id: "foxes-and-rabbits",
    template: "ecosystem",
    title: "Foxes and rabbits",
    question: "What happens to predators when their prey breeds faster?",
    intro: "Rabbits eat grass and foxes eat rabbits. Watch both populations rise and fall over 40 years.",
    minutes: 3,
    params: {},
    prediction: {
      prompt: "Rabbits start breeding faster (0.6 to 0.9 per year). What happens to the largest number of foxes?",
      param: "rabbitBirth",
      from: 0.6,
      to: 0.9,
      metric: "peakFoxes",
    },
    explanation:
      "The fox population peaks much higher. More rabbits means more food for foxes, so more fox cubs survive. But then the foxes eat so many rabbits that the rabbits crash, and the foxes crash after them. The two populations chase each other in cycles, with the predator peak always a little after the prey peak.",
    keyIdeas: [
      "More prey means more food, so the predator population grows",
      "More predators eat more prey, so the prey population falls",
      "The cycles repeat, with predators lagging behind prey",
    ],
    misconception: "More prey means everything gets better for both animals forever.",
    realWorld: "Fur-trade records from Canada show lynx and snowshoe hare numbers cycling about every 10 years.",
  },
];

function load(): SimSpec[] {
  return raw.map((r) => {
    const c = checkSpec(r);
    if (!c.ok) throw new Error(`Invalid simulation ${(r as { id?: string }).id}: ${c.errors.join("; ")}`);
    return c.spec;
  });
}

export const library: SimSpec[] = load();

export const subjects: { id: Subject; label: string }[] = [
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "biology", label: "Biology" },
];

export const findSim = (id: string) => library.find((s) => s.id === id);
