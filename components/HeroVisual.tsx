"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function StaticPlate() {
  return (
    <div className="relative h-full min-h-[320px] w-full" aria-hidden>
      <div className="absolute left-[64%] top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-[22%] rounded-full bg-cream shadow-[0_24px_50px_rgba(0,0,0,0.28)]" />
        <div className="absolute inset-0 rounded-full border border-gold/70" />
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cream" />
        <span className="absolute right-[12%] top-[22%] h-1.5 w-1.5 rounded-full bg-gold" />
        <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-orange" />
        <span className="absolute bottom-[16%] left-[18%] h-1.5 w-1.5 rounded-full bg-cream" />
        <span className="absolute left-0 top-[30%] h-1.5 w-1.5 rounded-full bg-gold" />
      </div>
    </div>
  );
}

export function HeroVisual() {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);

  return (
    <div className="relative h-full w-full">
      {reduced ? <StaticPlate /> : <HeroScene />}
    </div>
  );
}
