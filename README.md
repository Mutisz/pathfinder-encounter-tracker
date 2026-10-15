# Pathfinder Encounter Tracker

A GM helper for running **Pathfinder 2E Remaster** encounters. Single-page React app, all data stored in the browser
(localStorage), published on GitHub Pages.

## Features (MVP)

- **Library** of reusable NPC and player statblocks, fully structured after the Archives of Nethys / Monster Core layout
  (traits, optional AoN link, perception & senses, languages & communication, skills with per-action modifiers,
  attributes, items, AC and saves with conditional modifiers, HP with healing abilities, immunities/weaknesses/resistances,
  speeds by type, strikes with count and computed multiple attack penalty, spellcasting by rank, rituals by rank,
  abilities in the four printed sections). Editor sections are collapsible; the live preview prints book-style totals.
- **Encounter setup**: players are added automatically; NPCs are added from the library with a count and an optional
  _Batch initiative_ checkbox (copies added together share one roll). Initiative is rolled as d20 + Perception, or any
  skill listed in the statblock. Order: highest first, NPCs win ties against players, tied players can be swapped
  before the encounter starts.
- **Running the encounter**: active participant highlighted, _End turn_ / _Delay_, delayed side list with _Return after
  <active>_ (queued returns resolve at the end of that turn, in the order shown), damage/heal clamped to 0..max HP,
  removal with a reason (dead / ran away / surrendered), removed list with restore, end-of-encounter summary.
- **Reduced to 0 HP**: NPCs choose _Dead_ (removed) or _Dying_; players choose _Dying_ or _Heroic Recovery_. Non-dead
  outcomes move the participant to directly before the current turn, per the knocked-out rule.
- Player HP carries over between encounters (stored on the player's library entry).
- **JSON import**: Library → _Import JSON_ takes one statblock or an array in the tracker's own format
  ([docs/statblock-json.md](docs/statblock-json.md), schema in [docs/statblock.schema.json](docs/statblock.schema.json)),
  so NPCs can be written or generated outside the app. Same-name entries are updated in place unless told otherwise.
- **Pathbuilder import**: Library → Players → _Import from Pathbuilder_ takes the export ID (fetched from
  pathbuilder2e.com) or the pasted/uploaded "Export JSON" file, computes the totals (HP, Perception, saves, trained
  skills and lores, AC, strikes, spells with DCs and slots) and adds reactions such as Reactive Strike and Shield
  Block; other feats are not imported (the export has no rules text). Re-importing the same character offers to
  update the existing entry. Check after import: item bonuses to Perception and skills, weapon traits, melee vs
  ranged.

Rules references (remaster): Encounter Mode / initiative and ties, Delay (Player Core p. 416), Getting Knocked Out,
Hero Points — all on https://2e.aonprd.com/.

## Development

```bash
npm install
npm run dev      # http://localhost:5174/pathfinder-encounter-tracker/
npm test         # vitest, pure rules logic in src/lib
npm run build    # type-check + production build to dist/
npm run format
```

Layout: `src/types` (data model), `src/lib` (pure rules logic + tests), `src/store` (zustand + localStorage),
`src/features` (library and encounter screens), `src/components/ui` (small UI kit).

The statblock JSON format is documented in [docs/statblock-json.md](docs/statblock-json.md), with a JSON Schema in
[docs/statblock.schema.json](docs/statblock.schema.json) for generating or validating NPCs outside the app.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages
(set the repository's Pages source to "GitHub Actions"). `npm run deploy` (gh-pages branch) remains as a manual fallback.

## Roadmap

- Data dump of Monster Core / NPC Core entries, selectable as NPCs
- NPC actions (strikes against a selected participant)
- Conditions with start-of-turn reminders (persistent damage, dying, wounded)
- Data export
