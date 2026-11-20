"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgendaPerson, AgendaSponsor, SessionItem } from "@/lib/appsync";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function calendar(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return { year, month, day, weekday: date.getDay() };
}

function formatDay(iso: string) {
  const date = calendar(iso);
  if (!date) return iso;
  return `${WEEKDAYS[date.weekday]}, ${MONTHS[date.month - 1]} ${date.day}`;
}

function formatTab(iso: string) {
  const date = calendar(iso);
  if (!date) return iso;
  return `${WEEK_SHORT[date.weekday]} ${MONTH_SHORT[date.month - 1]} ${date.day}`;
}

function formatTime(value: string | null) {
  if (!value) return null;
  const clock = value.match(/^(\d{1,2}):(\d{2})/);
  if (clock) {
    const date = new Date();
    date.setHours(Number(clock[1]), Number(clock[2]), 0, 0);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  }
  return value;
}

function timeRange(session: SessionItem) {
  const start = formatTime(session.startTime);
  const end = formatTime(session.endTime);
  if (!start) return "Time to be announced";
  return end ? `${start} – ${end}` : start;
}

function agendaHtml(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/<(?!\/?(?:br|ul|ol|li|p|strong|em|a)\b)[^>]*>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');
}

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function AgendaBoard({ sessions, preview }: { sessions: SessionItem[]; preview: boolean }) {
  const [compact, setCompact] = useState(false);
  const days = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const key = session.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return [...map.entries()];
  }, [sessions]);

  const [active, setActive] = useState(days[0]?.[0] ?? "");
  const current = days.find(([day]) => day === active)?.[1] ?? days[0]?.[1] ?? [];

  return (
    <div>
      {preview && (
        <p className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-deep">
          Published sessions are not in yet. This is the known shape of the two days. Times will be announced.
        </p>
      )}
      <div className="sticky top-20 z-20 rounded-3xl border border-navy/10 bg-paper shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-navy md:text-4xl">2027 Agenda</h2>
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy/55">All times Eastern</p>
            <div className="flex rounded-full bg-cream p-1" role="group" aria-label="Agenda density">
              <button
                type="button"
                onClick={() => setCompact(false)}
                aria-pressed={!compact}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold ${compact ? "text-navy/60" : "bg-navy text-cream"}`}
              >
                Full
              </button>
              <button
                type="button"
                onClick={() => setCompact(true)}
                aria-pressed={compact}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold ${compact ? "bg-navy text-cream" : "text-navy/60"}`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
        {!compact && (
          <div className="flex flex-wrap items-center gap-2 border-t border-navy/10 bg-deep px-5 py-4 md:px-8" role="tablist" aria-label="Agenda days">
            <p className="mr-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-cream/70">Select date</p>
            {days.map(([day]) => {
              const selected = day === (days.some(([key]) => key === active) ? active : days[0]?.[0]);
              return (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(day)}
                  className={`rounded-full px-4 py-2 font-display text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${selected ? "bg-orange text-white" : "bg-white/10 text-cream hover:bg-white/20"}`}
                >
                  {formatTab(day)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {compact ? (
          <motion.div
            key="compact"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex flex-col gap-8"
          >
            {days.map(([day, items]) => (
              <section key={day}>
                <h3 className="rounded-2xl bg-navy px-5 py-4 font-display text-lg font-semibold tracking-wide text-cream md:text-xl">
                  <span className="text-gold">{formatDay(day).split(",")[0]}</span>
                  <span className="text-cream/80"> / {formatDay(day).split(",").slice(1).join(",").trim()}</span>
                </h3>
                <ol className="mt-3 flex flex-col gap-3">
                  {items.map((session) => (
                    <li key={session.id} className="grid gap-2 rounded-2xl border border-navy/10 bg-paper px-5 py-4 lg:grid-cols-[10.5rem_1.2fr_1.4fr_0.9fr] lg:items-start lg:gap-6">
                      <p className="font-display text-sm font-semibold text-orange">{timeRange(session)}</p>
                      <h4 className="font-display text-lg font-semibold tracking-tight text-deep">{session.title}</h4>
                      <p className="text-base leading-snug text-deep/70">{session.description ? plainText(session.description) : ""}</p>
                      <p className="text-base text-navy/70">{session.location}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </motion.div>
        ) : (
          <motion.ol
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex flex-col gap-4"
          >
            {current.map((session) => (
              <li key={session.id} className="rounded-3xl border border-navy/10 bg-paper px-5 py-6 md:px-8">
                <div className="grid gap-4 md:grid-cols-[11rem_1fr] md:gap-8">
                  <div className="md:border-r md:border-navy/10 md:pr-6">
                    <p className="font-display text-xl font-semibold tracking-tight text-orange">{timeRange(session)}</p>
                    {session.preview && (
                      <p className="mt-3 inline-flex rounded-full bg-cream-deep px-2 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-navy">
                        Publishing soon
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-deep">{session.title}</h3>
                    {session.location && <p className="mt-2 text-navy/70">{session.location}</p>}
                    {session.description && (
                      <div
                        className="agenda-html mt-4 max-w-3xl text-lg leading-snug text-deep/80"
                        dangerouslySetInnerHTML={{ __html: agendaHtml(session.description) }}
                      />
                    )}
                    {session.speakers.length > 0 && (
                      <ul className="mt-6 flex flex-wrap gap-6">
                        {session.speakers.map((speaker) => (
                          <Speaker key={speaker.id} speaker={speaker} />
                        ))}
                      </ul>
                    )}
                    {session.sponsors.length > 0 && (
                      <div className="mt-6 border-t border-navy/10 pt-4">
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy/55">Sponsored by</p>
                        <ul className="mt-3 flex flex-wrap items-center gap-6">
                          {session.sponsors.map((sponsor) => (
                            <Sponsor key={sponsor.id} sponsor={sponsor} />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}

function Speaker({ speaker }: { speaker: AgendaPerson }) {
  const initials = speaker.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <li className="flex w-40 flex-col items-center text-center">
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-cream-deep ring-2 ring-navy/10">
        {speaker.photo ? (
          <img src={speaker.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-semibold text-navy">{initials}</span>
        )}
      </div>
      <p className="mt-2 font-display text-sm font-semibold text-deep">{speaker.name}</p>
      <p className="text-base leading-snug text-navy/65">
        {[speaker.title, speaker.company].filter(Boolean).join(" · ")}
      </p>
      {speaker.companyLogo && (
        <img src={speaker.companyLogo} alt="" className="mt-2 h-8 w-auto max-w-24 object-contain" />
      )}
    </li>
  );
}

function Sponsor({ sponsor }: { sponsor: AgendaSponsor }) {
  return (
    <li>
      {sponsor.logo ? (
        <img src={sponsor.logo} alt={sponsor.name} className="h-10 w-auto max-w-36 object-contain" />
      ) : (
        <span className="text-base text-navy/70">{sponsor.name}</span>
      )}
    </li>
  );
}
