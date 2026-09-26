import type { Participant } from '@/types/encounter';
import { d20, type Rng } from './dice';

export interface InitiativeRoll {
  d20: number;
  modifier: number;
  total: number;
}

export const rollInitiative = (modifier: number, rng?: Rng): InitiativeRoll => {
  const die = d20(rng);
  return { d20: die, modifier, total: die + modifier };
};

/**
 * Turn order comparator (Player Core, Encounter Mode):
 * higher initiative first; on a tie the enemy (NPC) goes before a PC;
 * otherwise the setup tie-break key (insertion order, adjustable between tied players).
 * Participants without initiative sort last.
 */
export const compareInitiative = (a: Participant, b: Participant): number => {
  const ai = a.initiative ?? Number.NEGATIVE_INFINITY;
  const bi = b.initiative ?? Number.NEGATIVE_INFINITY;
  if (ai !== bi) return bi - ai;
  if (a.kind !== b.kind) return a.kind === 'npc' ? -1 : 1;
  return a.tieBreak - b.tieBreak;
};

export const sortOrder = (participants: Participant[]): string[] =>
  participants
    .filter((p) => p.status === 'active')
    .sort(compareInitiative)
    .map((p) => p.id);

/** Manual reordering is allowed only between two players with the same initiative. */
export const canSwap = (a: Participant, b: Participant): boolean =>
  a.kind === 'player' && b.kind === 'player' && a.initiative !== null && a.initiative === b.initiative;
