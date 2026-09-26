import type { EntryKind } from './library';
import type { Statblock } from './statblock';

export type RemovalReason = 'dead' | 'ranAway' | 'surrendered';
export const REMOVAL_REASONS: RemovalReason[] = ['dead', 'ranAway', 'surrendered'];

export type ParticipantStatus = 'active' | RemovalReason;

export type ZeroHpOutcome = 'dying' | 'heroicRecovery';

/** Perception, or the name of a skill listed in the statblock's Skills section. */
export type InitiativeSkill = 'perception' | string;

export interface Participant {
  id: string;
  templateId: string;
  /** Display name, e.g. "Goblin Warrior 2". */
  name: string;
  kind: EntryKind;
  /** Snapshot taken when added; library edits never touch a running encounter. */
  statblock: Statblock;
  currentHp: number;
  maxHp: number;
  initiative: number | null;
  initiativeSkill: InitiativeSkill;
  /** Members added together with "Batch initiative" share this id and one roll. */
  initiativeGroupId?: string;
  /** Last d20 shown for reference. */
  lastRoll?: { d20: number; modifier: number };
  delayed: boolean;
  /** Position was changed by Delay/return or being knocked out. */
  initiativeChanged: boolean;
  lastZeroHpOutcome?: ZeroHpOutcome;
  status: ParticipantStatus;
  removedRound?: number;
  addedAt: number;
  /** Setup sort key for ties; starts as addedAt, swapped by move up/down between tied players. */
  tieBreak: number;
}

export type EncounterStatus = 'setup' | 'running' | 'ended';

export interface Encounter {
  id: string;
  name: string;
  status: EncounterStatus;
  round: number;
  participants: Record<string, Participant>;
  /** Ids with status 'active', in turn order. Frozen at start; mutated only by Delay/return/knock-out. */
  order: string[];
  activeId: string | null;
  /** Delayed participants that return at the end of the current turn, in order. */
  pendingReturns: string[];
  createdAt: number;
  endedAt?: number;
}

export type SummaryStatus = 'survived' | RemovalReason;

export interface SummaryRow {
  participant: Participant;
  status: SummaryStatus;
}
