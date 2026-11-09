import Image from "next/image";
import type { Speaker, Sponsor } from "@/lib/appsync";
import { Reveal } from "./Reveal";

export function People({ speakers, sponsors }: { speakers: Speaker[]; sponsors: Sponsor[] }) {
  if (speakers.length === 0 && sponsors.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      {speakers.length > 0 && (
        <Reveal>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">Speakers</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-deep">On the program</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((speaker) => (
              <li key={speaker.id} className="rounded-2xl border border-navy/10 bg-paper p-5">
                <div className="flex items-center gap-4">
                  {speaker.photo ? (
                    <Image src={speaker.photo} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-navy font-display text-sm font-semibold text-cream">
                      {speaker.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="font-display text-lg font-semibold tracking-tight">{speaker.name}</p>
                    <p className="text-navy/70">
                      {[speaker.jobTitle, speaker.company].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                {speaker.presentationTitle && (
                  <p className="mt-4 leading-snug text-deep/80">{speaker.presentationTitle}</p>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
      {sponsors.length > 0 && (
        <Reveal className="mt-14">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">Sponsors</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-deep">In the room</h2>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {sponsors.map((sponsor) => {
              const inner = sponsor.logo ? (
                <Image src={sponsor.logo} alt={sponsor.name} width={160} height={48} unoptimized className="max-h-12 w-auto object-contain" />
              ) : (
                <span className="font-display text-sm font-semibold tracking-tight text-navy">{sponsor.name}</span>
              );
              return (
                <li key={sponsor.id} className="grid h-28 place-items-center rounded-2xl border border-navy/10 bg-paper px-4">
                  {sponsor.website ? (
                    <a href={sponsor.website} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
