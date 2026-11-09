export function PageHeader({
  eyebrow,
  title,
  accent,
  lede,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  lede: string;
}) {
  return (
    <header className="relative overflow-hidden bg-deep text-cream">
      <div className="hero-wash absolute inset-0 opacity-90" />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 md:pt-28 md:pb-24">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {title}{" "}
          {accent && <span className="text-orange">{accent}</span>}
        </h1>
        <p className="mt-5 max-w-2xl text-xl leading-snug text-cream/80">{lede}</p>
      </div>
    </header>
  );
}
