import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEncounter } from '@/lib/encounter';
import type { Encounter } from '@/types/encounter';
import type { LibraryEntry } from '@/types/library';

interface EncounterState {
  encounters: Record<string, Encounter>;
  create: (name: string, players: LibraryEntry[]) => Encounter;
  update: (id: string, fn: (enc: Encounter) => Encounter) => void;
  remove: (id: string) => void;
}

export const useEncounterStore = create<EncounterState>()(
  persist(
    (set) => ({
      encounters: {},
      create: (name, players) => {
        const enc = createEncounter(name, players);
        set((s) => ({ encounters: { ...s.encounters, [enc.id]: enc } }));
        return enc;
      },
      update: (id, fn) =>
        set((s) => {
          const prev = s.encounters[id];
          if (!prev) return s;
          const next = fn(prev);
          return next === prev ? s : { encounters: { ...s.encounters, [id]: next } };
        }),
      remove: (id) =>
        set((s) => {
          const encounters = { ...s.encounters };
          delete encounters[id];
          return { encounters };
        }),
    }),
    { name: 'pet:encounters', version: 1 },
  ),
);

/** Encounters newest first; memoized so the snapshot is stable for zustand. */
export const useEncounterList = (): Encounter[] => {
  const encounters = useEncounterStore((s) => s.encounters);
  return useMemo(() => Object.values(encounters).sort((a, b) => b.createdAt - a.createdAt), [encounters]);
};
