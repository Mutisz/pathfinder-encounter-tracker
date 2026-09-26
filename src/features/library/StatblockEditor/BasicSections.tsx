import { Button } from '@/components/ui/Button';
import { Label, ListInput, NumberInput, Select, TextInput } from '@/components/ui/Field';
import {
  ATTRIBUTE_KEYS,
  RARITIES,
  SIZES,
  SPEED_TYPES,
  type Rarity,
  type SaveValue,
  type Size,
} from '@/types/statblock';
import { ModifierListEditor } from './ModifierListEditor';
import { countSummary, removeAt, replaceAt, Row, SectionCard, type SectionProps } from './types';

export function HeaderSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Name & traits" defaultOpen>
      <Row>
        <Label label="Name" className="col-span-2">
          <TextInput value={sb.name} onChange={(e) => patch({ name: e.target.value })} />
        </Label>
        <Label label="Level">
          <NumberInput value={sb.level} onChange={(level) => patch({ level })} />
        </Label>
        <Label label="Rarity">
          <Select value={sb.rarity} onChange={(e) => patch({ rarity: e.target.value as Rarity })}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Label>
        <Label label="Size">
          <Select value={sb.size} onChange={(e) => patch({ size: e.target.value as Size })}>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Label>
        <Label label="Other traits" className="col-span-2 md:col-span-3">
          <ListInput value={sb.traits} onChange={(traits) => patch({ traits })} placeholder="human, humanoid" />
        </Label>
        <Label label="Archives of Nethys URL (optional)" className="col-span-2 md:col-span-4">
          <TextInput
            type="url"
            value={sb.aonUrl ?? ''}
            onChange={(e) => patch({ aonUrl: e.target.value.trim() || undefined })}
            placeholder="https://2e.aonprd.com/NPCs.aspx?ID=..."
          />
        </Label>
      </Row>
    </SectionCard>
  );
}

export function PerceptionSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Perception & languages" defaultOpen>
      <Row>
        <Label label="Perception">
          <NumberInput
            value={sb.perception.modifier}
            onChange={(modifier) => patch({ perception: { ...sb.perception, modifier } })}
          />
        </Label>
        <Label label="Senses" className="col-span-2 md:col-span-3">
          <ListInput
            value={sb.perception.senses}
            onChange={(senses) => patch({ perception: { ...sb.perception, senses } })}
            placeholder="darkvision, scent (imprecise) 30 feet"
          />
        </Label>
        <Label label="Languages" className="col-span-2 md:col-span-3">
          <ListInput value={sb.languages} onChange={(languages) => patch({ languages })} placeholder="Common, Goblin" />
        </Label>
        <Label label="Communication">
          <TextInput
            value={sb.communication ?? ''}
            onChange={(e) => patch({ communication: e.target.value || undefined })}
            placeholder="telepathy 100 feet"
          />
        </Label>
      </Row>
    </SectionCard>
  );
}

export function SkillsSection({ sb, patch }: SectionProps) {
  const skills = sb.skills;
  return (
    <SectionCard title="Skills" defaultOpen summary={countSummary(skills.length, 'skill')}>
      {skills.map((s, i) => (
        <div key={i} className="space-y-2 rounded border border-stone-200 p-3">
          <div className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
            <Label label="Skill">
              <TextInput
                value={s.name}
                onChange={(e) => patch({ skills: replaceAt(skills, i, { ...s, name: e.target.value }) })}
                placeholder="Athletics"
              />
            </Label>
            <Label label="Modifier">
              <NumberInput
                value={s.modifier}
                onChange={(modifier) => patch({ skills: replaceAt(skills, i, { ...s, modifier }) })}
              />
            </Label>
            <Button size="sm" variant="ghost" onClick={() => patch({ skills: removeAt(skills, i) })}>
              ✕
            </Button>
          </div>
          <div className="pl-3">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Actions (modifiers for specific actions of this skill)
            </span>
            <ModifierListEditor
              value={s.actions}
              onChange={(actions) => patch({ skills: replaceAt(skills, i, { ...s, actions }) })}
              placeholder="Climb"
              addLabel="+ Add action"
            />
          </div>
        </div>
      ))}
      <Button size="sm" onClick={() => patch({ skills: [...skills, { name: '', modifier: 0, actions: [] }] })}>
        + Add skill
      </Button>
    </SectionCard>
  );
}

export function AttributesSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Attribute modifiers" defaultOpen>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {ATTRIBUTE_KEYS.map((k) => (
          <Label key={k} label={k.toUpperCase()}>
            <NumberInput
              value={sb.attributes[k]}
              onChange={(v) => patch({ attributes: { ...sb.attributes, [k]: v } })}
            />
          </Label>
        ))}
      </div>
    </SectionCard>
  );
}

export function ItemsSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Items" summary={countSummary(sb.items.length, 'item')}>
      <ListInput
        value={sb.items}
        onChange={(items) => patch({ items })}
        placeholder="club, sling (10 bullets), studded leather armor"
      />
    </SectionCard>
  );
}

const SAVE_KEYS = ['fortitude', 'reflex', 'will'] as const;
const SAVE_LABELS = { fortitude: 'Fortitude', reflex: 'Reflex', will: 'Will' } as const;

export function DefensesSection({ sb, patch }: SectionProps) {
  const setSave = (key: (typeof SAVE_KEYS)[number], v: SaveValue) => patch({ saves: { ...sb.saves, [key]: v } });

  const typed = (key: 'weaknesses' | 'resistances') => (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-stone-700">
        {key === 'weaknesses' ? 'Weaknesses' : 'Resistances'}
      </span>
      {sb[key].map((w, i) => (
        <div key={i} className="grid grid-cols-[1fr_5rem_1fr_auto] items-end gap-2">
          <TextInput
            value={w.type}
            placeholder="fire"
            onChange={(e) => patch({ [key]: replaceAt(sb[key], i, { ...w, type: e.target.value }) })}
          />
          <NumberInput value={w.value} onChange={(value) => patch({ [key]: replaceAt(sb[key], i, { ...w, value }) })} />
          <TextInput
            value={w.notes ?? ''}
            placeholder="except silver"
            onChange={(e) => patch({ [key]: replaceAt(sb[key], i, { ...w, notes: e.target.value }) })}
          />
          <Button size="sm" variant="ghost" onClick={() => patch({ [key]: removeAt(sb[key], i) })}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => patch({ [key]: [...sb[key], { type: '', value: 0 }] })}>
        + Add
      </Button>
    </div>
  );

  const healing = sb.hp.healingAbilities;

  return (
    <SectionCard title="Defenses" defaultOpen>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label label="AC" className="max-w-32">
            <NumberInput value={sb.ac.value} onChange={(value) => patch({ ac: { ...sb.ac, value } })} />
          </Label>
          <span className="block text-xs font-medium text-stone-500">AC modifiers</span>
          <ModifierListEditor
            value={sb.ac.modifiers}
            onChange={(modifiers) => patch({ ac: { ...sb.ac, modifiers } })}
            placeholder="with shield raised"
          />
        </div>
        <div className="space-y-2">
          <Label label="Max HP" className="max-w-32">
            <NumberInput
              value={sb.hp.max}
              min={1}
              onChange={(max) => patch({ hp: { ...sb.hp, max: Math.max(1, max) } })}
            />
          </Label>
          <span className="block text-xs font-medium text-stone-500">Healing abilities</span>
          {healing.length > 0 && (
            <div className="grid grid-cols-[1fr_5rem_1fr_auto] gap-2 text-xs font-medium text-stone-500">
              <span>Name</span>
              <span>Value</span>
              <span>Notes</span>
              <span />
            </div>
          )}
          {healing.map((h, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_1fr_auto] gap-2">
              <TextInput
                value={h.name}
                placeholder="regeneration"
                onChange={(e) =>
                  patch({ hp: { ...sb.hp, healingAbilities: replaceAt(healing, i, { ...h, name: e.target.value }) } })
                }
              />
              <NumberInput
                value={h.value ?? Number.NaN}
                placeholder="—"
                onChange={(value) =>
                  patch({
                    hp: { ...sb.hp, healingAbilities: replaceAt(healing, i, { ...h, value: value || undefined }) },
                  })
                }
              />
              <TextInput
                value={h.notes ?? ''}
                placeholder="deactivated by fire"
                onChange={(e) =>
                  patch({
                    hp: {
                      ...sb.hp,
                      healingAbilities: replaceAt(healing, i, { ...h, notes: e.target.value || undefined }),
                    },
                  })
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => patch({ hp: { ...sb.hp, healingAbilities: removeAt(healing, i) } })}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button size="sm" onClick={() => patch({ hp: { ...sb.hp, healingAbilities: [...healing, { name: '' }] } })}>
            + Add healing ability
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SAVE_KEYS.map((key) => (
          <div key={key} className="space-y-2">
            <Label label={SAVE_LABELS[key]} className="max-w-32">
              <NumberInput
                value={sb.saves[key].value}
                onChange={(value) => setSave(key, { ...sb.saves[key], value })}
              />
            </Label>
            <span className="block text-xs font-medium text-stone-500">{SAVE_LABELS[key]} modifiers</span>
            <ModifierListEditor
              value={sb.saves[key].modifiers}
              onChange={(modifiers) => setSave(key, { ...sb.saves[key], modifiers })}
              placeholder="vs. poison"
            />
          </div>
        ))}
      </div>

      <Label label="Immunities">
        <ListInput
          value={sb.immunities}
          onChange={(immunities) => patch({ immunities })}
          placeholder="death effects, poison"
        />
      </Label>
      <div className="grid gap-4 md:grid-cols-2">
        {typed('weaknesses')}
        {typed('resistances')}
      </div>
    </SectionCard>
  );
}

export function SpeedSection({ sb, patch }: SectionProps) {
  const entries = sb.speed.entries;
  const set = (i: number, e: (typeof entries)[number]) =>
    patch({ speed: { ...sb.speed, entries: replaceAt(entries, i, e) } });
  return (
    <SectionCard title="Speed" defaultOpen>
      <datalist id="speed-types">
        {SPEED_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      {entries.map((e, i) => (
        <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
          <Label label="Type">
            <TextInput
              list="speed-types"
              value={e.type}
              placeholder="fly"
              onChange={(ev) => set(i, { ...e, type: ev.target.value })}
            />
          </Label>
          <Label label="Feet">
            <NumberInput value={e.value} onChange={(value) => set(i, { ...e, value })} />
          </Label>
          <Button
            size="sm"
            variant="ghost"
            disabled={e.type === 'base'}
            title={e.type === 'base' ? 'The base Speed cannot be removed' : 'Remove'}
            onClick={() => patch({ speed: { ...sb.speed, entries: removeAt(entries, i) } })}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        onClick={() => patch({ speed: { ...sb.speed, entries: [...entries, { type: '', value: 0 }] } })}
      >
        + Add speed
      </Button>
      <Label label="Notes">
        <TextInput
          value={sb.speed.notes ?? ''}
          placeholder="ignores difficult terrain"
          onChange={(e) => patch({ speed: { ...sb.speed, notes: e.target.value || undefined } })}
        />
      </Label>
    </SectionCard>
  );
}

export function RitualsSection({ sb, patch }: SectionProps) {
  const rituals = sb.rituals;
  return (
    <SectionCard title="Rituals" summary={countSummary(rituals.length, 'ritual')}>
      {rituals.map((r, i) => (
        <div key={i} className="grid grid-cols-[6rem_1fr_auto] items-end gap-2">
          <Label label="Rank">
            <NumberInput
              value={r.rank}
              min={1}
              max={10}
              onChange={(rank) =>
                patch({ rituals: replaceAt(rituals, i, { ...r, rank: Math.max(1, Math.min(10, rank)) }) })
              }
            />
          </Label>
          <Label label="Ritual">
            <TextInput
              value={r.name}
              placeholder="create undead"
              onChange={(e) => patch({ rituals: replaceAt(rituals, i, { ...r, name: e.target.value }) })}
            />
          </Label>
          <Button size="sm" variant="ghost" onClick={() => patch({ rituals: removeAt(rituals, i) })}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => patch({ rituals: [...rituals, { name: '', rank: 1 }] })}>
        + Add ritual
      </Button>
    </SectionCard>
  );
}
