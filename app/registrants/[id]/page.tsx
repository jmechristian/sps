import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventContent } from "@/lib/appsync";
import { EVENT } from "@/lib/event";
import { ATTENDEE_LABELS, getRegistrant } from "@/lib/registrants";

export const metadata: Metadata = {
  title: "Registration",
  description: "Your Southeastern Packaging Summit registration.",
};

export default function RegistrantPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-5 py-20 text-navy/70">Loading registration…</p>}>
      <RegistrantDashboard params={params} />
    </Suspense>
  );
}

async function RegistrantDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [registrant, content] = await Promise.all([getRegistrant(id), getEventContent()]);
  if (!registrant) notFound();

  const days = new Map<string, typeof content.sessions>();
  for (const session of content.sessions) {
    const key = session.date.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), session]);
  }
  const initials = `${registrant.firstName[0] || ""}${registrant.lastName[0] || ""}`.toUpperCase() || "SP";
  const approved = registrant.status === "APPROVED";
  const label = ATTENDEE_LABELS[registrant.attendeeType] || registrant.attendeeType;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="grid items-start gap-4 rounded-3xl bg-cream-deep p-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <section className="rounded-2xl border border-navy/10 bg-paper px-5 py-6 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-navy font-display text-3xl font-semibold text-cream">{initials}</div>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-deep">
              {registrant.firstName}
              <br />
              {registrant.lastName}
            </h1>
            {registrant.jobTitle && <p className="mt-2 text-base text-deep/80">{registrant.jobTitle}</p>}
            {registrant.company && <p className="text-base text-navy/70">{registrant.company}</p>}
          </section>

          <section className="rounded-2xl border border-navy/10 bg-paper px-5 py-5">
            <h2 className="font-display text-sm font-semibold text-deep">Registration status</h2>
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 font-display text-xs font-semibold uppercase tracking-[0.14em] ${approved ? "bg-navy text-cream" : "bg-gold/25 text-deep"}`}>
              {registrant.status}
            </p>
            <div className="mt-5 divide-y divide-navy/10 overflow-hidden rounded-xl border border-navy/10 text-base">
              <Link href="/agenda" className="block px-4 py-3 font-display text-sm font-semibold text-navy hover:bg-cream">
                View agenda
              </Link>
              <Link href="/travel" className="block px-4 py-3 font-display text-sm font-semibold text-navy hover:bg-cream">
                Travel and venue
              </Link>
            </div>
            <a href={`mailto:${EVENT.email}`} className="mt-4 block rounded-full border border-navy/15 px-4 py-3 text-center font-display text-sm font-semibold text-navy hover:border-orange hover:text-orange">
              Contact organizer
            </a>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-9">
          <section className="rounded-2xl border border-navy/10 bg-paper px-5 py-5">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-deep">{EVENT.name}</h2>
            <p className="mt-1 text-navy/70">
              {EVENT.dates} · {EVENT.city}
            </p>
            <h3 className="mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy">Agenda snapshot</h3>
            <p className="mt-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-navy/50">All times Eastern</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[...days.entries()].map(([day, sessions]) => (
                <div key={day} className="rounded-xl border border-navy/10 px-4 py-3">
                  <p className="font-display text-sm font-semibold text-deep">{formatDay(day)}</p>
                  <ul className="mt-2 space-y-2 text-base text-deep/80">
                    {sessions.slice(0, 4).map((session) => (
                      <li key={session.id}>
                        {timeRange(session.startTime, session.endTime)} {session.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-navy/10 bg-paper px-5 py-5">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy">Registration summary</h2>
            <div className="mt-4 grid gap-4 text-base md:grid-cols-2">
              <div className="space-y-1 text-deep">
                <p>
                  <span className="font-semibold">Name:</span> {registrant.firstName} {registrant.lastName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {registrant.email}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> {registrant.phone}
                </p>
                <p>
                  <span className="font-semibold">Company:</span> {registrant.company}
                </p>
                <p>
                  <span className="font-semibold">Title:</span> {registrant.jobTitle}
                </p>
                <p>
                  <span className="font-semibold">Type:</span> {label}
                </p>
              </div>
              <div className="space-y-1 text-deep">
                <p>
                  <span className="font-semibold">Total amount:</span> ${registrant.totalAmount}
                </p>
                <p>
                  <span className="font-semibold">Status:</span> {registrant.status}
                </p>
                {registrant.discountCode && (
                  <p>
                    <span className="font-semibold">Discount code:</span> {registrant.discountCode}
                  </p>
                )}
                {registrant.paymentConfirmation && (
                  <p>
                    <span className="font-semibold">Payment confirmation:</span> {registrant.paymentConfirmation}
                  </p>
                )}
                {registrant.interests.length > 0 && (
                  <p>
                    <span className="font-semibold">Interests:</span> {registrant.interests.join(", ")}
                  </p>
                )}
                {registrant.otherInterest && (
                  <p>
                    <span className="font-semibold">Other:</span> {registrant.otherInterest}
                  </p>
                )}
              </div>
            </div>
            {registrant.packagingChallenge && (
              <p className="mt-4 text-deep">
                <span className="font-semibold">Bringing:</span> {registrant.packagingChallenge}
              </p>
            )}
            {registrant.buyerQuestion && (
              <p className="mt-2 text-deep">
                <span className="font-semibold">Buying opportunity:</span> {registrant.buyerQuestion}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function formatDay(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjusted = month < 3 ? year - 1 : year;
  const weekday = (adjusted + Math.floor(adjusted / 4) - Math.floor(adjusted / 100) + Math.floor(adjusted / 400) + offsets[month - 1] + day) % 7;
  const weeks = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${weeks[weekday]}, ${months[month - 1]} ${day}`;
}

function clock(value: string | null) {
  if (!value) return "";
  const match = value.match(/(?:^|T)(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hours = Number(match[1]);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${match[2]} ${period}`;
}

function timeRange(start: string | null, end: string | null) {
  const from = clock(start);
  const to = clock(end);
  if (!from) return "";
  return `${from}${to ? `–${to}` : ""}:`;
}
