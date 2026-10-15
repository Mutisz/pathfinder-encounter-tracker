/**
 * Pathbuilder 2e JSON export -> Statblock.
 *
 * The export (menu > Export JSON, or https://pathbuilder2e.com/json.php?id=<id>) is the format the
 * Pathmuncher Foundry module reads. It carries proficiency ranks and attribute scores, not totals,
 * so the totals are computed here with the Player Core formulas. Everything the export does not
 * carry (item bonuses other than resilient runes, weapon traits, feat rules text) is reported in
 * `warnings` for the GM to fix in the editor.
 */
import { createId } from '@/lib/dice';
import { blankStatblock } from '@/lib/statblock';
import type { LibraryEntry } from '@/types/library';
import type {
  Ability,
  AttributeKey,
  Size,
  Spellcasting,
  SpellcastingKind,
  SpellEntry,
  SpellRank,
  Statblock,
  Strike,
  Tradition,
} from '@/types/statblock';
import { ATTRIBUTE_KEYS, SIZES, TRADITIONS } from '@/types/statblock';

// ---------------------------------------------------------------------------
// Export shape. Every field that any known export lacks is optional.

export interface PbWeapon {
  name: string;
  qty?: number;
  die: string;
  pot?: number;
  str?: '' | 'striking' | 'greaterStriking' | 'majorStriking';
  display?: string;
  damageType?: string;
  attack: number;
  damageBonus?: number;
  extraDamage?: string[];
  increasedDice?: boolean;
}

export interface PbArmor {
  name: string;
  display?: string;
  worn?: boolean;
  res?: '' | 'resilient' | 'greaterResilient' | 'majorResilient';
}

export interface PbSpellList {
  spellLevel: number;
  list: string[];
}

export interface PbSpellcaster {
  name: string;
  magicTradition: string;
  spellcastingType: string;
  ability: string;
  proficiency: number;
  focusPoints?: number;
  innate?: boolean;
  perDay?: number[];
  spells?: PbSpellList[];
  prepared?: PbSpellList[];
}

export interface PbFocusEntry {
  proficiency: number;
  focusCantrips?: string[];
  focusSpells?: string[];
}

export interface PathbuilderBuild {
  name: string;
  class: string;
  dualClass?: string | null;
  level: number;
  ancestry: string;
  heritage?: string;
  background?: string;
  size?: number;
  sizeName?: string;
  languages?: string[];
  rituals?: string[];
  resistances?: unknown[];
  abilities: Record<AttributeKey, number>;
  attributes: {
    ancestryhp: number;
    classhp: number;
    bonushp?: number;
    bonushpPerLevel?: number;
    speed: number;
    speedBonus?: number;
  };
  proficiencies: Record<string, number>;
  lores?: [string, number][];
  feats?: unknown[][];
  specials?: string[];
  equipment?: unknown[][];
  weapons?: PbWeapon[];
  armor?: PbArmor[];
  acTotal?: { acTotal: number; shieldBonus?: number | null };
  spellCasters?: PbSpellcaster[];
  focusPoints?: number;
  focus?: Record<string, Record<string, PbFocusEntry>>;
}

export interface PathbuilderImport {
  statblock: Statblock;
  warnings: string[];
  /** For the preview; not part of the statblock. */
  summary: { name: string; class: string; ancestry: string; heritage?: string; level: number };
}

// ---------------------------------------------------------------------------
// Validation

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export const isPathbuilderBuild = (x: unknown): x is PathbuilderBuild => {
  if (!isObject(x)) return false;
  if (typeof x.name !== 'string' || typeof x.class !== 'string' || typeof x.ancestry !== 'string') return false;
  if (!isNumber(x.level)) return false;
  if (
    !isObject(x.abilities) ||
    !ATTRIBUTE_KEYS.every((k) => isNumber(x.abilities && (x.abilities as Record<string, unknown>)[k]))
  )
    return false;
  const attrs = x.attributes;
  if (!isObject(attrs) || !isNumber(attrs.ancestryhp) || !isNumber(attrs.classhp) || !isNumber(attrs.speed))
    return false;
  return isObject(x.proficiencies);
};

/** Accepts the full export ({ success, build }) or a bare build object. */
export const unwrapPathbuilder = (x: unknown): PathbuilderBuild => {
  if (isObject(x) && x.success === false) {
    throw new Error('Pathbuilder returned success: false – export the character to JSON in Pathbuilder first.');
  }
  const candidate = isObject(x) && isObject(x.build) ? x.build : x;
  if (!isPathbuilderBuild(candidate)) {
    throw new Error('Not a Pathbuilder export (missing build.name, level, abilities or attributes).');
  }
  return candidate;
};

export const parsePathbuilderJson = (text: string): PathbuilderBuild => {
  let data: unknown;
  try {
    data = JSON.parse(text.trim());
  } catch {
    throw new Error(
      'Not valid JSON (if you fetched by ID, the site may have blocked the request – paste the export instead).',
    );
  }
  return unwrapPathbuilder(data);
};

// ---------------------------------------------------------------------------
// Rules tables

export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

/** Untrained adds nothing; trained+ adds level + rank (2/4/6/8). */
export const profBonus = (rank: number | undefined, level: number): number => (rank && rank > 0 ? level + rank : 0);

const SIZE_BY_NUMBER: Size[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

const SKILL_ABILITY: [key: string, name: string, ability: AttributeKey][] = [
  ['acrobatics', 'Acrobatics', 'dex'],
  ['arcana', 'Arcana', 'int'],
  ['athletics', 'Athletics', 'str'],
  ['crafting', 'Crafting', 'int'],
  ['deception', 'Deception', 'cha'],
  ['diplomacy', 'Diplomacy', 'cha'],
  ['intimidation', 'Intimidation', 'cha'],
  ['medicine', 'Medicine', 'wis'],
  ['nature', 'Nature', 'wis'],
  ['occultism', 'Occultism', 'int'],
  ['performance', 'Performance', 'cha'],
  ['religion', 'Religion', 'wis'],
  ['society', 'Society', 'int'],
  ['stealth', 'Stealth', 'dex'],
  ['survival', 'Survival', 'wis'],
  ['thievery', 'Thievery', 'dex'],
];

const RESILIENT: Record<string, number> = { resilient: 1, greaterResilient: 2, majorResilient: 3 };
const STRIKING_DICE: Record<string, number> = { '': 1, striking: 2, greaterStriking: 3, majorStriking: 4 };
const DAMAGE_TYPE: Record<string, string> = { S: 'slashing', P: 'piercing', B: 'bludgeoning' };
const RANGED_NAME =
  /bow|sling|dart|javelin|shuriken|pistol|musket|arquebus|blunderbuss|gun|rifle|boomerang|chakram|bomb|- ranged/i;

const SENSES = ['Low-Light Vision', 'Darkvision', 'Greater Darkvision', 'Scent', 'Tremorsense', 'Echolocation'];
const SENSE_LOOKUP = new Map(SENSES.map((s) => [s.toLowerCase(), s.toLowerCase()]));

/** Features a GM wants in the Reactive section; everything else imports as passive. */
const REACTION_FEATURES = new Set(
  [
    'Reactive Strike',
    'Attack of Opportunity',
    'Shield Block',
    'Nimble Dodge',
    'Reactive Shield',
    "Champion's Reaction",
  ].map((s) => s.toLowerCase()),
);

const isAttributeKey = (x: string): x is AttributeKey => (ATTRIBUTE_KEYS as string[]).includes(x);
const isTradition = (x: string): x is Tradition => (TRADITIONS as string[]).includes(x);
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Mapping

export const mapPathbuilderBuild = (build: PathbuilderBuild): PathbuilderImport => {
  const warnings: string[] = [];
  const level = build.level;
  const mods = Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, abilityMod(build.abilities[k])])) as Record<
    AttributeKey,
    number
  >;
  const prof = build.proficiencies;
  const sb = blankStatblock();

  sb.name = build.name;
  sb.level = level;
  sb.size = mapSize(build, warnings);
  sb.traits = [build.ancestry, build.heritage, build.class, build.dualClass]
    .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    .map((t) => t.toLowerCase());
  sb.languages = (build.languages ?? []).filter((l) => typeof l === 'string');

  sb.attributes = { ...mods };

  const specials = (build.specials ?? []).filter((s) => typeof s === 'string' && s !== 'Not Selected');
  sb.perception = {
    modifier: profBonus(prof.perception, level) + mods.wis,
    senses: specials.map((s) => SENSE_LOOKUP.get(s.toLowerCase())).filter((s): s is string => s !== undefined),
  };

  sb.skills = SKILL_ABILITY.filter(([key]) => (prof[key] ?? 0) > 0).map(([key, name, ability]) => ({
    name,
    modifier: profBonus(prof[key], level) + mods[ability],
    actions: [],
  }));
  for (const lore of build.lores ?? []) {
    if (!Array.isArray(lore) || typeof lore[0] !== 'string' || !((lore[1] ?? 0) > 0)) continue;
    sb.skills.push({ name: `${lore[0]} Lore`, modifier: profBonus(lore[1], level) + mods.int, actions: [] });
  }

  const a = build.attributes;
  sb.hp = {
    max: Math.max(1, a.ancestryhp + (a.bonushp ?? 0) + level * (a.classhp + mods.con + (a.bonushpPerLevel ?? 0))),
    healingAbilities: [],
  };

  if (build.acTotal && isNumber(build.acTotal.acTotal)) {
    sb.ac.value = build.acTotal.acTotal;
    const shield = build.acTotal.shieldBonus;
    if (isNumber(shield) && shield > 0) sb.ac.modifiers = [{ condition: 'with shield raised', modifier: shield }];
  } else {
    warnings.push('AC missing from the export; left at 10.');
  }

  const armor = build.armor ?? [];
  const worn = armor.find((x) => x.worn) ?? armor[0];
  const resilient = RESILIENT[worn?.res ?? ''] ?? 0;
  sb.saves = {
    fortitude: { value: profBonus(prof.fortitude, level) + mods.con + resilient, modifiers: [] },
    reflex: { value: profBonus(prof.reflex, level) + mods.dex + resilient, modifiers: [] },
    will: { value: profBonus(prof.will, level) + mods.wis + resilient, modifiers: [] },
  };

  sb.speed = { entries: [{ type: 'base', value: a.speed + (a.speedBonus ?? 0) }], notes: undefined };

  const withQty = (name: string, qty: unknown): string => (isNumber(qty) && qty > 1 ? `${name} ×${qty}` : name);
  sb.items = [
    ...(worn ? [worn.display ?? worn.name] : []),
    ...(build.weapons ?? []).map((w) => withQty(w.display ?? w.name, w.qty)),
    ...(build.equipment ?? [])
      .filter((e) => Array.isArray(e) && typeof e[0] === 'string' && e[0] !== 'undefined')
      .map((e) => withQty(e[0] as string, e[1])),
  ];

  sb.strikes = (build.weapons ?? []).map((w) => mapWeapon(w, warnings));

  sb.spellcasting = mapSpellcasting(build, mods, warnings);

  sb.rituals = (build.rituals ?? []).filter((r) => typeof r === 'string').map((name) => ({ name, rank: 1 }));
  if (sb.rituals.length > 0) warnings.push('Ritual ranks are not in the export; all set to rank 1.');

  sb.resistances = mapResistances(build.resistances ?? [], warnings);

  sb.abilities = mapAbilities(build, specials, warnings);

  warnings.push(
    'Not in the export: item bonuses to Perception and skills, armor check penalties, Untrained Improvisation and ' +
      'class features that change saves (e.g. Bravery). Review the totals after import.',
  );

  return {
    statblock: sb,
    warnings,
    summary: {
      name: build.name,
      class: build.dualClass ? `${build.class} / ${build.dualClass}` : build.class,
      ancestry: build.ancestry,
      heritage: build.heritage,
      level,
    },
  };
};

const mapSize = (build: PathbuilderBuild, warnings: string[]): Size => {
  const byName = build.sizeName?.toLowerCase();
  if (byName && (SIZES as string[]).includes(byName)) return byName as Size;
  if (isNumber(build.size) && SIZE_BY_NUMBER[build.size]) return SIZE_BY_NUMBER[build.size];
  warnings.push('Size missing from the export; set to medium.');
  return 'medium';
};

const mapWeapon = (w: PbWeapon, warnings: string[]): Strike => {
  const name = w.display ?? w.name;
  const dice = STRIKING_DICE[w.str ?? ''] ?? 1;
  const bonus = w.damageBonus ?? 0;
  const formula = `${dice}${w.die}${bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : ''}`;
  const letter = w.damageType ?? '';
  const type = DAMAGE_TYPE[letter] ?? letter.toLowerCase();
  if (!DAMAGE_TYPE[letter]) warnings.push(`${name}: unknown damage type "${letter}".`);
  if (w.increasedDice) warnings.push(`${name}: Pathbuilder marks an increased damage die; verify the formula.`);
  warnings.push(`${name}: melee/ranged and weapon traits (agile etc.) are not in the export; guessed.`);
  const extra = (w.extraDamage ?? []).filter((e) => typeof e === 'string' && e.trim() !== '');
  return {
    id: createId(),
    kind: RANGED_NAME.test(w.name) ? 'ranged' : 'melee',
    name,
    attackBonus: w.attack,
    traits: [],
    damage: [{ formula, type }],
    effects: extra.length > 0 ? `plus ${extra.join(', ')}` : undefined,
    count: isNumber(w.qty) && w.qty > 1 ? w.qty : undefined,
  };
};

/** Collapses duplicate prepared spells into one entry with "×N". */
const toSpellEntries = (names: string[]): SpellEntry[] => {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()].map(([name, n]) => (n > 1 ? { name, uses: `×${n}` } : { name }));
};

const toRanks = (lists: PbSpellList[], slotsFor?: (rank: number) => number | undefined): SpellRank[] =>
  lists
    .filter((l) => isObject(l) && isNumber(l.spellLevel) && Array.isArray(l.list) && l.list.length > 0)
    .map((l) => ({
      rank: l.spellLevel,
      slots: slotsFor?.(l.spellLevel),
      spells: toSpellEntries(l.list.filter((s): s is string => typeof s === 'string')),
    }))
    .sort((x, y) => x.rank - y.rank);

const mapSpellcasting = (
  build: PathbuilderBuild,
  mods: Record<AttributeKey, number>,
  warnings: string[],
): Spellcasting[] => {
  const level = build.level;
  const result: Spellcasting[] = [];

  for (const c of build.spellCasters ?? []) {
    if (!isObject(c) || typeof c.name !== 'string') continue;
    if (!isTradition(c.magicTradition)) {
      if (c.magicTradition !== 'focus') warnings.push(`${c.name}: unknown tradition "${c.magicTradition}"; skipped.`);
      continue;
    }
    const perDay = Array.isArray(c.perDay) ? c.perDay : [];
    const spells = Array.isArray(c.spells) ? c.spells : [];
    const prepared = Array.isArray(c.prepared) ? c.prepared : [];
    const hasSpells = [...spells, ...prepared].some((l) => Array.isArray(l?.list) && l.list.length > 0);
    if (!hasSpells && perDay.every((n) => !n)) {
      warnings.push(`${c.name}: no spells or slots; skipped.`);
      continue;
    }
    const kind: SpellcastingKind = c.innate
      ? 'innate'
      : c.spellcastingType === 'spontaneous'
        ? 'spontaneous'
        : 'prepared';
    const mod = isAttributeKey(c.ability) ? mods[c.ability] : 0;
    if (!isAttributeKey(c.ability)) warnings.push(`${c.name}: unknown spellcasting attribute "${c.ability}".`);
    const dc = 10 + profBonus(c.proficiency, level) + mod;

    let ranks: SpellRank[];
    if (kind === 'prepared') {
      const preparedRanks = toRanks(prepared);
      if (preparedRanks.length > 0) {
        ranks = preparedRanks;
      } else {
        ranks = toRanks(spells);
        if (ranks.length > 0)
          warnings.push(`${c.name}: no prepared spells in the export; listing the spellbook instead.`);
      }
    } else {
      ranks = toRanks(spells, kind === 'spontaneous' ? (rank) => (rank > 0 ? perDay[rank] : undefined) : undefined);
    }

    result.push({
      id: createId(),
      name: `${capitalize(c.magicTradition)} ${capitalize(kind)} Spells (${c.name})`,
      tradition: c.magicTradition,
      kind,
      dc,
      attack: dc - 10,
      ranks,
      constant: [],
    });
  }

  const focusEntries: Spellcasting[] = [];
  for (const [tradition, byAbility] of Object.entries(build.focus ?? {})) {
    if (!isTradition(tradition) || !isObject(byAbility)) continue;
    for (const [ability, f] of Object.entries(byAbility)) {
      if (!isObject(f)) continue;
      const cantrips = (f.focusCantrips ?? []).filter((s): s is string => typeof s === 'string');
      const spells = (f.focusSpells ?? []).filter((s): s is string => typeof s === 'string');
      if (cantrips.length === 0 && spells.length === 0) continue;
      const mod = isAttributeKey(ability) ? mods[ability] : 0;
      const dc = 10 + profBonus(f.proficiency, level) + mod;
      const ranks: SpellRank[] = [];
      if (cantrips.length > 0) ranks.push({ rank: 0, spells: toSpellEntries(cantrips) });
      if (spells.length > 0) ranks.push({ rank: Math.ceil(level / 2), spells: toSpellEntries(spells) });
      focusEntries.push({
        id: createId(),
        name: `${capitalize(tradition)} Focus Spells`,
        tradition,
        kind: 'focus',
        dc,
        attack: dc - 10,
        focusPoints: build.focusPoints ?? 1,
        ranks,
        constant: [],
      });
    }
  }
  if (focusEntries.length > 1) warnings.push('Several focus spell entries share one focus point pool.');

  return [...result, ...focusEntries];
};

const mapResistances = (list: unknown[], warnings: string[]): Statblock['resistances'] => {
  const out: Statblock['resistances'] = [];
  for (const r of list) {
    if (typeof r !== 'string') {
      warnings.push('A resistance entry in an unknown format was skipped.');
      continue;
    }
    const m = r.trim().match(/^(.+?)\s+(\d+)$/);
    if (m) out.push({ type: m[1].toLowerCase(), value: Number.parseInt(m[2], 10) });
    else {
      out.push({ type: r.trim().toLowerCase(), value: 0 });
      warnings.push(`Resistance "${r}" has no value in the export.`);
    }
  }
  return out;
};

const mapAbilities = (build: PathbuilderBuild, specials: string[], warnings: string[]): Ability[] => {
  const heritage = build.heritage?.toLowerCase();
  const out: Ability[] = [];
  const seen = new Set<string>();

  const push = (name: string, traits: string[], description: string) => {
    const key = name.toLowerCase();
    if (seen.has(key) || key === heritage || SENSE_LOOKUP.has(key)) return;
    seen.add(key);
    const reaction = REACTION_FEATURES.has(key);
    out.push({
      id: createId(),
      category: reaction ? 'reactive' : 'automatic',
      name,
      actionCost: reaction ? 'reaction' : 'passive',
      traits,
      description,
    });
  };

  for (const feat of build.feats ?? []) {
    if (!Array.isArray(feat) || typeof feat[0] !== 'string' || feat[0] === 'Not Selected') continue;
    const [name, extra, type, level] = feat;
    if (typeof type !== 'string') continue;
    const label = typeof extra === 'string' && extra.trim() !== '' ? `${name} (${extra})` : name;
    push(label, [type.toLowerCase()], isNumber(level) ? `${type}, level ${level}` : type);
  }
  for (const s of specials) push(s, ['feature'], '');

  if (out.length > 0)
    warnings.push(`${out.length} feats and features imported by name only; rules text is not in the export.`);
  return out;
};

export const importPathbuilder = (input: unknown): PathbuilderImport => mapPathbuilderBuild(unwrapPathbuilder(input));

/** The player entry a re-import should update: same Pathbuilder id first, else same name. */
export const findImportMatch = (entries: LibraryEntry[], name: string, sourceId?: string): LibraryEntry | undefined => {
  const players = entries.filter((e) => e.kind === 'player');
  if (sourceId) {
    const byId = players.find((e) => e.source?.kind === 'pathbuilder' && e.source.id === sourceId);
    if (byId) return byId;
  }
  const wanted = name.trim().toLowerCase();
  return players.find((e) => e.statblock.name.trim().toLowerCase() === wanted);
};
