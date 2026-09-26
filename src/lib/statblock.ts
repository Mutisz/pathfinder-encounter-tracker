import type { InitiativeSkill } from '@/types/encounter';
import type { Ability, Statblock, Strike } from '@/types/statblock';

export const blankStatblock = (): Statblock => ({
  schemaVersion: 1,
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
  ac: { value: 10 },
  saves: { fortitude: 0, reflex: 0, will: 0 },
  hp: { max: 1 },
  immunities: [],
  weaknesses: [],
  resistances: [],
  speed: { base: 25, other: [] },
  strikes: [],
  spellcasting: [],
  rituals: [],
  abilities: [],
});

export const formatModifier = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

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
