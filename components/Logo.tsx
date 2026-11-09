import Image from "next/image";
import Link from "next/link";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const text = tone === "light" ? "text-cream" : "text-deep";
  return (
    <Link href="/" className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
      <Image src="/mark-on-dark.svg" alt="" width={44} height={48} priority className="h-11 w-auto" />
      <span className={`font-display text-[0.72rem] font-bold uppercase leading-tight tracking-[0.14em] ${text}`}>
        Southeastern
        <span className="block">Packaging Summit</span>
      </span>
    </Link>
  );
}
