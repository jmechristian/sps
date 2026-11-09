"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FaqItem } from "@/lib/content";

export function FaqList({ items }: { items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div>
      <label className="block">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy">Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Registration, labs, hotel, airport"
          className="mt-2 w-full rounded-2xl border border-navy/15 bg-paper px-4 py-3 text-deep outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/25"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="mt-8 text-deep/80" role="status">
          Nothing matches that. Email{" "}
          <a className="text-orange underline underline-offset-4" href="mailto:info@packagingschool.com">
            info@packagingschool.com
          </a>{" "}
          and we will answer it directly.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-navy/10 overflow-hidden rounded-3xl border border-navy/10 bg-paper">
          {filtered.map((item) => {
            const expanded = open === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : item.id)}
                  className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange md:px-7"
                >
                  <span>
                    <span className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-orange">
                      {item.category}
                    </span>
                    <span className="mt-1 block font-display text-lg font-semibold tracking-tight text-deep">
                      {item.question}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: expanded ? 45 : 0 }}
                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy font-display text-lg leading-none text-cream"
                    aria-hidden
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-3xl px-5 pb-6 leading-snug text-deep/80 md:px-7">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
