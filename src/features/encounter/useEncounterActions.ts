import * as E from '@/lib/encounter';
import { useEncounterStore } from '@/store/encounterStore';
import { useLibraryStore } from '@/store/libraryStore';
import type { Encounter, InitiativeSkill, RemovalReason, ZeroHpOutcome } from '@/types/encounter';
import type { LibraryEntry } from '@/types/library';

/** Store-bound wrappers around the pure encounter functions, with player HP write-back to the library. */
export function useEncounterActions(encId: string) {
  const update = useEncounterStore((s) => s.update);
  const setCurrentHp = useLibraryStore((s) => s.setCurrentHp);
  const current = () => useEncounterStore.getState().encounters[encId];
  const apply = (fn: (enc: Encounter) => Encounter) => update(encId, fn);

  const syncPlayerHp = (enc: Encounter, id: string) => {
    const p = enc.participants[id];
    if (p?.kind === 'player') setCurrentHp(p.templateId, p.currentHp);
  };

  return {
    addNpcs: (entry: LibraryEntry, count: number, batch: boolean) => apply((e) => E.addNpcs(e, entry, count, batch)),
    addPlayer: (entry: LibraryEntry) => apply((e) => E.addPlayer(e, entry)),
    removeFromSetup: (id: string) => apply((e) => E.removeFromSetup(e, id)),
    setInitiative: (id: string, value: number | null) => apply((e) => E.setInitiative(e, id, value)),
    setInitiativeSkill: (id: string, skill: InitiativeSkill) => apply((e) => E.setInitiativeSkill(e, id, skill)),
    roll: (id: string) => apply((e) => E.rollFor(e, id)),
    rollMissingNpcs: () => apply((e) => E.rollMissingNpcs(e)),
    moveTiedPlayer: (id: string, dir: 'up' | 'down') => apply((e) => E.moveTiedPlayer(e, id, dir)),
    start: () => apply(E.startEncounter),
    endTurn: () => apply(E.endTurn),
    delay: () => apply(E.delay),
    queueReturn: (id: string) => apply((e) => E.queueReturn(e, id)),
    unqueueReturn: (id: string) => apply((e) => E.unqueueReturn(e, id)),
    moveInQueue: (id: string, dir: 'up' | 'down') => apply((e) => E.moveInQueue(e, id, dir)),
    /** Returns true when this damage took the participant from above 0 to 0. */
    damage: (id: string, amount: number): boolean => {
      const { encounter, droppedToZero } = E.applyDamage(current(), id, amount);
      apply(() => encounter);
      syncPlayerHp(encounter, id);
      return droppedToZero;
    },
    heal: (id: string, amount: number) => {
      const encounter = E.applyHeal(current(), id, amount);
      apply(() => encounter);
      syncPlayerHp(encounter, id);
    },
    knockOut: (id: string, outcome: ZeroHpOutcome) => apply((e) => E.knockOut(e, id, outcome)),
    remove: (id: string, reason: RemovalReason) => apply((e) => E.removeParticipant(e, id, reason)),
    restore: (id: string) => apply((e) => E.restoreParticipant(e, id)),
    end: () => apply((e) => E.endEncounter(e)),
  };
}
