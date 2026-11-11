import Image from "next/image";
import type { RibbonLogo } from "@/lib/ribbon";

const marks = [
  "M4 18h28M8 8h8v20H8zM20 12h8v12h-8z",
  "M18 4l12 7v14L18 32 6 25V11z",
  "M6 24c6-14 18-14 24 0M10 16h16",
  "M8 8h20v20H8zM14 14h8v8h-8z",
  "M18 6a12 12 0 100 24 12 12 0 000-24zM18 12v12",
  "M6 26L18 6l12 20H6z",
  "M8 10h20M8 18h14M8 26h20",
  "M10 8h16l4 8-12 14L6 16z",
];

function Placeholder({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-16 text-white" aria-hidden>
      <path d={marks[index % marks.length]} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function LogoRibbon({ logos }: { logos: RibbonLogo[] }) {
  const sequence: (RibbonLogo | number)[] = logos.length > 0 ? [...logos] : marks.map((_, index) => index);
  while (sequence.length < 8) sequence.push(...sequence);
  const loop = [...sequence, ...sequence];

  return (
    <section aria-label="Partner logos" className="relative z-20 mt-8 overflow-hidden py-4">
      <div className="ribbon-track flex w-max items-center gap-20 pr-20">
        {loop.map((item, index) => (
          <div key={index} className="flex h-12 items-center justify-center">
            {typeof item === "number" ? (
              <Placeholder index={item} />
            ) : (
              <Image
                src={item.src}
                alt={item.name}
                width={160}
                height={36}
                unoptimized
                className="h-9 w-auto max-w-40 object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
