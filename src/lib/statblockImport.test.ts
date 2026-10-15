import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blankStatblock } from './statblock';
import { findByName, importStatblocks, parseStatblockJson } from './statblockImport';
import { entry } from './testUtils';

/** The complete example from docs/statblock-json.md, so the docs and the importer cannot drift apart. */
const docExample = (): unknown => {
  const md = readFileSync(new URL('../../docs/statblock-json.md', import.meta.url), 'utf8');
  const block = md.match(/```json\n([\s\S]*?)\n```/);
  if (!block) throw new Error('no json example in docs/statblock-json.md');
  return JSON.parse(block[1]);
};

describe('importStatblocks', () => {
  it('accepts the documented example and generates ids', () => {
    const { statblocks, errors } = importStatblocks(docExample());
    expect(errors).toEqual([]);
    expect(statblocks).toHaveLength(1);
    const sb = statblocks[0].statblock;
    expect(statblocks[0].warnings).toEqual([]);
    expect(sb.name).toBe('Bandit Lookout');
    expect(sb.strikes.map((s) => s.name)).toEqual(['shortsword', 'shortbow']);
    expect(sb.strikes.every((s) => typeof s.id === 'string' && s.id.length > 0)).toBe(true);
    expect(sb.abilities.map((a) => a.actionCost)).toEqual(['reaction', 'passive', 1]);
    expect(sb.spellcasting[0].focusPoints).toBe(1);
    expect(sb.ac.modifiers).toEqual([{ condition: 'with shield raised', modifier: 2 }]);
  });

  it('accepts a blank statblock from the app', () => {
    const { statblocks, errors } = importStatblocks({ ...blankStatblock(), name: 'Blank' });
    expect(errors).toEqual([]);
    expect(statblocks[0].statblock).toEqual({ ...blankStatblock(), name: 'Blank' });
  });

  it('accepts an array and reports each failure by position and name', () => {
    const good = { ...blankStatblock(), name: 'Good' };
    const bad = { ...blankStatblock(), name: 'Bad', hp: { max: 0, healingAbilities: [] } };
    const { statblocks, errors } = importStatblocks([good, bad, 'nonsense']);
    expect(statblocks.map((s) => s.statblock.name)).toEqual(['Good']);
    expect(errors).toEqual(['#2 (Bad): hp.max must be >= 1', '#3: statblock must be an object']);
  });

  it('rejects wrong types, bad enums and bad dice', () => {
    const base = blankStatblock();
    const err = (sb: unknown) => importStatblocks(sb).errors[0];
    expect(err({ ...base, name: 'x', attributes: { ...base.attributes, str: '18' } })).toMatch(
      /attributes.str must be an integer/,
    );
    expect(err({ ...base, name: 'x', rarity: 'legendary' })).toMatch(
      /rarity must be one of common, uncommon, rare, unique/,
    );
    expect(err({ ...base, name: 'x', schemaVersion: 1 })).toMatch(/schemaVersion must be 2/);
    expect(
      err({
        ...base,
        name: 'x',
        strikes: [
          { kind: 'melee', name: 'club', attackBonus: 5, traits: [], damage: [{ formula: 'd6 + 2', type: 'b' }] },
        ],
      }),
    ).toMatch(/strikes\[0\].damage\[0\].formula must look like/);
    expect(
      err({
        ...base,
        name: 'x',
        abilities: [{ category: 'automatic', name: 'a', actionCost: '1', traits: [], description: '' }],
      }),
    ).toMatch(/abilities\[0\].actionCost must be one of/);
  });

  it('ignores unknown fields with a warning', () => {
    const { statblocks, errors } = importStatblocks({
      ...blankStatblock(),
      name: 'x',
      notes: 'hi',
      hp: { max: 5, healingAbilities: [], foo: 1 },
    });
    expect(errors).toEqual([]);
    expect(statblocks[0].warnings).toEqual(['notes: unknown field ignored', 'hp.foo: unknown field ignored']);
    expect('notes' in statblocks[0].statblock).toBe(false);
  });

  it('reports invalid JSON and empty arrays', () => {
    expect(parseStatblockJson('{ not json').errors).toEqual(['Not valid JSON.']);
    expect(parseStatblockJson('[]').errors).toEqual(['The file is an empty array.']);
  });
});

describe('findByName', () => {
  it('matches the same kind only, case-insensitively', () => {
    const goblin = entry('Goblin Warrior', 'npc');
    const player = entry('goblin warrior', 'player');
    expect(findByName([player, goblin], 'npc', ' GOBLIN warrior ')).toBe(goblin);
    expect(findByName([player], 'npc', 'Goblin Warrior')).toBeUndefined();
  });
});
