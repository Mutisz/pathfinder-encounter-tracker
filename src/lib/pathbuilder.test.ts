import { describe, expect, it } from 'vitest';
import fighter5 from './fixtures/pathbuilder/fighter5.json';
import magus9 from './fixtures/pathbuilder/magus9.json';
import {
  findImportMatch,
  importPathbuilder,
  isPathbuilderBuild,
  mapPathbuilderBuild,
  parsePathbuilderJson,
  unwrapPathbuilder,
  type PathbuilderBuild,
} from './pathbuilder';
import { entry } from './testUtils';

const fighter = () => unwrapPathbuilder(fighter5);
const magus = () => unwrapPathbuilder(magus9);
const skill = (sb: { skills: { name: string; modifier: number }[] }, name: string) =>
  sb.skills.find((s) => s.name === name)?.modifier;

describe('parsing', () => {
  it('accepts the wrapped export and a bare build identically', () => {
    const wrapped = importPathbuilder(fighter5);
    const bare = importPathbuilder((fighter5 as { build: unknown }).build);
    const strip = (sb: ReturnType<typeof importPathbuilder>['statblock']) => ({
      ...sb,
      strikes: sb.strikes.map(({ id: _id, ...s }) => s),
      abilities: sb.abilities.map(({ id: _id, ...a }) => a),
    });
    expect(strip(wrapped.statblock)).toEqual(strip(bare.statblock));
  });

  it('rejects non-JSON such as a Cloudflare challenge page', () => {
    expect(() => parsePathbuilderJson('<!DOCTYPE html><html><title>Just a moment...</title></html>')).toThrow(
      /Not valid JSON/,
    );
  });

  it('rejects success: false and non-builds', () => {
    expect(() => unwrapPathbuilder({ success: false })).toThrow(/success: false/);
    expect(() => unwrapPathbuilder({})).toThrow(/Not a Pathbuilder export/);
    expect(isPathbuilderBuild({ name: 'x', class: 'y', ancestry: 'z', level: 1 })).toBe(false);
    expect(isPathbuilderBuild(fighter())).toBe(true);
  });
});

describe('fighter 5 (Kholo, str 18 con 16 wis 16)', () => {
  const { statblock: sb, warnings } = mapPathbuilderBuild(fighter());

  it('maps header fields', () => {
    expect(sb.name).toBe('August [Kholo, F]');
    expect(sb.level).toBe(5);
    expect(sb.size).toBe('medium');
    expect(sb.traits).toEqual(['kholo', 'great kholo', 'fighter']);
    expect(sb.languages).toContain('Common');
  });

  it('computes HP, Perception, AC, saves and attributes', () => {
    expect(sb.hp.max).toBe(75);
    expect(sb.perception).toEqual({ modifier: 12, senses: ['low-light vision'] });
    expect(sb.attributes).toEqual({ str: 4, dex: 0, con: 3, int: 3, wis: 3, cha: 0 });
    expect(sb.ac.value).toBe(23);
    expect(sb.ac.modifiers).toEqual([]);
    expect(sb.saves.fortitude.value).toBe(12);
    expect(sb.saves.reflex.value).toBe(9);
    expect(sb.saves.will.value).toBe(12);
    expect(sb.speed.entries).toEqual([{ type: 'base', value: 25 }]);
  });

  it('lists only trained skills and lores', () => {
    expect(skill(sb, 'Athletics')).toBe(13);
    expect(skill(sb, 'Survival')).toBe(12);
    expect(skill(sb, 'Acrobatics')).toBe(7);
    expect(skill(sb, 'Kholo Lore')).toBe(12);
    expect(skill(sb, 'Farming Lore')).toBe(10);
    expect(skill(sb, 'Crafting')).toBeUndefined();
  });

  it('maps weapons to strikes and gear to items', () => {
    expect(sb.strikes).toHaveLength(1);
    const [scythe] = sb.strikes;
    expect(scythe.name).toBe('Lion Scythe');
    expect(scythe.kind).toBe('melee');
    expect(scythe.attackBonus).toBe(13);
    expect(scythe.damage).toEqual([{ formula: '1d6+4', type: 'slashing' }]);
    expect(sb.items).toContain('Full Plate');
    expect(sb.spellcasting).toEqual([]);
  });

  it('imports feats and features by name', () => {
    const names = sb.abilities.map((a) => a.name);
    expect(names).toContain('Sudden Charge');
    expect(names).toContain('Assurance (Athletics)');
    expect(names).not.toContain('Great Kholo');
    expect(names).not.toContain('Not Selected');
    expect(names).not.toContain('Low-Light Vision');
    const reactive = sb.abilities.find((a) => a.name === 'Reactive Strike');
    expect(reactive?.category).toBe('reactive');
    expect(reactive?.actionCost).toBe('reaction');
    const charge = sb.abilities.find((a) => a.name === 'Sudden Charge');
    expect(charge?.traits).toEqual(['class feat']);
    expect(charge?.description).toBe('Class Feat, level 1');
    expect(warnings.some((w) => /by name only/.test(w))).toBe(true);
  });
});

describe('magus 9 (Elf, dex 20 con 14 int 18 wis 14)', () => {
  const { statblock: sb, warnings } = mapPathbuilderBuild(magus());

  it('computes totals', () => {
    expect(sb.hp.max).toBe(105);
    expect(sb.perception.modifier).toBe(15);
    expect(sb.saves.fortitude.value).toBe(15);
    expect(sb.saves.reflex.value).toBe(18);
    expect(sb.saves.will.value).toBe(17);
    expect(sb.ac.value).toBe(27);
    expect(sb.speed.entries[0].value).toBe(35);
    expect(skill(sb, 'Arcana')).toBe(19);
    expect(skill(sb, 'A City Lore')).toBe(15);
    expect(skill(sb, 'Demon Lore')).toBeUndefined();
  });

  it('applies striking runes to the damage formula', () => {
    const [rapier] = sb.strikes;
    expect(rapier.name).toBe('+1 Striking Rapier');
    expect(rapier.attackBonus).toBe(19);
    expect(rapier.damage).toEqual([{ formula: '2d6+2', type: 'piercing' }]);
  });

  it('maps prepared spellcasting from the prepared list', () => {
    const main = sb.spellcasting.find((s) => s.name === 'Arcane Prepared Spells (Magus)');
    expect(main).toBeDefined();
    expect(main?.kind).toBe('prepared');
    expect(main?.dc).toBe(27);
    expect(main?.attack).toBe(17);
    expect(main?.ranks.find((r) => r.rank === 0)?.spells).toHaveLength(5);
    expect(main?.ranks.find((r) => r.rank === 1)?.spells).toHaveLength(4);
    expect(sb.spellcasting.find((s) => s.name.includes('Archetype Psychic'))).toBeUndefined();
    expect(warnings.some((w) => /Archetype Psychic: no spells or slots/.test(w))).toBe(true);
  });

  it('maps focus spells per tradition', () => {
    const arcane = sb.spellcasting.find((s) => s.kind === 'focus' && s.tradition === 'arcane');
    expect(arcane?.dc).toBe(27);
    expect(arcane?.focusPoints).toBe(2);
    expect(arcane?.ranks).toEqual([{ rank: 5, spells: [{ name: 'Dimensional Assault' }] }]);
    const occult = sb.spellcasting.find((s) => s.kind === 'focus' && s.tradition === 'occult');
    expect(occult?.ranks[0]).toMatchObject({ rank: 0 });
    expect(occult?.ranks[0].spells).toHaveLength(2);
  });

  it('imports rituals with an unknown rank', () => {
    expect(sb.rituals).toEqual([{ name: 'Elemental Sentinel', rank: 1 }]);
    expect(warnings.some((w) => /Ritual ranks/.test(w))).toBe(true);
  });
});

describe('edge cases', () => {
  it('adds resilient rune bonuses from the worn armor', () => {
    const build: PathbuilderBuild = {
      ...fighter(),
      armor: [{ name: 'Full Plate', worn: true, res: 'greaterResilient' }],
    };
    const { statblock } = mapPathbuilderBuild(build);
    expect(statblock.saves.fortitude.value).toBe(14);
    expect(statblock.saves.reflex.value).toBe(11);
    expect(statblock.saves.will.value).toBe(14);
  });

  it('falls back to the numeric size when sizeName is absent', () => {
    const { sizeName: _sizeName, ...rest } = fighter();
    expect(mapPathbuilderBuild({ ...rest, size: 1 }).statblock.size).toBe('small');
  });

  it('guesses ranged strikes from the weapon name', () => {
    const build: PathbuilderBuild = {
      ...fighter(),
      weapons: [{ name: 'Longbow', die: 'd8', attack: 10, damageType: 'P', damageBonus: 0 }],
    };
    const [bow] = mapPathbuilderBuild(build).statblock.strikes;
    expect(bow.kind).toBe('ranged');
    expect(bow.damage).toEqual([{ formula: '1d8', type: 'piercing' }]);
  });

  it('collapses duplicate prepared spells into uses', () => {
    const build: PathbuilderBuild = {
      ...magus(),
      spellCasters: [
        {
          name: 'Magus',
          magicTradition: 'arcane',
          spellcastingType: 'prepared',
          ability: 'int',
          proficiency: 4,
          perDay: [5, 2],
          spells: [],
          prepared: [{ spellLevel: 1, list: ['Sure Strike', 'Sure Strike'] }],
        },
      ],
      focus: {},
    };
    const [main] = mapPathbuilderBuild(build).statblock.spellcasting;
    expect(main.ranks).toEqual([{ rank: 1, slots: undefined, spells: [{ name: 'Sure Strike', uses: '×2' }] }]);
  });

  it('keeps spontaneous slots from perDay', () => {
    const build: PathbuilderBuild = {
      ...magus(),
      spellCasters: [
        {
          name: 'Sorcerer',
          magicTradition: 'occult',
          spellcastingType: 'spontaneous',
          ability: 'cha',
          proficiency: 2,
          perDay: [5, 3, 2],
          spells: [
            { spellLevel: 0, list: ['Daze'] },
            { spellLevel: 2, list: ['Blur'] },
          ],
        },
      ],
      focus: {},
    };
    const [main] = mapPathbuilderBuild(build).statblock.spellcasting;
    expect(main.kind).toBe('spontaneous');
    expect(main.dc).toBe(10 + 9 + 2 + 2);
    expect(main.ranks).toEqual([
      { rank: 0, slots: undefined, spells: [{ name: 'Daze' }] },
      { rank: 2, slots: 2, spells: [{ name: 'Blur' }] },
    ]);
  });
});

describe('findImportMatch', () => {
  const ann = { ...entry('Ann', 'player'), source: { kind: 'pathbuilder' as const, id: '111111', importedAt: 0 } };
  const bob = entry('Bob', 'player');
  const goblin = entry('Ann', 'npc');

  it('prefers the Pathbuilder id over the name', () => {
    expect(findImportMatch([bob, ann], 'Someone else', '111111')).toBe(ann);
  });

  it('falls back to a case-insensitive name match among players only', () => {
    expect(findImportMatch([goblin, bob], ' bob ')).toBe(bob);
    expect(findImportMatch([goblin], 'Ann')).toBeUndefined();
  });
});
