/**
 * Import of the tracker's own statblock JSON (docs/statblock-json.md, docs/statblock.schema.json).
 *
 * The checks mirror the schema: required sections, enums and integer fields are errors; unknown fields
 * are stripped and reported as warnings; missing ids on strikes, spellcasting and abilities are generated.
 */
import { createId } from '@/lib/dice';
import type { LibraryEntry } from '@/types/library';
import type { Ability, Modifier, SpellRank, Statblock } from '@/types/statblock';
import {
  ABILITY_CATEGORIES,
  ACTION_COSTS,
  ATTRIBUTE_KEYS,
  RARITIES,
  SIZES,
  SPELLCASTING_KINDS,
  TRADITIONS,
} from '@/types/statblock';

export interface ParsedStatblock {
  statblock: Statblock;
  warnings: string[];
}

export interface StatblockImportResult {
  statblocks: ParsedStatblock[];
  /** Per-entry failures, e.g. "#2 (Goblin): hp.max must be an integer >= 1". */
  errors: string[];
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);

class Invalid extends Error {}

/** One statblock's validation context: collects warnings and builds error messages with JSON paths. */
class Ctx {
  warnings: string[] = [];

  fail(path: string, message: string): never {
    throw new Invalid(`${path} ${message}`);
  }

  object(x: unknown, path: string): Record<string, unknown> {
    if (!isObject(x)) this.fail(path, 'must be an object');
    return x;
  }

  array(x: unknown, path: string): unknown[] {
    if (!Array.isArray(x)) this.fail(path, 'must be an array');
    return x;
  }

  string(x: unknown, path: string, opts: { nonEmpty?: boolean } = {}): string {
    if (typeof x !== 'string') this.fail(path, 'must be a string');
    if (opts.nonEmpty && x.trim() === '') this.fail(path, 'must not be empty');
    return x;
  }

  optionalString(x: unknown, path: string): string | undefined {
    return x === undefined || x === null ? undefined : this.string(x, path);
  }

  int(x: unknown, path: string, opts: { min?: number; max?: number } = {}): number {
    if (!isInt(x)) this.fail(path, 'must be an integer');
    if (opts.min !== undefined && x < opts.min) this.fail(path, `must be >= ${opts.min}`);
    if (opts.max !== undefined && x > opts.max) this.fail(path, `must be <= ${opts.max}`);
    return x;
  }

  optionalInt(x: unknown, path: string, opts: { min?: number; max?: number } = {}): number | undefined {
    return x === undefined || x === null ? undefined : this.int(x, path, opts);
  }

  enumOf<T extends string | number>(x: unknown, path: string, allowed: readonly T[]): T {
    if (!(allowed as readonly unknown[]).includes(x))
      this.fail(path, `must be one of ${allowed.map(String).join(', ')}`);
    return x as T;
  }

  strings(x: unknown, path: string): string[] {
    return this.array(x, path).map((s, i) => this.string(s, `${path}[${i}]`));
  }

  /** Warns about and drops keys that are not in `known`. */
  known(obj: Record<string, unknown>, path: string, known: readonly string[]): void {
    for (const key of Object.keys(obj)) {
      if (!known.includes(key)) this.warnings.push(`${path ? `${path}.` : ''}${key}: unknown field ignored`);
    }
  }

  modifier(x: unknown, path: string): Modifier {
    const o = this.object(x, path);
    this.known(o, path, ['condition', 'modifier']);
    return {
      condition: this.string(o.condition, `${path}.condition`, { nonEmpty: true }),
      modifier: this.int(o.modifier, `${path}.modifier`),
    };
  }

  modifiers(x: unknown, path: string): Modifier[] {
    return this.array(x, path).map((m, i) => this.modifier(m, `${path}[${i}]`));
  }

  spellRanks(x: unknown, path: string): SpellRank[] {
    return this.array(x, path).map((r, i) => {
      const p = `${path}[${i}]`;
      const o = this.object(r, p);
      this.known(o, p, ['rank', 'slots', 'spells']);
      return {
        rank: this.int(o.rank, `${p}.rank`, { min: 0, max: 10 }),
        slots: this.optionalInt(o.slots, `${p}.slots`, { min: 0 }),
        spells: this.array(o.spells, `${p}.spells`).map((s, j) => {
          const sp = `${p}.spells[${j}]`;
          const so = this.object(s, sp);
          this.known(so, sp, ['name', 'uses']);
          return {
            name: this.string(so.name, `${sp}.name`, { nonEmpty: true }),
            uses: this.optionalString(so.uses, `${sp}.uses`),
          };
        }),
      };
    });
  }
}

const STATBLOCK_KEYS = [
  'schemaVersion',
  'name',
  'level',
  'rarity',
  'size',
  'traits',
  'aonUrl',
  'perception',
  'languages',
  'communication',
  'skills',
  'attributes',
  'items',
  'ac',
  'saves',
  'hp',
  'immunities',
  'weaknesses',
  'resistances',
  'speed',
  'strikes',
  'spellcasting',
  'rituals',
  'abilities',
];

const DICE = /^\d+d\d+([+-]\d+)?$|^\d+$/;

/** Drops keys whose value is undefined so the stored JSON stays clean. */
const compact = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

const validateStatblock = (input: unknown, ctx: Ctx): Statblock => {
  const o = ctx.object(input, 'statblock');
  ctx.known(o, '', STATBLOCK_KEYS);
  if (o.schemaVersion !== 2) ctx.fail('schemaVersion', 'must be 2');

  const perception = ctx.object(o.perception, 'perception');
  ctx.known(perception, 'perception', ['modifier', 'senses']);

  const attributes = ctx.object(o.attributes, 'attributes');
  ctx.known(attributes, 'attributes', ATTRIBUTE_KEYS);

  const ac = ctx.object(o.ac, 'ac');
  ctx.known(ac, 'ac', ['value', 'modifiers']);

  const saves = ctx.object(o.saves, 'saves');
  ctx.known(saves, 'saves', ['fortitude', 'reflex', 'will']);
  const save = (key: 'fortitude' | 'reflex' | 'will') => {
    const s = ctx.object(saves[key], `saves.${key}`);
    ctx.known(s, `saves.${key}`, ['value', 'modifiers']);
    return {
      value: ctx.int(s.value, `saves.${key}.value`),
      modifiers: ctx.modifiers(s.modifiers, `saves.${key}.modifiers`),
    };
  };

  const hp = ctx.object(o.hp, 'hp');
  ctx.known(hp, 'hp', ['max', 'healingAbilities']);

  const typedValues = (x: unknown, path: string) =>
    ctx.array(x, path).map((v, i) => {
      const p = `${path}[${i}]`;
      const t = ctx.object(v, p);
      ctx.known(t, p, ['type', 'value', 'notes']);
      return compact({
        type: ctx.string(t.type, `${p}.type`, { nonEmpty: true }),
        value: ctx.int(t.value, `${p}.value`, { min: 0 }),
        notes: ctx.optionalString(t.notes, `${p}.notes`),
      });
    });

  const speed = ctx.object(o.speed, 'speed');
  ctx.known(speed, 'speed', ['entries', 'notes']);
  const speedEntries = ctx.array(speed.entries, 'speed.entries').map((e, i) => {
    const p = `speed.entries[${i}]`;
    const se = ctx.object(e, p);
    ctx.known(se, p, ['type', 'value']);
    return {
      type: ctx.string(se.type, `${p}.type`, { nonEmpty: true }),
      value: ctx.int(se.value, `${p}.value`, { min: 0 }),
    };
  });
  if (speedEntries.length === 0) ctx.fail('speed.entries', 'must have at least one entry');

  const statblock: Statblock = {
    schemaVersion: 2,
    name: ctx.string(o.name, 'name', { nonEmpty: true }).trim(),
    level: ctx.int(o.level, 'level', { min: -1, max: 30 }),
    rarity: ctx.enumOf(o.rarity, 'rarity', RARITIES),
    size: ctx.enumOf(o.size, 'size', SIZES),
    traits: ctx.strings(o.traits, 'traits'),
    aonUrl: ctx.optionalString(o.aonUrl, 'aonUrl'),
    perception: {
      modifier: ctx.int(perception.modifier, 'perception.modifier'),
      senses: ctx.strings(perception.senses, 'perception.senses'),
    },
    languages: ctx.strings(o.languages, 'languages'),
    communication: ctx.optionalString(o.communication, 'communication'),
    skills: ctx.array(o.skills, 'skills').map((sk, i) => {
      const p = `skills[${i}]`;
      const s = ctx.object(sk, p);
      ctx.known(s, p, ['name', 'modifier', 'actions']);
      return {
        name: ctx.string(s.name, `${p}.name`, { nonEmpty: true }),
        modifier: ctx.int(s.modifier, `${p}.modifier`),
        actions: ctx.modifiers(s.actions ?? [], `${p}.actions`),
      };
    }),
    attributes: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k) => [k, ctx.int(attributes[k], `attributes.${k}`)]),
    ) as Statblock['attributes'],
    items: ctx.strings(o.items, 'items'),
    ac: { value: ctx.int(ac.value, 'ac.value'), modifiers: ctx.modifiers(ac.modifiers, 'ac.modifiers') },
    saves: { fortitude: save('fortitude'), reflex: save('reflex'), will: save('will') },
    hp: {
      max: ctx.int(hp.max, 'hp.max', { min: 1 }),
      healingAbilities: ctx.array(hp.healingAbilities, 'hp.healingAbilities').map((h, i) => {
        const p = `hp.healingAbilities[${i}]`;
        const ho = ctx.object(h, p);
        ctx.known(ho, p, ['name', 'value', 'notes']);
        return compact({
          name: ctx.string(ho.name, `${p}.name`, { nonEmpty: true }),
          value: ctx.optionalInt(ho.value, `${p}.value`),
          notes: ctx.optionalString(ho.notes, `${p}.notes`),
        });
      }),
    },
    immunities: ctx.strings(o.immunities, 'immunities'),
    weaknesses: typedValues(o.weaknesses, 'weaknesses'),
    resistances: typedValues(o.resistances, 'resistances'),
    speed: compact({ entries: speedEntries, notes: ctx.optionalString(speed.notes, 'speed.notes') }),
    strikes: ctx.array(o.strikes, 'strikes').map((st, i) => {
      const p = `strikes[${i}]`;
      const s = ctx.object(st, p);
      ctx.known(s, p, [
        'id',
        'kind',
        'name',
        'attackBonus',
        'traits',
        'damage',
        'effects',
        'count',
        'range',
        'reload',
        'notes',
      ]);
      const damage = ctx.array(s.damage, `${p}.damage`).map((d, j) => {
        const dp = `${p}.damage[${j}]`;
        const dmg = ctx.object(d, dp);
        ctx.known(dmg, dp, ['formula', 'type']);
        const formula = ctx.string(dmg.formula, `${dp}.formula`, { nonEmpty: true }).replace(/\s+/g, '');
        if (!DICE.test(formula)) ctx.fail(`${dp}.formula`, 'must look like 1d6+4, 2d8 or 3');
        return { formula, type: ctx.string(dmg.type, `${dp}.type`, { nonEmpty: true }) };
      });
      if (damage.length === 0) ctx.fail(`${p}.damage`, 'must have at least one entry');
      return compact({
        id: ctx.optionalString(s.id, `${p}.id`) ?? createId(),
        kind: ctx.enumOf(s.kind, `${p}.kind`, ['melee', 'ranged'] as const),
        name: ctx.string(s.name, `${p}.name`, { nonEmpty: true }),
        attackBonus: ctx.int(s.attackBonus, `${p}.attackBonus`),
        traits: ctx.strings(s.traits, `${p}.traits`),
        damage,
        effects: ctx.optionalString(s.effects, `${p}.effects`),
        count: ctx.optionalInt(s.count, `${p}.count`, { min: 1 }),
        range: ctx.optionalString(s.range, `${p}.range`),
        reload: ctx.optionalString(s.reload, `${p}.reload`),
        notes: ctx.optionalString(s.notes, `${p}.notes`),
      });
    }),
    spellcasting: ctx.array(o.spellcasting, 'spellcasting').map((sc, i) => {
      const p = `spellcasting[${i}]`;
      const s = ctx.object(sc, p);
      ctx.known(s, p, ['id', 'name', 'tradition', 'kind', 'dc', 'attack', 'focusPoints', 'ranks', 'constant']);
      return compact({
        id: ctx.optionalString(s.id, `${p}.id`) ?? createId(),
        name: ctx.string(s.name, `${p}.name`, { nonEmpty: true }),
        tradition: ctx.enumOf(s.tradition, `${p}.tradition`, TRADITIONS),
        kind: ctx.enumOf(s.kind, `${p}.kind`, SPELLCASTING_KINDS),
        dc: ctx.int(s.dc, `${p}.dc`),
        attack: ctx.optionalInt(s.attack, `${p}.attack`),
        focusPoints: ctx.optionalInt(s.focusPoints, `${p}.focusPoints`, { min: 0 }),
        ranks: ctx.spellRanks(s.ranks, `${p}.ranks`),
        constant: ctx.spellRanks(s.constant ?? [], `${p}.constant`),
      });
    }),
    rituals: ctx.array(o.rituals, 'rituals').map((r, i) => {
      const p = `rituals[${i}]`;
      const ro = ctx.object(r, p);
      ctx.known(ro, p, ['name', 'rank']);
      return {
        name: ctx.string(ro.name, `${p}.name`, { nonEmpty: true }),
        rank: ctx.int(ro.rank, `${p}.rank`, { min: 1, max: 10 }),
      };
    }),
    abilities: ctx.array(o.abilities, 'abilities').map((ab, i): Ability => {
      const p = `abilities[${i}]`;
      const a = ctx.object(ab, p);
      ctx.known(a, p, [
        'id',
        'category',
        'name',
        'actionCost',
        'traits',
        'frequency',
        'trigger',
        'requirements',
        'description',
      ]);
      return compact({
        id: ctx.optionalString(a.id, `${p}.id`) ?? createId(),
        category: ctx.enumOf(a.category, `${p}.category`, ABILITY_CATEGORIES),
        name: ctx.string(a.name, `${p}.name`, { nonEmpty: true }),
        actionCost: ctx.enumOf(a.actionCost, `${p}.actionCost`, ACTION_COSTS),
        traits: ctx.strings(a.traits, `${p}.traits`),
        frequency: ctx.optionalString(a.frequency, `${p}.frequency`),
        trigger: ctx.optionalString(a.trigger, `${p}.trigger`),
        requirements: ctx.optionalString(a.requirements, `${p}.requirements`),
        description: ctx.string(a.description ?? '', `${p}.description`),
      });
    }),
  };
  return compact(statblock);
};

/** Validates one statblock or an array of them. Each entry succeeds or fails on its own. */
export const importStatblocks = (input: unknown): StatblockImportResult => {
  const list = Array.isArray(input) ? input : [input];
  const result: StatblockImportResult = { statblocks: [], errors: [] };
  if (list.length === 0) {
    result.errors.push('The file is an empty array.');
    return result;
  }
  list.forEach((item, i) => {
    const ctx = new Ctx();
    const label = `#${i + 1}${isObject(item) && typeof item.name === 'string' ? ` (${item.name})` : ''}`;
    try {
      result.statblocks.push({ statblock: validateStatblock(item, ctx), warnings: ctx.warnings });
    } catch (e) {
      if (e instanceof Invalid) result.errors.push(`${label}: ${e.message}`);
      else throw e;
    }
  });
  return result;
};

export const parseStatblockJson = (text: string): StatblockImportResult => {
  let data: unknown;
  try {
    data = JSON.parse(text.trim());
  } catch {
    return { statblocks: [], errors: ['Not valid JSON.'] };
  }
  return importStatblocks(data);
};

/** The entry of the given kind a re-import should update: same name, case-insensitive. */
export const findByName = (
  entries: LibraryEntry[],
  kind: LibraryEntry['kind'],
  name: string,
): LibraryEntry | undefined => {
  const wanted = name.trim().toLowerCase();
  return entries.find((e) => e.kind === kind && e.statblock.name.trim().toLowerCase() === wanted);
};
