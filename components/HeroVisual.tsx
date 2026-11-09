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
      <div className="absolute left-1/2 top-1/2 h-40 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[18deg] rounded-sm border border-gold/70 bg-navy/80 shadow-[0_30px_60px_rgba(0,0,0,0.35)] [transform:translate(-50%,-50%)_rotateX(58deg)_rotateZ(-28deg)]" />
      <div className="absolute left-[42%] top-[38%] h-16 w-16 rounded-sm border border-cream/80 bg-orange shadow-lg" />
      <div className="absolute left-[56%] top-[30%] h-20 w-14 rounded-sm border border-deep/30 bg-gold shadow-lg" />
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
