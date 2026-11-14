import { colourways, type Colourway, type OutfitId, type PipMotion } from "@/lib/pip";
import { cn } from "@/lib/utils";

/** Static body pose. With motion "none" only "sit" is drawn; the face carries the state. */
export type PipPose = "sit" | "read" | "point" | "rest";
/** One-off move played at a transition. */
export type PipMove = "hop" | "stretch" | "wave" | null;
export type PipFace = "happy" | "look" | "calm" | "sleep" | "joy" | "worried" | "alert" | "cheeky";

type Props = {
  colour: Colourway;
  outfit?: OutfitId | null;
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
  outfit = null,
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
        {outfit === "backpack" && <rect x="50" y="50" width="12" height="19" rx="4" fill="#B8742E" stroke="#6B3F17" strokeWidth="1.2" />}
        {pop && (
          <path d="M56 70 C64 72 66 64 70 62 L71 58 L66 60" fill="none" stroke={c.line} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}

        <g className="pip-body">
          {/* feet */}
          <ellipse cx="33" cy="78" rx="5.5" ry="3" fill={c.shade} stroke={c.line} strokeWidth="1.2" />
          <ellipse cx="47" cy="78" rx="5.5" ry="3" fill={c.shade} stroke={c.line} strokeWidth="1.2" />
          {/* bean body */}
          <path
            d="M40 26 C53 26 58 38 58 52 C58 68 51 78 40 78 C29 78 22 68 22 52 C22 38 27 26 40 26 Z"
            fill={c.body}
            stroke={c.line}
            strokeWidth="1.4"
          />
          <ellipse cx="41" cy="62" rx="11" ry="11.5" fill={c.belly} opacity="0.8" />

          {/* sprout */}
          <path d="M40 27 C40 23 40 20 41 16.5" fill="none" stroke="#4E7F35" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M41 18.5 C36.5 14 32.5 15.5 32.5 19 C35.5 20.5 38.5 20.5 41 18.5 Z" fill="#7DB35A" stroke="#4E7F35" strokeWidth="1" />
          <path d="M41 17.5 C44.5 12 49 12.5 49.5 16 C46.5 18.5 43.5 18.8 41 17.5 Z" fill="#8FC46A" stroke="#4E7F35" strokeWidth="1" />

          {pop && (
            <g fill="#C2410C" stroke="#7C2D12" strokeWidth="1" strokeLinejoin="round">
              <path d="M29 33 L30.5 24.5 L35 30 Z" />
              <path d="M51 33 L49.5 24.5 L45 30 Z" />
            </g>
          )}

          <Face face={pop ? "cheeky" : face} line={c.line} />

          {outfit === "scarf" && (
            <g>
              <path d="M23.5 58 Q40 64 56.5 58 L56.5 63.5 Q40 69.5 23.5 63.5 Z" fill="#D9483B" stroke="#8E2A21" strokeWidth="1" />
              <path d="M30 60.5 L30 66 M37 61.8 L37 67.4 M44 61.8 L44 67.4 M51 60.5 L51 66" stroke="#F6E3C8" strokeWidth="1.6" />
              <rect x="45" y="63" width="6.5" height="13" rx="2" fill="#D9483B" stroke="#8E2A21" strokeWidth="1" />
            </g>
          )}
          {outfit === "backpack" && (
            <path d="M30 41 C29 50 29 60 31 70 M50 41 C51 50 51 60 49 70" fill="none" stroke="#6B3F17" strokeWidth="2.2" strokeLinecap="round" />
          )}
          {outfit === "headphones" && (
            <g>
              <path d="M24.5 46 C24.5 22 55.5 22 55.5 46" fill="none" stroke="#2B2B2B" strokeWidth="3" strokeLinecap="round" />
              <rect x="19" y="40" width="7.5" height="13" rx="3.5" fill="#E07A2E" stroke="#2B2B2B" strokeWidth="1.2" />
              <rect x="53.5" y="40" width="7.5" height="13" rx="3.5" fill="#E07A2E" stroke="#2B2B2B" strokeWidth="1.2" />
            </g>
          )}
          {outfit === "beret" && (
            <g>
              <ellipse cx="37" cy="29.5" rx="14.5" ry="4.8" fill="#3B3B5C" transform="rotate(-12 37 29.5)" />
              <circle cx="35" cy="24.6" r="1.6" fill="#3B3B5C" />
            </g>
          )}
          {outfit === "party_hat" && (
            <g>
              <path d="M44 30.5 L55 8.5 L58.5 33 Z" fill="#5B7FE8" stroke="#2B3F8F" strokeWidth="1" strokeLinejoin="round" />
              <path d="M49 20 L56.5 21.5 M46.8 25.5 L57.5 27.3" stroke="#FFE08A" strokeWidth="1.8" />
              <circle cx="55" cy="8" r="2.6" fill="#FFE08A" stroke="#B88A12" strokeWidth="0.8" />
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
            cy={outfit === "party_hat" || outfit === "headphones" ? 4.5 : 9}
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

function Face({ face, line }: { face: PipFace; line: string }) {
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
          <path d="M37 53.5 Q40 56.5 43 53.5" {...stroke} />
        </>
      )}
      {face === "look" && (
        <>
          {dot(32, 47)}
          {dot(44, 47)}
          <path d="M35.5 53.5 Q38.5 56.5 41.5 53.5" {...stroke} />
        </>
      )}
      {face === "calm" && (
        <>
          {dot(34, 48.5, 3.2)}
          {dot(46, 48.5, 3.2)}
          <path d="M38 54.5 L42 54.5" {...stroke} />
        </>
      )}
      {face === "sleep" && (
        <>
          <path d="M30.5 47.5 Q34 50 37.5 47.5 M42.5 47.5 Q46 50 49.5 47.5" {...stroke} />
          <path d="M38.5 54 Q40 55.2 41.5 54" {...stroke} />
          <path d="M57 30 L61 30 L57 35 L61 35" {...stroke} strokeWidth={1.3} />
        </>
      )}
      {face === "joy" && (
        <>
          <path d="M30.5 48.5 Q34 44 37.5 48.5 M42.5 48.5 Q46 44 49.5 48.5" {...stroke} />
          <path d="M36 52.5 Q40 58.5 44 52.5 Z" fill="#2B2B2B" />
        </>
      )}
      {face === "worried" && (
        <>
          {dot(34, 47.5)}
          {dot(46, 47.5)}
          <path d="M30.5 41.5 L36.5 40 M49.5 41.5 L43.5 40" {...stroke} />
          <ellipse cx="40" cy="55" rx="1.6" ry="1.9" fill="#2B2B2B" />
        </>
      )}
      {face === "alert" && (
        <>
          {dot(34, 46.5, 4.1)}
          {dot(46, 46.5, 4.1)}
          <path d="M37.5 54.5 Q40 52.5 42.5 54.5" {...stroke} />
        </>
      )}
      {face === "cheeky" && (
        <>
          {dot(34, 47.5, 3.3)}
          <path d="M42.5 47.5 Q46 45 49.5 47.5" {...stroke} />
          <path d="M30.5 41 L37 43 M49.5 41 L43 43" {...stroke} />
          <path d="M34.5 52.5 Q40 59.5 46.5 52.5 Z" fill="#2B2B2B" />
          <path d="M38.3 53.4 L39.3 55.6 L40.3 53.4" fill="#FFFFFF" />
        </>
      )}
    </g>
  );
}
