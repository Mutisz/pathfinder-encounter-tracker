/**
 * Statblock model shaped after Archives of Nethys / Monster Core / NPC Core.
 * Section order mirrors the printed statblock so the editor and view can iterate it.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'unique';
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

export type Size = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
export const SIZES: Size[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

/** Passive = no action icon (constant abilities, auras). Ranges cover variable-cost activities. */
export type ActionCost = 'passive' | 'free' | 'reaction' | 1 | 2 | 3 | '1-2' | '1-3' | '2-3';
export const ACTION_COSTS: ActionCost[] = ['passive', 'free', 'reaction', 1, 2, 3, '1-2', '1-3', '2-3'];

/** The four ability sections of a printed statblock. */
export type AbilityCategory = 'interaction' | 'automatic' | 'reactive' | 'offensive';
export const ABILITY_CATEGORIES: AbilityCategory[] = ['interaction', 'automatic', 'reactive', 'offensive'];

export interface Ability {
  id: string;
  category: AbilityCategory;
  name: string;
  actionCost: ActionCost;
  traits: string[];
  frequency?: string;
  trigger?: string;
  requirements?: string;
  description: string;
}

export interface Skill {
  name: string;
  modifier: number;
  /** e.g. "+9 to Climb" */
  notes?: string;
}

export type AttributeKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ATTRIBUTE_KEYS: AttributeKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export type Attributes = Record<AttributeKey, number>;

export interface Damage {
  /** Dice formula as printed, e.g. "1d6+5". Parsed only when strike rolls are implemented. */
  formula: string;
  type: string;
}

export interface Strike {
  id: string;
  kind: 'melee' | 'ranged';
  name: string;
  attackBonus: number;
  traits: string[];
  damage: Damage[];
  /** "plus Grab", "plus 1d6 persistent fire" */
  effects?: string;
  /** Ranged only: "range increment 50 feet" or "range 30 feet" */
  range?: string;
  reload?: string;
  notes?: string;
}

export type Tradition = 'arcane' | 'divine' | 'occult' | 'primal';
export const TRADITIONS: Tradition[] = ['arcane', 'divine', 'occult', 'primal'];

export type SpellcastingKind = 'prepared' | 'spontaneous' | 'innate' | 'focus';
export const SPELLCASTING_KINDS: SpellcastingKind[] = ['prepared', 'spontaneous', 'innate', 'focus'];

export interface SpellEntry {
  name: string;
  /** "×2", "at will", "3/day" */
  uses?: string;
  notes?: string;
}

export interface SpellRank {
  /** 0 = cantrips */
  rank: number;
  /** Spontaneous casters: number of slots at this rank. */
  slots?: number;
  spells: SpellEntry[];
}

export interface Spellcasting {
  id: string;
  /** "Divine Prepared Spells", "Primal Innate Spells", "Occult Focus Spells" */
  name: string;
  tradition: Tradition;
  kind: SpellcastingKind;
  dc: number;
  attack?: number;
  /** Focus spells only. */
  focusPoints?: number;
  ranks: SpellRank[];
  constant: SpellRank[];
}

export interface ValueNote {
  value: number;
  notes?: string;
}

export interface TypedValue {
  type: string;
  value: number;
  notes?: string;
}

export interface Statblock {
  schemaVersion: 1;
  name: string;
  level: number;
  rarity: Rarity;
  size: Size;
  traits: string[];
  source?: { book: string; page?: number; aonId?: number };
  perception: { modifier: number; senses: string[]; notes?: string };
  languages: string[];
  languageNotes?: string;
  skills: Skill[];
  attributes: Attributes;
  items: string[];
  ac: ValueNote;
  saves: { fortitude: number; reflex: number; will: number; notes?: string };
  hp: { max: number; notes?: string };
  immunities: string[];
  weaknesses: TypedValue[];
  resistances: TypedValue[];
  speed: { base: number; other: { type: string; value: number }[]; notes?: string };
  strikes: Strike[];
  spellcasting: Spellcasting[];
  rituals: string[];
  abilities: Ability[];
}
