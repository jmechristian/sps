"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SessionItem } from "@/lib/appsync";

function formatDay(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

export function AgendaBoard({ sessions, preview }: { sessions: SessionItem[]; preview: boolean }) {
  const days = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const key = session.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return [...map.entries()];
  }, [sessions]);

  const [active, setActive] = useState(days[0]?.[0] ?? "");
  const current = days.find(([day]) => day === active)?.[1] ?? [];

  return (
    <div>
      {preview && (
        <p className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-deep">
          Published sessions are not in yet. This is the known shape of the two days. Times will be announced.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Agenda days">
        {days.map(([day]) => {
          const selected = day === active;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(day)}
              className={`rounded-full px-4 py-2 font-display text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${selected ? "bg-navy text-cream" : "bg-paper text-navy hover:bg-cream-deep"}`}
            >
              {formatDay(day)}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.ol
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 divide-y divide-navy/10 overflow-hidden rounded-3xl border border-navy/10 bg-paper"
        >
          {current.map((session) => {
            const start = formatTime(session.startTime);
            const end = formatTime(session.endTime);
            const when = start ? (end ? `${start} – ${end}` : start) : "Time to be announced";
            return (
              <li key={session.id} className="grid gap-3 px-5 py-6 md:grid-cols-[11rem_1fr] md:px-8">
                <div>
                  <p className="font-display text-sm font-semibold tracking-wide text-orange">{when}</p>
                  {session.location && (
                    <p className="mt-1 text-navy/70">{session.location}</p>
                  )}
                  {session.preview && (
                    <p className="mt-2 inline-flex rounded-full bg-cream-deep px-2 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-navy">
                      Publishing soon
                    </p>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-deep">{session.title}</h2>
                  {session.description && (
                    <p className="mt-2 max-w-2xl leading-snug text-deep/80">{session.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </motion.ol>
      </AnimatePresence>
    </div>
  );
}
