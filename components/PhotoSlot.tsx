import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

export function venueImage(file: string) {
  const full = path.join(process.cwd(), "public/venue", file);
  return fs.existsSync(full) ? `/venue/${file}` : null;
}

export function PhotoSlot({
  file,
  label,
  caption,
  className = "",
}: {
  file: string;
  label: string;
  caption?: string;
  className?: string;
}) {
  const src = venueImage(file);
  return (
    <figure className={`overflow-hidden rounded-2xl bg-navy ${className}`}>
      <div className="relative aspect-[4/3]">
        {src ? (
          <Image src={src} alt={label} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 100vw" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#15345e_0%,#0d3f6e_48%,#e54926_140%)]">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(247,244,239,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(247,244,239,0.18)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">Photo</p>
              <p className="mt-1 font-display text-sm font-semibold text-cream">{label}</p>
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="px-4 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-cream/70">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
