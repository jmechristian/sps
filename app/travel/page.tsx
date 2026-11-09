import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSlot } from "@/components/PhotoSlot";
import { venueShots } from "@/lib/content";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Travel",
  description: "Madren Conference Center at Clemson University. Airports, parking, and where to stay.",
};

const maps = "https://www.google.com/maps/search/?api=1&query=Madren+Conference+Center+230+Madren+Center+Drive+Clemson+SC";

export default function TravelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clemson, South Carolina"
        title="Getting to"
        accent="Madren."
        lede="The summit is at the Madren Conference Center on the Clemson University campus. A hotel block is not booked yet. This page will carry it when it is."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-navy/10 bg-paper p-7">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">Venue</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{EVENT.venue}</h2>
            <p className="mt-3 leading-snug text-deep/80">
              {EVENT.address}
              <br />
              {EVENT.city}
              <br />
              {EVENT.campus}
            </p>
            <p className="mt-3 text-deep/70">
              Venue desk:{" "}
              <a className="underline decoration-orange underline-offset-4" href="tel:8646567155">
                {EVENT.venuePhone}
              </a>
              {" · "}
              <a className="underline decoration-orange underline-offset-4" href="mailto:madren@clemson.edu">
                madren@clemson.edu
              </a>
            </p>
            <a
              href={maps}
              className="mt-5 inline-flex rounded-full bg-navy px-4 py-2 font-display text-sm font-semibold text-cream transition hover:bg-ink"
            >
              Open in Maps
            </a>
          </section>
          <section className="rounded-3xl border border-navy/10 bg-paper p-7">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">Airports</p>
            <ul className="mt-4 space-y-4">
              <li>
                <p className="font-display text-lg font-semibold">Greenville-Spartanburg (GSP)</p>
                <p className="text-deep/75">Closest major airport. About an hour from campus.</p>
              </li>
              <li>
                <p className="font-display text-lg font-semibold">Charlotte (CLT) and Atlanta (ATL)</p>
                <p className="text-deep/75">Longer drives, useful if GSP connections are thin.</p>
              </li>
            </ul>
          </section>
          <section className="rounded-3xl border border-navy/10 bg-paper p-7">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">Stay</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">No room block yet</h2>
            <p className="mt-3 leading-snug text-deep/80">
              The James F. Martin Inn is part of the Conference Center and Inn, on the same property as Madren. Book it or another Clemson hotel on your own until a summit block is posted here.
            </p>
          </section>
          <section className="rounded-3xl border border-navy/10 bg-paper p-7">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">Parking</p>
            <p className="mt-3 leading-snug text-deep/80">
              The Conference Center and Inn has on-site parking. Arrival instructions will be confirmed closer to April 2027.
            </p>
          </section>
        </div>
        <div className="grid gap-4">
          {venueShots.map((shot) => (
            <PhotoSlot key={shot.image} file={shot.image} label={shot.label} caption={shot.caption} />
          ))}
        </div>
      </div>
    </>
  );
}
