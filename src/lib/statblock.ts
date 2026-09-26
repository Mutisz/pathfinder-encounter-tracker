import type { InitiativeSkill } from '@/types/encounter';
import type { Ability, Modifier, SpeedEntry, Statblock, Strike } from '@/types/statblock';

export const blankStatblock = (): Statblock => ({
  schemaVersion: 2,
  name: '',
  level: 0,
  rarity: 'common',
  size: 'medium',
  traits: [],
  perception: { modifier: 0, senses: [] },
  languages: [],
  skills: [],
  attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  items: [],
  ac: { value: 10, modifiers: [] },
  saves: {
    fortitude: { value: 0, modifiers: [] },
    reflex: { value: 0, modifiers: [] },
    will: { value: 0, modifiers: [] },
  },
  hp: { max: 1, healingAbilities: [] },
  immunities: [],
  weaknesses: [],
  resistances: [],
  speed: { entries: [{ type: 'base', value: 25 }], notes: undefined },
  strikes: [],
  spellcasting: [],
  rituals: [],
  abilities: [],
});

export const formatModifier = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

/** Land Speed entry, or the first speed listed. */
export const baseSpeed = (statblock: Statblock): SpeedEntry | undefined =>
  statblock.speed.entries.find((e) => e.type === 'base') ?? statblock.speed.entries[0];

/** Book-style conditional totals: "(26 with shield raised, 22 vs. ranged)" for AC, "(+14 vs. poison)" for saves. */
export const modifierTotals = (base: number, modifiers: Modifier[], signed: boolean): string =>
  modifiers
    .map((m) => `${signed ? formatModifier(base + m.modifier) : base + m.modifier} ${m.condition}`.trim())
    .join(', ');

/** Multiple attack penalty: agile strikes use -4/-8, others -5/-10. */
export const strikeMap = (strike: Strike): [number, number, number] => {
  const agile = strike.traits.some((t) => t.toLowerCase() === 'agile');
  const step = agile ? 4 : 5;
  return [strike.attackBonus, strike.attackBonus - step, strike.attackBonus - 2 * step];
};

export interface InitiativeOption {
  key: InitiativeSkill;
  label: string;
  modifier: number;
}

/** Perception first, then every skill listed in the Skills section. */
export const initiativeOptions = (statblock: Statblock): InitiativeOption[] => [
  { key: 'perception', label: 'Perception', modifier: statblock.perception.modifier },
  ...statblock.skills.map((s) => ({ key: s.name, label: s.name, modifier: s.modifier })),
];

export const initiativeModifier = (statblock: Statblock, skill: InitiativeSkill): number => {
  if (skill === 'perception') return statblock.perception.modifier;
  const found = statblock.skills.find((s) => s.name === skill);
  return found ? found.modifier : statblock.perception.modifier;
};

export const abilitiesByCategory = (statblock: Statblock, category: Ability['category']): Ability[] =>
  statblock.abilities.filter((a) => a.category === category);

export const traitsLine = (statblock: Statblock): string[] => [
  ...(statblock.rarity !== 'common' ? [statblock.rarity] : []),
  statblock.size,
  ...statblock.traits,
];
