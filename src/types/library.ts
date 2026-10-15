import type { Statblock } from './statblock';

export type EntryKind = 'npc' | 'player';

/** Where an entry was imported from, so a re-import can update it in place. */
export interface ImportSource {
  kind: 'pathbuilder';
  /** Pathbuilder export id when fetched by id; absent when pasted. */
  id?: string;
  importedAt: number;
}

export interface LibraryEntry {
  id: string;
  kind: EntryKind;
  statblock: Statblock;
  /** Players: current HP carried between encounters. NPCs: always max. */
  currentHp: number;
  createdAt: number;
  updatedAt: number;
  source?: ImportSource;
}
