import type { ReactNode } from 'react';
import type { Statblock } from '@/types/statblock';

export interface SectionProps {
  sb: Statblock;
  patch: (p: Partial<Statblock>) => void;
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
  /** Open on first render. */
  defaultOpen?: boolean;
  /** Short hint shown next to the title, e.g. "2 strikes". */
  summary?: string;
}

/** Collapsible editor section (native <details>). */
export function SectionCard({ title, children, defaultOpen = false, summary }: SectionCardProps) {
  return (
    <details open={defaultOpen} className="group rounded border border-stone-200 bg-white">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-base font-semibold uppercase tracking-wide text-accent">
        <span className="text-xs text-stone-400 transition-transform group-open:rotate-90">▶</span>
        {title}
        {summary && <span className="text-xs font-normal normal-case tracking-normal text-stone-500">{summary}</span>}
      </summary>
      <div className="space-y-3 border-t border-stone-200 p-4">{children}</div>
    </details>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>;
}

/** Immutable helpers for array fields. */
export const replaceAt = <T,>(arr: T[], i: number, v: T): T[] => arr.map((x, j) => (j === i ? v : x));
export const removeAt = <T,>(arr: T[], i: number): T[] => arr.filter((_, j) => j !== i);

/** "3 strikes" / "1 strike" / undefined when empty. */
export const countSummary = (n: number, noun: string): string | undefined =>
  n === 0 ? undefined : `${n} ${noun}${n === 1 ? '' : 's'}`;
