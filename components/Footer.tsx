import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm leading-snug text-cream/75">
            {EVENT.dates}. {EVENT.venue} at {EVENT.campus}. From the team behind the Automotive Packaging Summit.
          </p>
        </div>
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold">Visit</p>
          <p className="mt-3 leading-snug text-cream/80">
            {EVENT.venue}
            <br />
            {EVENT.address}
            <br />
            {EVENT.city}
          </p>
        </div>
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold">Contact</p>
          <p className="mt-3 leading-snug text-cream/80">
            <a className="underline decoration-white/30 underline-offset-4 hover:text-gold" href={`mailto:${EVENT.email}`}>
              {EVENT.email}
            </a>
            <br />
            <a className="underline decoration-white/30 underline-offset-4 hover:text-gold" href="tel:8644125000">
              {EVENT.phone}
            </a>
          </p>
          <div className="mt-5 flex flex-wrap gap-4 font-display text-xs font-semibold uppercase tracking-[0.14em]">
            <Link href="/speak" className="hover:text-gold">Speak</Link>
            <Link href="/sponsor" className="hover:text-gold">Sponsor</Link>
            <Link href="/faq" className="hover:text-gold">FAQ</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-4 font-display text-[0.7rem] uppercase tracking-[0.16em] text-cream/50">
          The Packaging School · Limited seating for the inaugural event
        </p>
      </div>
    </footer>
  );
}
