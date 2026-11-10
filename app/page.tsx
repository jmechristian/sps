import Link from "next/link";
import { HeroVisual } from "@/components/HeroVisual";
import { LogoRibbon } from "@/components/LogoRibbon";
import { People } from "@/components/People";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Reveal } from "@/components/Reveal";
import { getEventContent } from "@/lib/appsync";
import { audiences, differentiators, pillars, venueShots } from "@/lib/content";
import { EVENT } from "@/lib/event";
import { ribbonLogos } from "@/lib/ribbon";
import { buttonClass, ghostButtonClass } from "@/lib/styles";

const eventLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: EVENT.name,
  startDate: "2027-04-19",
  endDate: "2027-04-20",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  description:
    "Connect southeastern companies with southeastern packaging providers. Cocktail reception April 19 and a one-day summit April 20.",
  location: {
    "@type": "Place",
    name: `${EVENT.venue} at ${EVENT.campus}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: EVENT.address,
      addressLocality: "Clemson",
      addressRegion: "SC",
      postalCode: "29634",
      addressCountry: "US",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "The Packaging School",
    email: EVENT.email,
    telephone: EVENT.phone,
  },
};

export default async function HomePage() {
  const { speakers, sponsors } = await getEventContent();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <div className="relative text-cream">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[122rem]">
          <div className="hero-bloom absolute inset-0" />
        </div>
        <section className="relative">
          <div className="absolute inset-0">
            <HeroVisual />
          </div>
          <div className="relative z-10 mx-auto max-w-[82rem] px-5 pt-10 pb-4 lg:pt-14 lg:pb-2">
            <div className="flex min-h-[420px] items-center lg:min-h-[560px]">
              <div className="w-full lg:w-[calc((100%-1.5rem)*1.55/2.55)]">
                <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-gold">
                  {EVENT.dates} · {EVENT.venue}
                </p>
                <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.88] tracking-[-0.03em] sm:text-[3.5rem] lg:text-[4rem]">
                  Local packaging.
                  <span className="block text-gold">Regional supply chains.</span>
                  <span className="block text-orange">National market readiness.</span>
                </h1>
                <p className="mt-6 max-w-xl text-2xl leading-snug text-cream/80">
                  Connect southeastern companies with southeastern packaging providers in the most innovative packaging space.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/register" className={buttonClass.replace("text-sm", "text-base")}>
                    Registration preview
                  </Link>
                  <Link href="/speak" className={ghostButtonClass.replace("text-sm", "text-base")}>
                    Propose a talk
                  </Link>
                  <Link href="/sponsor" className={ghostButtonClass.replace("text-sm", "text-base")}>
                    Sponsor
                  </Link>
                </div>
                <p className="mt-6 font-display text-sm font-semibold uppercase tracking-[0.16em] text-cream/80">
                  Limited seating · Inaugural event
                </p>
              </div>
            </div>
          </div>
        </section>
        <LogoRibbon logos={ribbonLogos} />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-[82rem] pt-24 pb-10">
        <div className="rounded-3xl bg-[#e8e6e2] px-8 py-10 shadow-[0_30px_70px_-36px_rgba(7,30,54,0.45)] sm:px-12 sm:py-12">
          <Reveal>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">From the Packaging School team</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-deep sm:text-5xl">
              Built for the packaging problem you already have.
            </h2>
            <p className="mt-4 max-w-[66%] text-xl leading-snug text-deep/75">
              The Packaging School has produced the Automotive Packaging Summit, a sold-out event for the past 10 years. This one is for the Southeast: engineers, providers, and brand teams in the same room.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-navy/10 sm:grid-cols-2">
            {differentiators.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05} className="bg-paper p-7">
                <p className="font-display text-sm font-bold text-orange">0{index + 1}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 leading-snug text-deep/75">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-navy text-cream">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">Who should attend</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance">
              A room of people who specify, make, and move packages.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {audiences.map((item) => (
              <Reveal key={item.kicker}>
                <article className="h-full border-t border-gold/50 pt-5">
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">{item.kicker}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 leading-snug text-cream/75">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">Two days</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Reception, then the working day.</h2>
        </Reveal>
        <div className="mt-8 grid overflow-hidden rounded-3xl md:grid-cols-2">
          <article className="bg-deep p-8 text-cream">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-gold">April 19, 2027</p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-tight">Cocktail reception</h3>
            <p className="mt-3 text-cream/75">The first evening. Limited seating for the inaugural event.</p>
          </article>
          <article className="bg-orange p-8 text-white">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-white/80">April 20, 2027</p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-tight">One-day summit</h3>
            <p className="mt-3 text-white/85">Sessions and hands-on Packaging Labs at Madren Conference Center.</p>
          </article>
        </div>
        <Link href="/agenda" className="mt-6 inline-flex font-display text-sm font-semibold tracking-wide text-navy underline decoration-orange decoration-2 underline-offset-4">
          See the agenda
        </Link>
      </section>

      <section className="bg-cream-deep">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-24 md:grid-cols-3">
          {pillars.map((item) => (
            <Reveal key={item.title}>
              <PhotoSlot file={item.image} label={item.label} />
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-deep/75">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <People speakers={speakers} sponsors={sponsors} />

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">The place</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Madren Conference Center at Clemson University.</h2>
          <p className="mt-4 leading-snug text-deep/75">
            {EVENT.address}, {EVENT.city}. The James F. Martin Inn is on site. A hotel block has not been announced yet.
          </p>
          <Link href="/travel" className={`${buttonClass} mt-6`}>
            Travel details
          </Link>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          {venueShots.map((shot) => (
            <PhotoSlot key={shot.image} file={shot.image} label={shot.label} caption={shot.caption} />
          ))}
        </div>
      </section>
    </>
  );
}
