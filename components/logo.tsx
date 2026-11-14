import Link from "next/link";

// Mark: four tiles (the four needs) set around a small warm tile (the learner).
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect x="0" y="0" width="17" height="9" rx="2.5" fill="#2867A6" />
      <rect x="19" y="0" width="9" height="17" rx="2.5" fill="#5B95CF" />
      <rect x="11" y="19" width="17" height="9" rx="2.5" fill="#A8D5F7" />
      <rect x="0" y="11" width="9" height="17" rx="2.5" fill="#D4EAFB" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#F2C14E" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-[17px] font-medium tracking-tight">
      <LogoMark />
      Mosaic
    </Link>
  );
}
