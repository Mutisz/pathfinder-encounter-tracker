# Statblock JSON format

This is the native statblock format of the Pathfinder Encounter Tracker (PF2E Remaster). Use it to hand-write or
generate NPCs for import. The machine-readable version is [`statblock.schema.json`](statblock.schema.json)
(JSON Schema 2020-12); the TypeScript source of truth is [`src/types/statblock.ts`](../src/types/statblock.ts).

An import file contains **one statblock object or an array of them**. Every statblock is self-contained: the
tracker stores exactly what you give it and never looks anything up. The layout follows a printed Archives of Nethys
/ Monster Core entry from top to bottom, so the easiest way to write one is to transcribe a statblock section by
section.

## Rules for writers

- **All numbers are final totals** as printed: Perception +9 is `9`, AC 18 is `18`, a Strength modifier of +4 is
  `4`. Attributes are modifiers, never scores.
- **Every top-level section is required**, even when empty (`[]`). Only the fields marked optional below may be
  omitted. Do not add fields that are not listed; unknown fields are rejected.
- **`schemaVersion` is always `2`.**
- **Strings are lowercase where the book prints them lowercase**: traits, strike names, damage types, senses,
  weakness/resistance types. Skill names, spell names, ability names and item names keep their printed capitals.
- **`id` fields are optional.** The tracker generates them on import. Leave them out.
- **Conditional values** such as "AC 20 (22 with shield raised)" or "Fort +12 (+14 vs. poison)" are a base
  `value` plus a list of `{ "condition", "modifier" }` entries holding the _difference_: `{ "condition": "with shield
raised", "modifier": 2 }`.
- **Dice formulas** are written as printed: `"1d8+4"`, `"2d6"`, or a flat `"3"`. No spaces, one damage type per
  entry; "1d8+4 slashing plus 1d6 fire" is two damage entries.
- **Level** may be `-1` for the weakest creatures.

## Field reference

### Header

| Field           | Type                                                                 | Notes                                                                       |
| --------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `schemaVersion` | `2`                                                                  | constant                                                                    |
| `name`          | string                                                               | as printed                                                                  |
| `level`         | integer                                                              | `-1` to `30`                                                                |
| `rarity`        | `"common" \| "uncommon" \| "rare" \| "unique"`                       |                                                                             |
| `size`          | `"tiny" \| "small" \| "medium" \| "large" \| "huge" \| "gargantuan"` |                                                                             |
| `traits`        | string[]                                                             | the trait line _after_ rarity and size, lowercase: `["goblin", "humanoid"]` |
| `aonUrl`        | string, optional                                                     | Archives of Nethys link                                                     |

### Perception, languages, skills, attributes, items

| Field                 | Type                               | Notes                                                                                                                                                                                                            |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `perception.modifier` | integer                            |                                                                                                                                                                                                                  |
| `perception.senses`   | string[]                           | `["darkvision", "scent (imprecise) 30 feet"]`                                                                                                                                                                    |
| `languages`           | string[]                           | `["Common", "Goblin"]`; `[]` if none                                                                                                                                                                             |
| `communication`       | string, optional                   | `"telepathy 100 feet"`                                                                                                                                                                                           |
| `skills`              | `{ name, modifier, actions }[]`    | `actions` lists per-action modifiers: `{ "condition": "to Climb", "modifier": 2 }`. Lores are named `"Warfare Lore"`. The skills listed here (plus Perception) are the initiative options offered in encounters. |
| `attributes`          | `{ str, dex, con, int, wis, cha }` | integer modifiers                                                                                                                                                                                                |
| `items`               | string[]                           | gear as printed, one item per entry                                                                                                                                                                              |

### Defenses

| Field                                 | Type                         | Notes                                                                                                                    |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ac.value`                            | integer                      |                                                                                                                          |
| `ac.modifiers`                        | modifier[]                   | conditional AC, see above                                                                                                |
| `saves.fortitude` / `reflex` / `will` | `{ value, modifiers }`       |                                                                                                                          |
| `hp.max`                              | integer ≥ 1                  |                                                                                                                          |
| `hp.healingAbilities`                 | `{ name, value?, notes? }[]` | `name` is `"regeneration"`, `"fast healing"` or `"negative healing"`; `notes` e.g. `"deactivated by acid or fire"`       |
| `immunities`                          | string[]                     | `["death effects", "disease"]`                                                                                           |
| `weaknesses` / `resistances`          | `{ type, value, notes? }[]`  | `{ "type": "cold iron", "value": 5 }`, `{ "type": "physical", "value": 10, "notes": "except silver" }`                   |
| `speed.entries`                       | `{ type, value }[]`          | at least one; `type` is `"base"` for the land Speed, otherwise `"fly"`, `"burrow"`, `"swim"`, `"climb"` or a custom word |
| `speed.notes`                         | string, optional             | `"ignores difficult terrain"`                                                                                            |

### Offense

**Strikes** — `strikes: strike[]`

| Field         | Type                  | Notes                                                                                                                       |
| ------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | `"melee" \| "ranged"` |                                                                                                                             |
| `name`        | string                | lowercase as printed: `"shortsword"`, `"jaws"`                                                                              |
| `attackBonus` | integer               | the first attack value; the tracker derives the multiple attack penalty (−5/−10, or −4/−8 when `traits` contains `"agile"`) |
| `traits`      | string[]              | lowercase weapon traits: `["agile", "finesse"]`, `["reach 10 feet"]`                                                        |
| `damage`      | `{ formula, type }[]` | at least one entry; `"persistent bleed"` style types are fine                                                               |
| `effects`     | string, optional      | text after the damage: `"plus Grab"`                                                                                        |
| `count`       | integer, optional     | number carried (ammunition)                                                                                                 |
| `range`       | string, optional      | ranged only: `"range increment 60 feet"`                                                                                    |
| `reload`      | string, optional      | ranged only: `"reload 1"`                                                                                                   |
| `notes`       | string, optional      |                                                                                                                             |

**Spellcasting** — `spellcasting: entry[]`, one entry per printed spellcasting line

| Field         | Type                                                 | Notes                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string                                               | as printed: `"Divine Prepared Spells"`, `"Occult Innate Spells"`, `"Primal Focus Spells"`                                                                                                          |
| `tradition`   | `"arcane" \| "divine" \| "occult" \| "primal"`       |                                                                                                                                                                                                    |
| `kind`        | `"prepared" \| "spontaneous" \| "innate" \| "focus"` |                                                                                                                                                                                                    |
| `dc`          | integer                                              |                                                                                                                                                                                                    |
| `attack`      | integer, optional                                    | spell attack modifier when printed                                                                                                                                                                 |
| `focusPoints` | integer, optional                                    | focus entries only                                                                                                                                                                                 |
| `ranks`       | `{ rank, slots?, spells }[]`                         | one object per rank; `rank` `0` is cantrips; `slots` only for spontaneous casters; `spells` is `{ name, uses? }[]` where `uses` is `"×2"`, `"at will"` or `"3/day"` for prepared and innate spells |
| `constant`    | same as `ranks`                                      | constant spells; usually `[]`                                                                                                                                                                      |

**Rituals** — `rituals: { name, rank }[]`, `rank` 1–10.

### Abilities

`abilities: ability[]`. The tracker prints them in four sections chosen by `category`:

| `category`      | Where it is printed                             | Examples                                                                         |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `"interaction"` | top of the statblock, before AC                 | Low-Light Vision notes, +2 to Seek, Darkvision riders                            |
| `"automatic"`   | between defenses and Speed                      | auras, passive abilities, Attack of Opportunity-style passives without a trigger |
| `"reactive"`    | same area, reactions and triggered free actions | Reactive Strike, Shield Block, Ferocity                                          |
| `"offensive"`   | after the strikes                               | Sneak Attack, Breath Weapon, Grab, Swallow Whole                                 |

| Field          | Type                                                                          | Notes                                                                    |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `name`         | string                                                                        |                                                                          |
| `actionCost`   | `"passive" \| "free" \| "reaction" \| 1 \| 2 \| 3 \| "1-2" \| "1-3" \| "2-3"` | numbers are JSON integers, not strings; `"passive"` means no action icon |
| `traits`       | string[]                                                                      | lowercase                                                                |
| `frequency`    | string, optional                                                              | `"once per day"`                                                         |
| `trigger`      | string, optional                                                              | reactions and triggered free actions                                     |
| `requirements` | string, optional                                                              |                                                                          |
| `description`  | string                                                                        | full rules text; for a reaction put the Effect text here                 |

## Complete example

A level 2 bandit lookout with a shield, a bow, one reaction and a focus spell:

```json
{
  "schemaVersion": 2,
  "name": "Bandit Lookout",
  "level": 2,
  "rarity": "common",
  "size": "medium",
  "traits": ["human", "humanoid"],
  "perception": { "modifier": 9, "senses": [] },
  "languages": ["Common"],
  "skills": [
    { "name": "Acrobatics", "modifier": 7, "actions": [] },
    { "name": "Athletics", "modifier": 6, "actions": [{ "condition": "to Climb", "modifier": 2 }] },
    { "name": "Stealth", "modifier": 9, "actions": [] },
    { "name": "Survival", "modifier": 6, "actions": [] },
    { "name": "Underworld Lore", "modifier": 5, "actions": [] }
  ],
  "attributes": { "str": 2, "dex": 4, "con": 1, "int": 0, "wis": 2, "cha": 0 },
  "items": ["leather armor", "wooden shield (Hardness 3, HP 12, BT 6)", "shortsword", "shortbow", "20 arrows"],
  "ac": { "value": 18, "modifiers": [{ "condition": "with shield raised", "modifier": 2 }] },
  "saves": {
    "fortitude": { "value": 7, "modifiers": [] },
    "reflex": { "value": 10, "modifiers": [] },
    "will": { "value": 6, "modifiers": [{ "condition": "vs. fear", "modifier": 1 }] }
  },
  "hp": { "max": 30, "healingAbilities": [] },
  "immunities": [],
  "weaknesses": [],
  "resistances": [],
  "speed": { "entries": [{ "type": "base", "value": 25 }] },
  "strikes": [
    {
      "kind": "melee",
      "name": "shortsword",
      "attackBonus": 10,
      "traits": ["agile", "finesse", "versatile s"],
      "damage": [{ "formula": "1d6+4", "type": "piercing" }]
    },
    {
      "kind": "ranged",
      "name": "shortbow",
      "attackBonus": 10,
      "traits": ["deadly d10"],
      "damage": [{ "formula": "1d6+2", "type": "piercing" }],
      "count": 20,
      "range": "range increment 60 feet",
      "reload": "reload 0"
    }
  ],
  "spellcasting": [
    {
      "name": "Primal Focus Spells",
      "tradition": "primal",
      "kind": "focus",
      "dc": 17,
      "focusPoints": 1,
      "ranks": [{ "rank": 1, "spells": [{ "name": "Pet Cache" }] }],
      "constant": []
    }
  ],
  "rituals": [],
  "abilities": [
    {
      "category": "reactive",
      "name": "Shield Block",
      "actionCost": "reaction",
      "traits": [],
      "trigger": "While the lookout has their shield raised, they would take damage from a physical attack.",
      "description": "The lookout snaps their shield into place. The shield prevents 3 damage; the lookout and the shield each take any remaining damage."
    },
    {
      "category": "offensive",
      "name": "Sneak Attack",
      "actionCost": "passive",
      "traits": [],
      "description": "The lookout deals an extra 1d6 precision damage to off-guard creatures."
    },
    {
      "category": "offensive",
      "name": "Warning Whistle",
      "actionCost": 1,
      "traits": ["auditory"],
      "frequency": "once per encounter",
      "description": "The lookout blows a shrill whistle. Every bandit within 100 feet that can hear it is no longer off-guard to hidden attackers this round and gains a +1 circumstance bonus to initiative if combat has not started."
    }
  ]
}
```

## Validating before import

Any JSON Schema validator works. With Node.js and ajv:

```bash
npx --yes ajv-cli validate -s docs/statblock.schema.json -d my-npcs.json --spec=draft2020
```

The tracker's importer runs the same structural checks and, in addition, fills in generated `id`s, so a file that
passes the schema imports cleanly.
