import { SWATCHES, colourways, type Animal, type Colourway, type OutfitId, type PipMotion, type SwatchId } from "@/lib/pip";
import { cn } from "@/lib/utils";

/** Static body pose. With motion "none" only "sit" is drawn; the face carries the state. */
export type PipPose = "sit" | "read" | "point" | "rest";
/** One-off move played at a transition. */
export type PipMove = "hop" | "stretch" | "wave" | null;
export type PipFace = "happy" | "look" | "calm" | "sleep" | "joy" | "worried" | "alert" | "cheeky";

type Props = {
  colour: Colourway;
  /** Zodiac animal. Same plush body for all twelve; only ears, tail and markings change. */
  animal?: Animal;
  outfit?: OutfitId | null;
  /** Colour the outfit is worn in (scarf, beret, headphones, sprout). Defaults per outfit. */
  outfitColour?: SwatchId;
  /** "pop" is the cheeky side: same body, tiny horns, a grin, no halo. */
  mode?: "pip" | "pop";
  pose?: PipPose;
  move?: PipMove;
  face?: PipFace;
  motion?: PipMotion;
  /** Slow idle breathing. Ignored unless motion is "full" or "minimal". */
  breathe?: boolean;
  size?: number;
  className?: string;
};

// Arm angles (degrees) around each shoulder. Left arm points left, right arm points right.
const ARMS: Record<PipPose, [number, number]> = {
  sit: [-28, 28],
  read: [-55, 55],
  point: [14, 32],
  rest: [-34, 34],
};

export function PipFigure({
  colour,
  animal = "rabbit",
  outfit = null,
  outfitColour,
  mode = "pip",
  pose = "sit",
  move = null,
  face = "happy",
  motion = "full",
  breathe = false,
  size = 72,
  className,
}: Props) {
  const c = colourways[colour];
  const sw = SWATCHES[outfitColour ?? (outfit === "beret" ? "blue" : outfit === "sprout" ? "green" : "black")];
  const still = motion === "none";
  const p = still ? "sit" : pose;
  const [la, ra] = ARMS[p];
  const pop = mode === "pop";
  return (
    <svg
      viewBox="0 0 80 88"
      width={size}
      height={(size * 88) / 80}
      aria-hidden
      data-motion={motion}
      className={cn(
        "pip-svg overflow-visible",
        !still && move && `pip-move-${move}`,
        !still && breathe && "pip-breathe",
        className,
      )}
    >
      {!pop && motion !== "none" && (
        <circle cx="40" cy="52" r="34" fill="url(#pip-glow)" className="pip-glow" />
      )}
      <defs>
        <radialGradient id="pip-glow">
          <stop offset="0.55" stopColor="#FFF6D8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* ground shadow */}
      <ellipse cx="40" cy="82" rx="17" ry="3" fill="#2B2B2B" opacity="0.12" />

      <g className="pip-whole">
        {outfit === "wings" && (
          <g fill="#FFFFFF" stroke="#7F78A0" strokeWidth="1.3" strokeLinejoin="round">
            <path d="M25 54 C10 60 -2 50 -2 32 C4 37 8 35 10 28 C13 36 17 37 21 34 C18 40 21 45 25 45 Z" />
            <path d="M55 54 C70 60 82 50 82 32 C76 37 72 35 70 28 C67 36 63 37 59 34 C62 40 59 45 55 45 Z" />
          </g>
        )}
        {pop && (
          <path d="M56 70 C64 72 66 64 70 62 L71 58 L66 60" fill="none" stroke={c.line} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}

        <g className="pip-body">
          {/* ears, horns and tail sit behind the body */}
          <AnimalBack animal={animal} c={c} pop={pop} />
          {/* feet */}
          <ellipse cx="32" cy="78" rx="6" ry="3.2" fill={c.shade} stroke={c.line} strokeWidth="1.2" />
          <ellipse cx="48" cy="78" rx="6" ry="3.2" fill={c.shade} stroke={c.line} strokeWidth="1.2" />
          {/* plush body: a wide, soft squircle rather than a tall bean */}
          <path
            d="M40 29 C54 29 61 40 61 54 C61 68 53 78 40 78 C27 78 19 68 19 54 C19 40 26 29 40 29 Z"
            fill={c.body}
            stroke={c.line}
            strokeWidth="1.4"
          />
          <ellipse cx="40.5" cy="64" rx="13" ry="11" fill={c.belly} opacity="0.8" />

          <AnimalFront animal={animal} c={c} />

          {pop && (
            <g fill="#C2410C" stroke="#7C2D12" strokeWidth="1" strokeLinejoin="round">
              <path d="M29 33 L30.5 24.5 L35 30 Z" />
              <path d="M51 33 L49.5 24.5 L45 30 Z" />
            </g>
          )}

          <Face face={pop ? "cheeky" : face} line={c.line} noMouth={animal === "rooster"} />
          <AnimalNose animal={animal} c={c} />

          {outfit === "scarf" && (
            <g>
              <path d="M20.5 58 Q40 64 59.5 58 L59.5 63.5 Q40 69.5 20.5 63.5 Z" fill={sw.fill} stroke={sw.stroke} strokeWidth="1" />
              <path d="M30 60.5 L30 66 M37 61.8 L37 67.4 M44 61.8 L44 67.4 M51 60.5 L51 66" stroke={sw.light} strokeWidth="1.6" />
              <rect x="45" y="63" width="6.5" height="13" rx="2" fill={sw.fill} stroke={sw.stroke} strokeWidth="1" />
            </g>
          )}
          {outfit === "headphones" && (
            <g>
              <path d="M24.5 46 C24.5 22 55.5 22 55.5 46" fill="none" stroke={sw.stroke} strokeWidth="4.2" strokeLinecap="round" />
              <path d="M24.5 46 C24.5 22 55.5 22 55.5 46" fill="none" stroke={sw.fill} strokeWidth="2.2" strokeLinecap="round" />
              <rect x="19" y="40" width="7.5" height="13" rx="3.5" fill={sw.fill} stroke={sw.stroke} strokeWidth="1.2" />
              <rect x="53.5" y="40" width="7.5" height="13" rx="3.5" fill={sw.fill} stroke={sw.stroke} strokeWidth="1.2" />
            </g>
          )}
          {outfit === "beret" && (
            <g>
              <ellipse cx="37" cy="29.5" rx="14.5" ry="4.8" fill={sw.fill} stroke={sw.stroke} strokeWidth="1" transform="rotate(-12 37 29.5)" />
              <circle cx="35" cy="24.6" r="1.6" fill={sw.fill} stroke={sw.stroke} strokeWidth="0.8" />
            </g>
          )}
          {outfit === "sprout" && (
            <g>
              <path d="M40 28 C40 24 40 21 41 17.5" fill="none" stroke={sw.stroke} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M41 19.5 C36.5 15 32.5 16.5 32.5 20 C35.5 21.5 38.5 21.5 41 19.5 Z" fill={sw.fill} stroke={sw.stroke} strokeWidth="1" />
              <path d="M41 18.5 C44.5 13 49 13.5 49.5 17 C46.5 19.5 43.5 19.8 41 18.5 Z" fill={sw.alt} stroke={sw.stroke} strokeWidth="1" />
            </g>
          )}
        </g>

        <g className="pip-arm-l" style={{ transform: `rotate(${la}deg)`, transformOrigin: "25px 52px" }}>
          {/* Pointing arm reaches further: Pip sits bottom-left, so this points off the screen. */}
          {p === "point" ? (
            <rect x="7.5" y="48.5" width="19" height="7" rx="3.5" fill={c.body} stroke={c.line} strokeWidth="1.2" />
          ) : (
            <rect x="13.5" y="48.5" width="13" height="7" rx="3.5" fill={c.body} stroke={c.line} strokeWidth="1.2" />
          )}
        </g>
        <g className="pip-arm-r" style={{ transform: `rotate(${ra}deg)`, transformOrigin: "55px 52px" }}>
          <rect x="53.5" y="48.5" width="13" height="7" rx="3.5" fill={c.body} stroke={c.line} strokeWidth="1.2" />
        </g>
        {p === "read" && (
          <g>
            <path d="M31 60 L40 62 L49 60 L49 70 L40 72 L31 70 Z" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M40 62 L40 72" stroke="#2B2B2B" strokeWidth="1" />
          </g>
        )}

        {!pop && (
          <ellipse
            cx="40"
            cy={Math.min(outfit === "sprout" || outfit === "headphones" ? 4.5 : 9, HALO_Y[animal] ?? 9)}
            rx="9"
            ry="2.6"
            fill="none"
            stroke="#E8B53A"
            strokeWidth="2"
            className="pip-halo"
          />
        )}
      </g>
    </svg>
  );
}

/** `noMouth` leaves the mouth off, for animals with a beak that draws its own. */
function Face({ face, line, noMouth = false }: { face: PipFace; line: string; noMouth?: boolean }) {
  const stroke = { fill: "none", stroke: line, strokeWidth: 1.7, strokeLinecap: "round" as const };
  const dot = (cx: number, cy: number, r = 3.6) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#2B2B2B" />
      <circle cx={cx + 1.1} cy={cy - 1.2} r={r * 0.3} fill="#FFFFFF" />
    </g>
  );
  return (
    <g>
      <ellipse cx="29.5" cy="54" rx="3.2" ry="1.9" fill="#F08A7A" opacity="0.45" />
      <ellipse cx="50.5" cy="54" rx="3.2" ry="1.9" fill="#F08A7A" opacity="0.45" />
      {face === "happy" && (
        <>
          {dot(34, 47)}
          {dot(46, 47)}
          {!noMouth && <path d="M37 53.5 Q40 56.5 43 53.5" {...stroke} />}
        </>
      )}
      {face === "look" && (
        <>
          {dot(32, 47)}
          {dot(44, 47)}
          {!noMouth && <path d="M35.5 53.5 Q38.5 56.5 41.5 53.5" {...stroke} />}
        </>
      )}
      {face === "calm" && (
        <>
          {dot(34, 48.5, 3.2)}
          {dot(46, 48.5, 3.2)}
          {!noMouth && <path d="M38 54.5 L42 54.5" {...stroke} />}
        </>
      )}
      {face === "sleep" && (
        <>
          <path d="M30.5 47.5 Q34 50 37.5 47.5 M42.5 47.5 Q46 50 49.5 47.5" {...stroke} />
          {!noMouth && <path d="M38.5 54 Q40 55.2 41.5 54" {...stroke} />}
          <path d="M57 30 L61 30 L57 35 L61 35" {...stroke} strokeWidth={1.3} />
        </>
      )}
      {face === "joy" && (
        <>
          <path d="M30.5 48.5 Q34 44 37.5 48.5 M42.5 48.5 Q46 44 49.5 48.5" {...stroke} />
          {!noMouth && <path d="M36 52.5 Q40 58.5 44 52.5 Z" fill="#2B2B2B" />}
        </>
      )}
      {face === "worried" && (
        <>
          {dot(34, 47.5)}
          {dot(46, 47.5)}
          <path d="M30.5 41.5 L36.5 40 M49.5 41.5 L43.5 40" {...stroke} />
          {!noMouth && <ellipse cx="40" cy="55" rx="1.6" ry="1.9" fill="#2B2B2B" />}
        </>
      )}
      {face === "alert" && (
        <>
          {dot(34, 46.5, 4.1)}
          {dot(46, 46.5, 4.1)}
          {!noMouth && <path d="M37.5 54.5 Q40 52.5 42.5 54.5" {...stroke} />}
        </>
      )}
      {face === "cheeky" && (
        <>
          {dot(34, 47.5, 3.3)}
          <path d="M42.5 47.5 Q46 45 49.5 47.5" {...stroke} />
          <path d="M30.5 41 L37 43 M49.5 41 L43 43" {...stroke} />
          {!noMouth && <path d="M34.5 52.5 Q40 59.5 46.5 52.5 Z" fill="#2B2B2B" />}
          {!noMouth && <path d="M38.3 53.4 L39.3 55.6 L40.3 53.4" fill="#FFFFFF" />}
        </>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Zodiac animals. One shared plush body; each animal adds ears/horns/tail behind it, markings on
// it, and a nose in front. Everything takes its colours from the chosen colourway.
// ---------------------------------------------------------------------------------------------
type C = (typeof colourways)[Colourway];

/** Halo height per animal, so tall ears and horns never poke through the halo. */
const HALO_Y: Partial<Record<Animal, number>> = { rabbit: 1.5, dragon: 6, rooster: 6, goat: 7 };

const NOSE = "#D9707A";

/** A tail drawn as an outlined stroke: dark line underneath, fur colour on top. */
function Tail({ d, c, w = 4.4 }: { d: string; c: C; w?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={c.line} strokeWidth={w + 2.4} />
      <path d={d} stroke={c.shade} strokeWidth={w} />
    </g>
  );
}

const ol = (c: C) => ({ stroke: c.line, strokeWidth: 1.2, strokeLinejoin: "round" as const });

function AnimalBack({ animal, c, pop }: { animal: Animal; c: C; pop: boolean }) {
  /** Pop only keeps the devil tail, so the animal's own tail is hidden. */
  const t = !pop;
  switch (animal) {
    case "rat":
      return (
        <g>
          {t && <Tail d="M60 72 C71 75 73 64 68 58" c={c} w={1.6} />}
          <circle cx="26" cy="31" r="7.5" fill={c.body} {...ol(c)} />
          <circle cx="54" cy="31" r="7.5" fill={c.body} {...ol(c)} />
          <circle cx="26" cy="31" r="4.4" fill="#F3B6B0" />
          <circle cx="54" cy="31" r="4.4" fill="#F3B6B0" />
        </g>
      );
    case "ox":
      return (
        <g>
          {t && <Tail d="M60 70 C68 70 70 76 67 80" c={c} w={2.4} />}
          <ellipse cx="18.5" cy="39" rx="6" ry="3.2" transform="rotate(22 18.5 39)" fill={c.shade} {...ol(c)} />
          <ellipse cx="61.5" cy="39" rx="6" ry="3.2" transform="rotate(-22 61.5 39)" fill={c.shade} {...ol(c)} />
          <path d="M28 33 C21 33 17 28 18 21 C21 25 25 27 31 28 Z" fill={c.belly} {...ol(c)} />
          <path d="M52 33 C59 33 63 28 62 21 C59 25 55 27 49 28 Z" fill={c.belly} {...ol(c)} />
        </g>
      );
    case "tiger":
      return (
        <g>
          {t && <Tail d="M60 70 C73 70 75 57 68 53" c={c} />}
          <circle cx="27" cy="31" r="6" fill={c.body} {...ol(c)} />
          <circle cx="53" cy="31" r="6" fill={c.body} {...ol(c)} />
          <circle cx="27" cy="31" r="3" fill={c.belly} />
          <circle cx="53" cy="31" r="3" fill={c.belly} />
        </g>
      );
    case "rabbit":
      return (
        <g>
          {t && <circle cx="62" cy="72" r="5" fill={c.belly} {...ol(c)} />}
          <ellipse cx="31" cy="19" rx="5" ry="11.5" transform="rotate(-8 31 19)" fill={c.body} {...ol(c)} />
          <ellipse cx="49" cy="19" rx="5" ry="11.5" transform="rotate(8 49 19)" fill={c.body} {...ol(c)} />
          <ellipse cx="31" cy="20" rx="2.4" ry="8.5" transform="rotate(-8 31 20)" fill="#F3B6B0" />
          <ellipse cx="49" cy="20" rx="2.4" ry="8.5" transform="rotate(8 49 20)" fill="#F3B6B0" />
        </g>
      );
    case "dragon":
      return (
        <g>
          {t && <Tail d="M60 72 C70 77 75 69 71 62" c={c} w={3.4} />}
          {t && <path d="M71 62 L76 58 L75 65 Z" fill="#E8B53A" {...ol(c)} />}
          <path d="M22 40 L11 34 L14 42 L10 48 L22 47 Z" fill={c.shade} {...ol(c)} />
          <path d="M58 40 L69 34 L66 42 L70 48 L58 47 Z" fill={c.shade} {...ol(c)} />
          <path d="M30 31 C27 25 28 20 32 16 C33 21 34 26 36 30 Z" fill="#E8B53A" {...ol(c)} />
          <path d="M50 31 C53 25 52 20 48 16 C47 21 46 26 44 30 Z" fill="#E8B53A" {...ol(c)} />
        </g>
      );
    case "goat":
      return (
        <g>
          {t && <path d="M60 73 L67 68 L66 75 Z" fill={c.shade} {...ol(c)} />}
          <ellipse cx="18.5" cy="40" rx="6" ry="2.8" transform="rotate(18 18.5 40)" fill={c.body} {...ol(c)} />
          <ellipse cx="61.5" cy="40" rx="6" ry="2.8" transform="rotate(-18 61.5 40)" fill={c.body} {...ol(c)} />
          <path d="M30 32 C26 25 28 18 35 15 C32 21 34 26 36 30 Z" fill={c.belly} {...ol(c)} />
          <path d="M50 32 C54 25 52 18 45 15 C48 21 46 26 44 30 Z" fill={c.belly} {...ol(c)} />
        </g>
      );
    case "monkey":
      return (
        <g>
          {t && <Tail d="M60 74 C72 77 75 63 69 58 C66 56 64 59 66 61" c={c} w={3.4} />}
          <circle cx="19" cy="46" r="7" fill={c.body} {...ol(c)} />
          <circle cx="61" cy="46" r="7" fill={c.body} {...ol(c)} />
          <circle cx="19" cy="46" r="3.8" fill={c.belly} />
          <circle cx="61" cy="46" r="3.8" fill={c.belly} />
        </g>
      );
    case "rooster":
      return (
        <g>
          {t && <ellipse cx="65" cy="62" rx="4" ry="10" transform="rotate(28 65 62)" fill={c.shade} {...ol(c)} />}
          {t && <ellipse cx="67" cy="68" rx="3.6" ry="9" transform="rotate(48 67 68)" fill={c.body} {...ol(c)} />}
          {t && <ellipse cx="62" cy="58" rx="3.6" ry="9" transform="rotate(10 62 58)" fill={c.body} {...ol(c)} />}
          <g fill="#D9483B" stroke="#8E2A21" strokeWidth="1.1">
            <circle cx="34.5" cy="27.5" r="3.6" />
            <circle cx="40" cy="24.5" r="4" />
            <circle cx="45.5" cy="27.5" r="3.6" />
          </g>
        </g>
      );
  }
}

/** Markings and muzzles drawn on the body, under the face. */
function AnimalFront({ animal, c }: { animal: Animal; c: C }) {
  const mark = { fill: "none", stroke: c.line, strokeLinecap: "round" as const };
  switch (animal) {
    case "rat":
      return <path d="M22 51 L12 49 M22 54.5 L12 56 M58 51 L68 49 M58 54.5 L68 56" {...mark} strokeWidth="1" />;
    case "ox":
      return <ellipse cx="40" cy="56" rx="11" ry="7" fill={c.belly} />;
    case "tiger":
      return (
        <g>
          <path d="M40 31 L40 38 M34 32 L35.5 37.5 M46 32 L44.5 37.5" {...mark} strokeWidth="2.2" opacity="0.6" />
          <path d="M20 50 L26.5 51 M19.5 57 L26 57.5 M60 50 L53.5 51 M60.5 57 L54 57.5" {...mark} strokeWidth="2.2" opacity="0.6" />
          <ellipse cx="40" cy="55" rx="7.5" ry="4.8" fill={c.belly} />
        </g>
      );
    case "rabbit":
      return <ellipse cx="40" cy="55" rx="7.5" ry="5" fill={c.belly} opacity="0.9" />;
    case "dragon":
      return (
        <g>
          <path d="M33 62 Q40 64.5 47 62 M33.5 67 Q40 69.5 46.5 67 M34.5 72 Q40 74 45.5 72" {...mark} strokeWidth="1.2" opacity="0.4" />
          <path d="M40 29.5 L42 25 L38 25 Z" fill="#E8B53A" stroke={c.line} strokeWidth="0.8" />
        </g>
      );
    case "goat":
      return <path d="M36.5 58 L40 67 L43.5 58 Z" fill={c.belly} {...ol(c)} />;
    case "monkey":
      return (
        <path
          d="M40 40 C34 36 27 39 27 46 C27 52 31 58 40 60.5 C49 58 53 52 53 46 C53 39 46 36 40 40 Z"
          fill={c.belly}
          stroke={c.line}
          strokeWidth="0.8"
        />
      );
    case "rooster":
      return <ellipse cx="40" cy="59" rx="2.4" ry="3.2" fill="#D9483B" stroke="#8E2A21" strokeWidth="0.9" />;
  }
}

/** Noses, beaks and whisker tips, drawn on top of the face. */
function AnimalNose({ animal, c }: { animal: Animal; c: C }) {
  switch (animal) {
    case "rat":
    case "rabbit":
      return <circle cx="40" cy="51.2" r="1.8" fill={NOSE} />;
    case "tiger":
      return <path d="M37.8 50.2 L42.2 50.2 L40 52.6 Z" fill={NOSE} />;
    case "dragon":
      return (
        <g fill={c.line}>
          <circle cx="38.4" cy="51.4" r="0.8" />
          <circle cx="41.6" cy="51.4" r="0.8" />
        </g>
      );
    case "rooster":
      return <path d="M36.5 51 L43.5 51 L40 56.5 Z" fill="#F2A33A" stroke="#A66510" strokeWidth="1" strokeLinejoin="round" />;
    case "ox":
    case "goat":
    case "monkey":
      return <circle cx="40" cy="51.2" r="1.3" fill={c.line} opacity="0.7" />;
  }
}




