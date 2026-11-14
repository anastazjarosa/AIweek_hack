import Link from "next/link";

// Mark: three bars of different lengths, the same content in different shapes.
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-[17px] font-medium tracking-tight">
      <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-accent">
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2.5px] w-3.5 rounded bg-accent-ink" />
          <span className="block h-[2.5px] w-2 rounded bg-accent-ink" />
          <span className="block h-[2.5px] w-3 rounded bg-accent-ink" />
        </span>
      </span>
      Neura
    </Link>
  );
}
