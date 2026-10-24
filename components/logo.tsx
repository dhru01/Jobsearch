import Link from "next/link";

export function Logo({ href = "/", tone = "ink" }: { href?: string; tone?: "ink" | "paper" }) {
  const color = tone === "paper" ? "text-bg" : "text-ink";

  return (
    <Link href={href} className={`inline-flex items-baseline gap-2 ${color}`}>
      <span className="h-2.5 w-2.5 translate-y-[-2px] rounded-full bg-accent" aria-hidden="true" />
      <span className="font-display text-[1.65rem] leading-none italic">Fieldwork</span>
    </Link>
  );
}
