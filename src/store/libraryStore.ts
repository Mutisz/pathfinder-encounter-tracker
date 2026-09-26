import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createId } from '@/lib/dice';
import { blankStatblock } from '@/lib/statblock';
import type { EntryKind, LibraryEntry } from '@/types/library';
import type { Statblock } from '@/types/statblock';

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  createEntry: (kind: EntryKind) => LibraryEntry;
  saveStatblock: (id: string, statblock: Statblock) => void;
  duplicateEntry: (id: string) => LibraryEntry | undefined;
  deleteEntry: (id: string) => void;
  setCurrentHp: (id: string, hp: number) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      entries: {},
      createEntry: (kind) => {
        const now = Date.now();
        const statblock = { ...blankStatblock(), name: kind === 'player' ? 'New player' : 'New NPC' };
        const entry: LibraryEntry = {
          id: createId(),
          kind,
          statblock,
          currentHp: statblock.hp.max,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ entries: { ...s.entries, [entry.id]: entry } }));
        return entry;
      },
      saveStatblock: (id, statblock) =>
        set((s) => {
          const prev = s.entries[id];
          if (!prev) return s;
          const maxChanged = prev.statblock.hp.max !== statblock.hp.max;
          const currentHp = maxChanged ? statblock.hp.max : Math.min(prev.currentHp, statblock.hp.max);
          return {
            entries: { ...s.entries, [id]: { ...prev, statblock, currentHp, updatedAt: Date.now() } },
          };
        }),
      duplicateEntry: (id) => {
        const src = get().entries[id];
        if (!src) return undefined;
        const now = Date.now();
        const copy: LibraryEntry = {
          ...src,
          id: createId(),
          statblock: { ...src.statblock, name: `${src.statblock.name} (copy)` },
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ entries: { ...s.entries, [copy.id]: copy } }));
        return copy;
      },
      deleteEntry: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),
      setCurrentHp: (id, hp) =>
        set((s) => {
          const prev = s.entries[id];
          if (!prev) return s;
          return {
            entries: { ...s.entries, [id]: { ...prev, currentHp: Math.max(0, Math.min(prev.statblock.hp.max, hp)) } },
          };
        }),
    }),
    { name: 'pet:library', version: 1 },
  ),
);

/** Entries sorted by name; memoized so the snapshot is stable for zustand. */
export const useLibraryEntries = (): LibraryEntry[] => {
  const entries = useLibraryStore((s) => s.entries);
  return useMemo(
    () => Object.values(entries).sort((a, b) => a.statblock.name.localeCompare(b.statblock.name)),
    [entries],
  );
};
