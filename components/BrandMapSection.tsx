"use client";

import dynamic from "next/dynamic";
import type { BrandPlace } from "@/lib/brand-map";

const BrandMap = dynamic(() => import("./BrandMap").then((mod) => mod.BrandMap), {
  ssr: false,
  loading: () => <div className="mt-8 h-[560px] rounded-3xl bg-white/10" />,
});

export function BrandMapSection({ places }: { places: BrandPlace[] }) {
  if (places.length === 0) {
    return <p className="mt-8 text-cream/75">The regional map is unavailable right now.</p>;
  }
  return <BrandMap places={places} />;
}
