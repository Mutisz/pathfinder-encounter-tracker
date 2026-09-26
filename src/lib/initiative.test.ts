import { describe, expect, it } from 'vitest';
import { entry, fixedRng, idOf, names } from './testUtils';
import { addNpcs, createEncounter, moveTiedPlayer, rollFor, setInitiative, startEncounter } from './encounter';
import { rollInitiative } from './initiative';
import { initiativeOptions, strikeMap } from './statblock';
import { blankStatblock } from './statblock';

describe('rollInitiative', () => {
  it('adds the modifier to the d20', () => {
    expect(rollInitiative(7, fixedRng(13))).toEqual({ d20: 13, modifier: 7, total: 20 });
  });
});

describe('initiativeOptions', () => {
  it('lists Perception first, then the statblock skills', () => {
    const sb = {
      ...blankStatblock(),
      perception: { modifier: 8, senses: [] },
      skills: [{ name: 'Stealth', modifier: 6, actions: [] }],
    };
    expect(initiativeOptions(sb).map((o) => `${o.key}:${o.modifier}`)).toEqual(['perception:8', 'Stealth:6']);
  });
});

describe('strikeMap', () => {
  it('uses -5/-10 normally and -4/-8 for agile', () => {
    const base = { id: 'x', kind: 'melee' as const, name: 'club', attackBonus: 9, traits: [], damage: [] };
    expect(strikeMap(base)).toEqual([9, 4, -1]);
    expect(strikeMap({ ...base, traits: ['agile'] })).toEqual([9, 5, 1]);
  });
});

describe('sorting and ties', () => {
  const setup = () => {
    let enc = createEncounter('t', [entry('Ann', 'player'), entry('Bob', 'player')], 1000);
    enc = addNpcs(enc, entry('Goblin', 'npc'), 1, false, 2000);
    return enc;
  };

  it('orders by initiative descending', () => {
    let enc = setup();
    enc = setInitiative(enc, idOf(enc, 'Ann'), 12);
    enc = setInitiative(enc, idOf(enc, 'Bob'), 20);
    enc = setInitiative(enc, idOf(enc, 'Goblin'), 15);
    expect(names(enc)).toEqual(['Bob', 'Goblin', 'Ann']);
  });

  it('puts the NPC before a tied player', () => {
    let enc = setup();
    enc = setInitiative(enc, idOf(enc, 'Ann'), 15);
    enc = setInitiative(enc, idOf(enc, 'Bob'), 15);
    enc = setInitiative(enc, idOf(enc, 'Goblin'), 15);
    expect(names(enc)).toEqual(['Goblin', 'Ann', 'Bob']);
  });

  it('lets tied players swap, but not a player with an NPC', () => {
    let enc = setup();
    enc = setInitiative(enc, idOf(enc, 'Ann'), 15);
    enc = setInitiative(enc, idOf(enc, 'Bob'), 15);
    enc = setInitiative(enc, idOf(enc, 'Goblin'), 15);
    enc = moveTiedPlayer(enc, idOf(enc, 'Bob'), 'up');
    expect(names(enc)).toEqual(['Goblin', 'Bob', 'Ann']);
    enc = moveTiedPlayer(enc, idOf(enc, 'Bob'), 'up');
    expect(names(enc)).toEqual(['Goblin', 'Bob', 'Ann']);
  });

  it('refuses to swap after the encounter started', () => {
    let enc = setup();
    enc = setInitiative(enc, idOf(enc, 'Ann'), 15);
    enc = setInitiative(enc, idOf(enc, 'Bob'), 15);
    enc = setInitiative(enc, idOf(enc, 'Goblin'), 15);
    enc = startEncounter(enc);
    expect(names(moveTiedPlayer(enc, idOf(enc, 'Bob'), 'up'))).toEqual(['Goblin', 'Ann', 'Bob']);
  });

  it('a batched group shares one roll; unbatched roll separately', () => {
    let enc = createEncounter('t', [], 0);
    enc = addNpcs(enc, entry('Goblin', 'npc', { perception: 3 }), 3, true, 10);
    enc = addNpcs(enc, entry('Orc', 'npc', { perception: 2 }), 2, false, 20);
    expect(names(enc).sort()).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3', 'Orc 1', 'Orc 2']);
    enc = rollFor(enc, idOf(enc, 'Goblin 2'), fixedRng(11));
    expect(enc.participants[idOf(enc, 'Goblin 1')].initiative).toBe(14);
    expect(enc.participants[idOf(enc, 'Goblin 3')].initiative).toBe(14);
    enc = rollFor(enc, idOf(enc, 'Orc 1'), fixedRng(5));
    expect(enc.participants[idOf(enc, 'Orc 1')].initiative).toBe(7);
    expect(enc.participants[idOf(enc, 'Orc 2')].initiative).toBeNull();
  });

  it('numbers later additions of the same NPC after the existing ones', () => {
    let enc = createEncounter('t', [], 0);
    enc = addNpcs(enc, entry('Goblin', 'npc'), 1, false, 10);
    expect(names(enc)).toEqual(['Goblin']);
    enc = addNpcs(enc, entry('Goblin', 'npc'), 2, true, 20);
    expect(names(enc).sort()).toEqual(['Goblin', 'Goblin 2', 'Goblin 3']);
  });
});
