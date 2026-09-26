export function Traits({ traits, className = '' }: { traits: string[]; className?: string }) {
  if (traits.length === 0) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {traits.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold uppercase text-white"
        >
          {t}
        </span>
      ))}
    </span>
  );
}
