import type { Statblock } from './statblock';

export type EntryKind = 'npc' | 'player';

export interface LibraryEntry {
  id: string;
  kind: EntryKind;
  statblock: Statblock;
  /** Players: current HP carried between encounters. NPCs: always max. */
  currentHp: number;
  createdAt: number;
  updatedAt: number;
}
