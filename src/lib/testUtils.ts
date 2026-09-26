import type { Encounter } from '@/types/encounter';
import type { EntryKind, LibraryEntry } from '@/types/library';
import type { Rng } from './dice';
import { blankStatblock } from './statblock';

export const entry = (
  name: string,
  kind: EntryKind,
  opts: { hp?: number; perception?: number; skills?: { name: string; modifier: number }[]; currentHp?: number } = {},
): LibraryEntry => ({
  id: `entry-${name}`,
  kind,
  statblock: {
    ...blankStatblock(),
    name,
    hp: { max: opts.hp ?? 20 },
    perception: { modifier: opts.perception ?? 5, senses: [] },
    skills: opts.skills ?? [],
  },
  currentHp: opts.currentHp ?? opts.hp ?? 20,
  createdAt: 0,
  updatedAt: 0,
});

/** Deterministic rng returning the given die results in sequence. */
export const fixedRng = (...values: number[]): Rng => {
  let i = 0;
  return () => values[i++ % values.length];
};

export const idOf = (enc: Encounter, name: string): string => {
  const p = Object.values(enc.participants).find((x) => x.name === name);
  if (!p) throw new Error(`no participant ${name}`);
  return p.id;
};

export const names = (enc: Encounter, ids: string[] = enc.order): string[] =>
  ids.map((id) => enc.participants[id].name);
