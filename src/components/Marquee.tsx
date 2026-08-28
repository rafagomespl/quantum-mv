const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
    <path d="M7 0 L9 5 L14 7 L9 9 L7 14 L5 9 L0 7 L5 5 Z" fill="#4fd8e8" opacity="0.85" />
  </svg>
);

/** letreiro contínuo com aplicações reais de otimização quântica */
export default function Marquee({ items }: { items: string[] }) {
  const row = (keyPrefix: string, hidden: boolean) => (
    <div className="flex items-center gap-8 pr-8" aria-hidden={hidden} key={keyPrefix}>
      {items.map((item, i) => (
        <span
          key={`${keyPrefix}-${i}`}
          className="flex items-center gap-8 font-mono text-sm uppercase tracking-[0.18em] text-mist-300"
        >
          {item}
          <Spark />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y border-line bg-ink-900/60 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="marquee-track flex">
        {row('a', false)}
        {row('b', true)}
      </div>
    </div>
  );
}
