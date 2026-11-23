"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ROTATE_MS = 3500;

export type ProblemStep = {
  title: string;
  body: string;
  image: string | null;
};

export function ProblemCycle({ steps }: { steps: ProblemStep[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const step = steps[active];

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % steps.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [steps.length, ROTATE_MS]);

  return (
    <div className="rounded-3xl bg-[#e8e6e2] px-8 py-10 shadow-[0_30px_70px_-36px_rgba(7,30,54,0.45)] sm:px-12 sm:py-12">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">From the Packaging School team</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-deep sm:text-5xl">
            Built for the packaging problem you already have.
          </h2>
          <p className="mt-4 max-w-2xl text-xl leading-snug text-deep/75">
            The Packaging School has produced the Automotive Packaging Summit, a sold-out event for the past 10 years. This one is for the Southeast: engineers, providers, and brand teams in the same room.
          </p>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-deep lg:w-[22rem] lg:justify-self-end">
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {step.image ? (
              <Image src={step.image} alt={step.title} fill className="object-cover" sizes="352px" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(145deg,#071e36_0%,#15345e_55%,#e54926_150%)]">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(247,244,239,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(247,244,239,0.2)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <p className="font-display text-5xl font-semibold tracking-tight text-cream">0{active + 1}</p>
                  <p className="mt-2 font-display text-lg font-semibold text-cream">{step.title}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-navy/10 sm:grid-cols-2">
        {steps.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.title}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(index)}
              className={`relative p-7 text-left transition-colors duration-500 ${
                selected ? "bg-deep text-cream" : "bg-paper text-deep"
              }`}
            >
              {selected && (
                <motion.span
                  className="absolute inset-x-0 top-0 h-0.5 origin-left bg-orange"
                  initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={reduce ? { duration: 0 } : { duration: ROTATE_MS / 1000, ease: "linear" }}
                />
              )}
              <p className={`font-display text-sm font-bold ${selected ? "text-gold" : "text-orange"}`}>0{index + 1}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
              <p className={`mt-2 leading-snug ${selected ? "text-cream/75" : "text-deep/75"}`}>{item.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
