import type {
  Encounter,
  InitiativeSkill,
  Participant,
  RemovalReason,
  SummaryRow,
  ZeroHpOutcome,
} from '@/types/encounter';
import type { LibraryEntry } from '@/types/library';
import { createId, type Rng } from './dice';
import { canSwap, rollInitiative, sortOrder } from './initiative';
import { initiativeModifier } from './statblock';

/*
 * Pure functions over Encounter. Every function returns a new Encounter and never mutates its input.
 * Invariant: `order` holds exactly the ids with status 'active' (no duplicates); `activeId` is in `order` or null.
 */

const withParticipant = (enc: Encounter, id: string, patch: Partial<Participant>): Encounter => ({
  ...enc,
  participants: { ...enc.participants, [id]: { ...enc.participants[id], ...patch } },
});

const groupOf = (enc: Encounter, id: string): string[] => {
  const p = enc.participants[id];
  if (!p?.initiativeGroupId) return [id];
  return Object.values(enc.participants)
    .filter((q) => q.initiativeGroupId === p.initiativeGroupId)
    .map((q) => q.id);
};

const patchMany = (enc: Encounter, ids: string[], patch: (p: Participant) => Partial<Participant>): Encounter => ({
  ...enc,
  participants: Object.fromEntries(
    Object.values(enc.participants).map((p) => [p.id, ids.includes(p.id) ? { ...p, ...patch(p) } : p]),
  ),
});

const resort = (enc: Encounter): Encounter =>
  enc.status === 'setup' ? { ...enc, order: sortOrder(Object.values(enc.participants)) } : enc;

// ---------- Setup ----------

const makeParticipant = (
  entry: LibraryEntry,
  name: string,
  now: number,
  extra: Partial<Participant> = {},
): Participant => ({
  id: createId(),
  templateId: entry.id,
  name,
  kind: entry.kind,
  statblock: entry.statblock,
  currentHp: entry.kind === 'player' ? Math.min(entry.currentHp, entry.statblock.hp.max) : entry.statblock.hp.max,
  maxHp: entry.statblock.hp.max,
  initiative: null,
  initiativeSkill: 'perception',
  delayed: false,
  initiativeChanged: false,
  status: 'active',
  addedAt: now,
  tieBreak: now,
  ...extra,
});

export const createEncounter = (name: string, players: LibraryEntry[], now = Date.now()): Encounter => {
  const participants: Record<string, Participant> = {};
  players
    .filter((e) => e.kind === 'player')
    .forEach((entry, i) => {
      const p = makeParticipant(entry, entry.statblock.name, now + i);
      participants[p.id] = p;
    });
  return resort({
    id: createId(),
    name,
    status: 'setup',
    round: 0,
    participants,
    order: [],
    activeId: null,
    pendingReturns: [],
    createdAt: now,
  });
};

/** Adds `count` copies of an NPC. With `batch`, all copies share one initiative group. */
export const addNpcs = (
  enc: Encounter,
  entry: LibraryEntry,
  count: number,
  batch: boolean,
  now = Date.now(),
): Encounter => {
  const existing = Object.values(enc.participants).filter((p) => p.templateId === entry.id).length;
  const groupId = batch && count > 1 ? createId() : undefined;
  const participants = { ...enc.participants };
  for (let i = 0; i < count; i++) {
    const index = existing + i + 1;
    const name = existing + count > 1 ? `${entry.statblock.name} ${index}` : entry.statblock.name;
    const p = makeParticipant(entry, name, now + i, { initiativeGroupId: groupId });
    participants[p.id] = p;
  }
  return resort({ ...enc, participants });
};

/** Setup only: drop a participant entirely (misadded NPC). */
export const removeFromSetup = (enc: Encounter, id: string): Encounter => {
  const participants = { ...enc.participants };
  delete participants[id];
  return resort({ ...enc, participants });
};

export const setInitiative = (enc: Encounter, id: string, value: number | null): Encounter =>
  resort(patchMany(enc, groupOf(enc, id), () => ({ initiative: value, lastRoll: undefined })));

export const setInitiativeSkill = (enc: Encounter, id: string, skill: InitiativeSkill): Encounter =>
  patchMany(enc, groupOf(enc, id), () => ({ initiativeSkill: skill }));

/** Rolls d20 + chosen skill modifier; a batched group shares the single roll. */
export const rollFor = (enc: Encounter, id: string, rng?: Rng): Encounter => {
  const p = enc.participants[id];
  const modifier = initiativeModifier(p.statblock, p.initiativeSkill);
  const roll = rollInitiative(modifier, rng);
  return resort(
    patchMany(enc, groupOf(enc, id), () => ({
      initiative: roll.total,
      lastRoll: { d20: roll.d20, modifier: roll.modifier },
    })),
  );
};

/** Rolls for every NPC (each group once) that has no initiative yet. */
export const rollMissingNpcs = (enc: Encounter, rng?: Rng): Encounter => {
  let result = enc;
  const done = new Set<string>();
  for (const p of Object.values(enc.participants)) {
    if (p.kind !== 'npc' || p.initiative !== null) continue;
    const key = p.initiativeGroupId ?? p.id;
    if (done.has(key)) continue;
    done.add(key);
    result = rollFor(result, p.id, rng);
  }
  return result;
};

/** Setup only: swap a player with its neighbour when both are tied players. */
export const moveTiedPlayer = (enc: Encounter, id: string, direction: 'up' | 'down'): Encounter => {
  if (enc.status !== 'setup') return enc;
  const idx = enc.order.indexOf(id);
  const otherIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || otherIdx < 0 || otherIdx >= enc.order.length) return enc;
  const a = enc.participants[id];
  const b = enc.participants[enc.order[otherIdx]];
  if (!canSwap(a, b)) return enc;
  return resort({
    ...enc,
    participants: {
      ...enc.participants,
      [a.id]: { ...a, tieBreak: b.tieBreak },
      [b.id]: { ...b, tieBreak: a.tieBreak },
    },
  });
};

export const canMoveTiedPlayer = (enc: Encounter, id: string, direction: 'up' | 'down'): boolean => {
  if (enc.status !== 'setup') return false;
  const idx = enc.order.indexOf(id);
  const otherIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || otherIdx < 0 || otherIdx >= enc.order.length) return false;
  return canSwap(enc.participants[id], enc.participants[enc.order[otherIdx]]);
};

export const canStart = (enc: Encounter): boolean =>
  enc.status === 'setup' && enc.order.length > 0 && enc.order.every((id) => enc.participants[id].initiative !== null);

export const startEncounter = (enc: Encounter): Encounter => {
  if (!canStart(enc)) return enc;
  const order = sortOrder(Object.values(enc.participants));
  return {
    ...patchMany(enc, order, () => ({ delayed: false })),
    status: 'running',
    order,
    activeId: order[0],
    round: 1,
    pendingReturns: [],
  };
};

// ---------- Running ----------

/**
 * Ends the active participant's turn. Delayed participants queued to return are placed directly after
 * the active one (in queue order) and the first of them acts next. A delayed participant reached by the
 * marker after a full round acts at its original position (Player Core p.416).
 */
export const finishTurn = (enc: Encounter): Encounter => {
  if (enc.status !== 'running' || enc.activeId === null) return enc;
  const active = enc.participants[enc.activeId];
  const returning = enc.pendingReturns.filter(
    (id) => enc.participants[id]?.status === 'active' && enc.order.includes(id),
  );

  let order = enc.order.filter((id) => !returning.includes(id));
  const activeIdx = order.indexOf(enc.activeId);
  order = [...order.slice(0, activeIdx + 1), ...returning, ...order.slice(activeIdx + 1)];

  let result = patchMany(enc, returning, () => ({
    delayed: false,
    initiativeChanged: true,
    initiative: active.initiative,
  }));

  const nextIdx = (activeIdx + 1) % order.length;
  const nextId = order[nextIdx];
  const round = nextIdx === 0 ? enc.round + 1 : enc.round;
  if (result.participants[nextId].delayed) result = withParticipant(result, nextId, { delayed: false });

  return { ...result, order, activeId: nextId, round, pendingReturns: [] };
};

export const endTurn = finishTurn;

export const canDelay = (enc: Encounter): boolean =>
  enc.status === 'running' && enc.activeId !== null && enc.order.length > 1;

/** Delay: the active participant leaves the visible order (keeping its slot) and the next one acts. */
export const delay = (enc: Encounter): Encounter => {
  if (!canDelay(enc)) return enc;
  return finishTurn(withParticipant(enc, enc.activeId!, { delayed: true }));
};

export const queueReturn = (enc: Encounter, id: string): Encounter => {
  const p = enc.participants[id];
  if (!p?.delayed || enc.pendingReturns.includes(id)) return enc;
  return { ...enc, pendingReturns: [...enc.pendingReturns, id] };
};

export const unqueueReturn = (enc: Encounter, id: string): Encounter => ({
  ...enc,
  pendingReturns: enc.pendingReturns.filter((x) => x !== id),
});

export const moveInQueue = (enc: Encounter, id: string, direction: 'up' | 'down'): Encounter => {
  const q = [...enc.pendingReturns];
  const idx = q.indexOf(id);
  const other = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || other < 0 || other >= q.length) return enc;
  [q[idx], q[other]] = [q[other], q[idx]];
  return { ...enc, pendingReturns: q };
};

export interface DamageResult {
  encounter: Encounter;
  /** True only when HP went from above 0 to exactly 0 with this application. */
  droppedToZero: boolean;
}

export const applyDamage = (enc: Encounter, id: string, amount: number): DamageResult => {
  const p = enc.participants[id];
  const dmg = Math.max(0, Math.floor(amount));
  const hp = Math.max(0, p.currentHp - dmg);
  return {
    encounter: withParticipant(enc, id, { currentHp: hp }),
    droppedToZero: p.currentHp > 0 && hp === 0,
  };
};

export const applyHeal = (enc: Encounter, id: string, amount: number): Encounter => {
  const p = enc.participants[id];
  const heal = Math.max(0, Math.floor(amount));
  return withParticipant(enc, id, { currentHp: Math.min(p.maxHp, p.currentHp + heal) });
};

/**
 * Getting Knocked Out (Player Core): "Move your initiative position to directly before the turn in which
 * you were reduced to 0 HP." The turn is the active participant's. No-op on its own turn.
 */
export const knockOut = (enc: Encounter, id: string, outcome: ZeroHpOutcome): Encounter => {
  let result = withParticipant(enc, id, { lastZeroHpOutcome: outcome });
  if (enc.status !== 'running' || enc.activeId === null || enc.activeId === id || !enc.order.includes(id)) {
    return result;
  }
  const active = enc.participants[enc.activeId];
  const order = enc.order.filter((x) => x !== id);
  const activeIdx = order.indexOf(enc.activeId);
  order.splice(activeIdx, 0, id);
  result = withParticipant(result, id, {
    delayed: false,
    initiativeChanged: true,
    initiative: active.initiative,
  });
  return { ...result, order, pendingReturns: result.pendingReturns.filter((x) => x !== id) };
};

export const removeParticipant = (enc: Encounter, id: string, reason: RemovalReason): Encounter => {
  if (enc.participants[id]?.status !== 'active') return enc;
  let result = enc;
  if (enc.activeId === id && enc.order.length > 1) result = finishTurn(enc);
  const order = result.order.filter((x) => x !== id);
  result = withParticipant(result, id, { status: reason, removedRound: result.round, delayed: false });
  return {
    ...result,
    order,
    activeId: result.activeId === id ? null : result.activeId,
    pendingReturns: result.pendingReturns.filter((x) => x !== id),
  };
};

/** Undo a removal: back into play at the end of the order. */
export const restoreParticipant = (enc: Encounter, id: string): Encounter => {
  const p = enc.participants[id];
  if (!p || p.status === 'active') return enc;
  const result = withParticipant(enc, id, { status: 'active', removedRound: undefined });
  const order = [...enc.order, id];
  return { ...result, order, activeId: enc.activeId ?? id };
};

export const activeNpcCount = (enc: Encounter): number =>
  enc.order.filter((id) => enc.participants[id].kind === 'npc').length;

export const endEncounter = (enc: Encounter, now = Date.now()): Encounter => ({
  ...enc,
  status: 'ended',
  endedAt: now,
  activeId: null,
  pendingReturns: [],
});

export const summary = (enc: Encounter): SummaryRow[] =>
  Object.values(enc.participants)
    .sort((a, b) => a.addedAt - b.addedAt)
    .map((participant) => ({
      participant,
      status: participant.status === 'active' ? 'survived' : participant.status,
    }));

export const visibleOrder = (enc: Encounter): Participant[] =>
  enc.order.map((id) => enc.participants[id]).filter((p) => !p.delayed);

export const delayedParticipants = (enc: Encounter): Participant[] =>
  enc.order.map((id) => enc.participants[id]).filter((p) => p.delayed);

export const removedParticipants = (enc: Encounter): Participant[] =>
  Object.values(enc.participants)
    .filter((p) => p.status !== 'active')
    .sort((a, b) => (a.removedRound ?? 0) - (b.removedRound ?? 0));

/** Setup only: add a player created after the encounter (or previously removed from setup). */
export const addPlayer = (enc: Encounter, entry: LibraryEntry, now = Date.now()): Encounter => {
  if (Object.values(enc.participants).some((p) => p.templateId === entry.id)) return enc;
  const p = makeParticipant(entry, entry.statblock.name, now);
  return resort({ ...enc, participants: { ...enc.participants, [p.id]: p } });
};
