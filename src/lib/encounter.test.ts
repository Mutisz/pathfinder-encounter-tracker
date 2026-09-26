import { describe, expect, it } from 'vitest';
import {
  addNpcs,
  applyDamage,
  applyHeal,
  canDelay,
  canStart,
  createEncounter,
  delay,
  delayedParticipants,
  endEncounter,
  endTurn,
  knockOut,
  moveInQueue,
  queueReturn,
  removeParticipant,
  restoreParticipant,
  setInitiative,
  startEncounter,
  summary,
  unqueueReturn,
  visibleOrder,
} from './encounter';
import { entry, idOf, names } from './testUtils';

/** A, B, C, D in that order (A=20 player, B=15 npc, C=10 player, D=5 npc). */
const running = () => {
  let enc = createEncounter('t', [entry('A', 'player'), entry('C', 'player', { hp: 30, currentHp: 25 })], 1000);
  enc = addNpcs(enc, entry('B', 'npc'), 1, false, 2000);
  enc = addNpcs(enc, entry('D', 'npc'), 1, false, 3000);
  enc = setInitiative(enc, idOf(enc, 'A'), 20);
  enc = setInitiative(enc, idOf(enc, 'B'), 15);
  enc = setInitiative(enc, idOf(enc, 'C'), 10);
  enc = setInitiative(enc, idOf(enc, 'D'), 5);
  return startEncounter(enc);
};

const activeName = (enc: ReturnType<typeof running>) => enc.participants[enc.activeId!].name;

describe('start', () => {
  it('requires every initiative to be set', () => {
    let enc = createEncounter('t', [entry('A', 'player')], 0);
    expect(canStart(enc)).toBe(false);
    enc = setInitiative(enc, idOf(enc, 'A'), 3);
    expect(canStart(enc)).toBe(true);
  });

  it('uses the player library HP as current HP', () => {
    const enc = running();
    expect(enc.participants[idOf(enc, 'C')].currentHp).toBe(25);
    expect(enc.participants[idOf(enc, 'C')].maxHp).toBe(30);
  });

  it('starts at round 1 with the first participant active', () => {
    const enc = running();
    expect(names(enc)).toEqual(['A', 'B', 'C', 'D']);
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(1);
  });
});

describe('end turn', () => {
  it('advances and increments the round on wrap', () => {
    let enc = running();
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('B');
    enc = endTurn(endTurn(enc));
    expect(activeName(enc)).toBe('D');
    expect(enc.round).toBe(1);
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(2);
  });
});

describe('delay', () => {
  it('moves the active participant to the delayed list and advances', () => {
    let enc = endTurn(running()); // B active
    enc = delay(enc);
    expect(activeName(enc)).toBe('C');
    expect(
      names(
        enc,
        delayedParticipants(enc).map((p) => p.id),
      ),
    ).toEqual(['B']);
    expect(visibleOrder(enc).map((p) => p.name)).toEqual(['A', 'C', 'D']);
  });

  it('cannot delay when alone in the order', () => {
    let enc = createEncounter('t', [entry('A', 'player')], 0);
    enc = startEncounter(setInitiative(enc, idOf(enc, 'A'), 1));
    expect(canDelay(enc)).toBe(false);
  });

  it('returns directly after the active participant at the end of its turn', () => {
    let enc = delay(endTurn(running())); // B delayed, C active
    enc = endTurn(enc); // D active
    enc = queueReturn(enc, idOf(enc, 'B'));
    enc = endTurn(enc); // end of D's turn -> B returns after D and acts
    expect(activeName(enc)).toBe('B');
    expect(names(enc)).toEqual(['A', 'C', 'D', 'B']);
    expect(enc.round).toBe(1);
    expect(enc.participants[idOf(enc, 'B')].delayed).toBe(false);
    expect(enc.participants[idOf(enc, 'B')].initiativeChanged).toBe(true);
    expect(enc.participants[idOf(enc, 'B')].initiative).toBe(5);
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(2);
  });

  it('keeps the original slot until the return resolves (un-return)', () => {
    let enc = delay(endTurn(running())); // B delayed, C active
    enc = queueReturn(enc, idOf(enc, 'B'));
    enc = unqueueReturn(enc, idOf(enc, 'B'));
    enc = endTurn(enc); // D active, B still delayed
    expect(activeName(enc)).toBe('D');
    expect(enc.participants[idOf(enc, 'B')].delayed).toBe(true);
  });

  it('returns several delayed participants in queue order', () => {
    let enc = delay(running()); // A delayed, B active
    enc = delay(enc); // B delayed, C active
    enc = queueReturn(enc, idOf(enc, 'A'));
    enc = queueReturn(enc, idOf(enc, 'B'));
    enc = moveInQueue(enc, idOf(enc, 'B'), 'up');
    expect(names(enc, enc.pendingReturns)).toEqual(['B', 'A']);
    enc = endTurn(enc); // end of C's turn
    expect(names(enc)).toEqual(['C', 'B', 'A', 'D']);
    expect(activeName(enc)).toBe('B');
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('A');
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('D');
    expect(enc.round).toBe(1);
  });

  it('acts at its original position if it never returns (full round)', () => {
    let enc = delay(endTurn(running())); // B delayed at slot 2, C active
    enc = endTurn(endTurn(enc)); // D, then A (round 2)
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(2);
    enc = endTurn(enc); // marker reaches B
    expect(activeName(enc)).toBe('B');
    expect(enc.participants[idOf(enc, 'B')].delayed).toBe(false);
    expect(names(enc)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('handles the last participant delaying', () => {
    let enc = endTurn(endTurn(endTurn(running()))); // D active
    enc = delay(enc);
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(2);
    enc = queueReturn(enc, idOf(enc, 'D'));
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('D');
    expect(names(enc)).toEqual(['A', 'D', 'B', 'C']);
  });
});

describe('hp', () => {
  it('clamps damage at 0 and reports the drop only once', () => {
    let enc = running();
    const id = idOf(enc, 'B');
    let r = applyDamage(enc, id, 15);
    expect(r.encounter.participants[id].currentHp).toBe(5);
    expect(r.droppedToZero).toBe(false);
    r = applyDamage(r.encounter, id, 50);
    expect(r.encounter.participants[id].currentHp).toBe(0);
    expect(r.droppedToZero).toBe(true);
    r = applyDamage(r.encounter, id, 3);
    expect(r.droppedToZero).toBe(false);
    enc = applyHeal(r.encounter, id, 999);
    expect(enc.participants[id].currentHp).toBe(20);
  });
});

describe('knock out', () => {
  it('moves the dropped participant directly before the active one (from later in the order)', () => {
    let enc = endTurn(running()); // B active
    enc = knockOut(enc, idOf(enc, 'D'), 'dying');
    expect(names(enc)).toEqual(['A', 'D', 'B', 'C']);
    expect(activeName(enc)).toBe('B');
    expect(enc.participants[idOf(enc, 'D')].lastZeroHpOutcome).toBe('dying');
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('C');
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('A');
    expect(enc.round).toBe(2);
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('D');
  });

  it('moves it from earlier in the order too, keeping the round count right', () => {
    let enc = endTurn(endTurn(running())); // C active
    enc = knockOut(enc, idOf(enc, 'A'), 'heroicRecovery');
    expect(names(enc)).toEqual(['B', 'A', 'C', 'D']);
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('D');
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('B');
    expect(enc.round).toBe(2);
  });

  it('is a no-op on its own turn', () => {
    const enc = endTurn(running());
    expect(names(knockOut(enc, idOf(enc, 'B'), 'dying'))).toEqual(['A', 'B', 'C', 'D']);
  });

  it('pulls a delayed or queued participant back into the order', () => {
    let enc = delay(running()); // A delayed, B active
    enc = queueReturn(enc, idOf(enc, 'A'));
    enc = knockOut(enc, idOf(enc, 'A'), 'dying');
    expect(enc.participants[idOf(enc, 'A')].delayed).toBe(false);
    expect(enc.pendingReturns).toEqual([]);
    expect(names(enc)).toEqual(['A', 'B', 'C', 'D']);
    enc = endTurn(enc);
    expect(activeName(enc)).toBe('C');
  });
});

describe('remove and restore', () => {
  it('removes a non-active participant', () => {
    let enc = running();
    enc = removeParticipant(enc, idOf(enc, 'D'), 'ranAway');
    expect(names(enc)).toEqual(['A', 'B', 'C']);
    expect(enc.participants[idOf(enc, 'D')].status).toBe('ranAway');
    expect(enc.participants[idOf(enc, 'D')].removedRound).toBe(1);
  });

  it('ends the turn first when removing the active participant', () => {
    let enc = endTurn(running()); // B active
    enc = removeParticipant(enc, idOf(enc, 'B'), 'dead');
    expect(activeName(enc)).toBe('C');
    expect(names(enc)).toEqual(['A', 'C', 'D']);
  });

  it('removes a delayed participant and its pending return', () => {
    let enc = delay(running());
    enc = queueReturn(enc, idOf(enc, 'A'));
    enc = removeParticipant(enc, idOf(enc, 'A'), 'surrendered');
    expect(enc.pendingReturns).toEqual([]);
    expect(names(enc)).toEqual(['B', 'C', 'D']);
    expect(activeName(enc)).toBe('B');
  });

  it('leaves no active participant when the last one is removed', () => {
    let enc = createEncounter('t', [entry('A', 'player')], 0);
    enc = startEncounter(setInitiative(enc, idOf(enc, 'A'), 1));
    enc = removeParticipant(enc, idOf(enc, 'A'), 'dead');
    expect(enc.activeId).toBeNull();
    expect(enc.order).toEqual([]);
    expect(endTurn(enc)).toBe(enc);
    enc = restoreParticipant(enc, idOf(enc, 'A'));
    expect(enc.activeId).toBe(idOf(enc, 'A'));
  });

  it('restores at the end of the order', () => {
    let enc = running();
    enc = removeParticipant(enc, idOf(enc, 'B'), 'dead');
    enc = restoreParticipant(enc, idOf(enc, 'B'));
    expect(names(enc)).toEqual(['A', 'C', 'D', 'B']);
    expect(enc.participants[idOf(enc, 'B')].status).toBe('active');
  });
});

describe('end encounter and summary', () => {
  it('reports each participant status', () => {
    let enc = running();
    enc = removeParticipant(enc, idOf(enc, 'B'), 'dead');
    enc = removeParticipant(enc, idOf(enc, 'D'), 'surrendered');
    enc = endEncounter(enc, 5);
    expect(enc.status).toBe('ended');
    expect(summary(enc).map((r) => `${r.participant.name}:${r.status}`)).toEqual([
      'A:survived',
      'C:survived',
      'B:dead',
      'D:surrendered',
    ]);
  });
});
