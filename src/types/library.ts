import type { Statblock } from './statblock';

export type EntryKind = 'npc' | 'player';

/** Where an entry was imported from, so a re-import can update it in place. */
export interface ImportSource {
  /** 'pathbuilder' = Pathbuilder 2e export; 'json' = the tracker's own statblock JSON (docs/statblock-json.md). */
  kind: 'pathbuilder' | 'json';
  /** Pathbuilder export id when fetched by id; absent otherwise. */
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
