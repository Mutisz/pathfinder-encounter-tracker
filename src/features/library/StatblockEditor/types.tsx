import type { ReactNode } from 'react';
import type { Statblock } from '@/types/statblock';

export interface SectionProps {
  sb: Statblock;
  patch: (p: Partial<Statblock>) => void;
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-stone-200 bg-white p-4">
      <h3 className="mb-3 border-b border-stone-200 pb-1 text-base font-semibold uppercase tracking-wide text-accent">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>;
}

/** Immutable helpers for array fields. */
export const replaceAt = <T,>(arr: T[], i: number, v: T): T[] => arr.map((x, j) => (j === i ? v : x));
export const removeAt = <T,>(arr: T[], i: number): T[] => arr.filter((_, j) => j !== i);
