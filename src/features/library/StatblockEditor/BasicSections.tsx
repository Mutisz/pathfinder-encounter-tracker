import { Button } from '@/components/ui/Button';
import { Label, ListInput, NumberInput, Select, TextArea, TextInput } from '@/components/ui/Field';
import { ATTRIBUTE_KEYS, RARITIES, SIZES, type Rarity, type Size } from '@/types/statblock';
import { removeAt, replaceAt, Row, SectionCard, type SectionProps } from './types';

export function HeaderSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Name & traits">
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
        <Label label="Source book" className="col-span-2 md:col-span-3">
          <TextInput
            value={sb.source?.book ?? ''}
            onChange={(e) => patch({ source: { ...sb.source, book: e.target.value } })}
            placeholder="NPC Core"
          />
        </Label>
        <Label label="Page">
          <NumberInput
            value={sb.source?.page ?? 0}
            onChange={(page) => patch({ source: { book: sb.source?.book ?? '', ...sb.source, page } })}
          />
        </Label>
      </Row>
    </SectionCard>
  );
}

export function PerceptionSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Perception & languages">
      <Row>
        <Label label="Perception modifier">
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
        <Label label="Perception notes" className="col-span-2 md:col-span-4">
          <TextInput
            value={sb.perception.notes ?? ''}
            onChange={(e) => patch({ perception: { ...sb.perception, notes: e.target.value } })}
          />
        </Label>
        <Label label="Languages" className="col-span-2 md:col-span-3">
          <ListInput value={sb.languages} onChange={(languages) => patch({ languages })} placeholder="Common, Goblin" />
        </Label>
        <Label label="Language notes">
          <TextInput
            value={sb.languageNotes ?? ''}
            onChange={(e) => patch({ languageNotes: e.target.value })}
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
    <SectionCard title="Skills">
      {skills.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_6rem_1fr_auto] items-end gap-2">
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
          <Label label="Notes">
            <TextInput
              value={s.notes ?? ''}
              onChange={(e) => patch({ skills: replaceAt(skills, i, { ...s, notes: e.target.value }) })}
              placeholder="+9 to Climb"
            />
          </Label>
          <Button size="sm" variant="ghost" onClick={() => patch({ skills: removeAt(skills, i) })}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => patch({ skills: [...skills, { name: '', modifier: 0 }] })}>
        + Add skill
      </Button>
    </SectionCard>
  );
}

export function AttributesSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Attribute modifiers">
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
    <SectionCard title="Items">
      <ListInput
        value={sb.items}
        onChange={(items) => patch({ items })}
        placeholder="club, sling (10 bullets), studded leather armor"
      />
    </SectionCard>
  );
}

export function DefensesSection({ sb, patch }: SectionProps) {
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

  return (
    <SectionCard title="Defenses">
      <Row>
        <Label label="AC">
          <NumberInput value={sb.ac.value} onChange={(value) => patch({ ac: { ...sb.ac, value } })} />
        </Label>
        <Label label="AC notes" className="col-span-2 md:col-span-3">
          <TextInput
            value={sb.ac.notes ?? ''}
            placeholder="+2 vs. ranged"
            onChange={(e) => patch({ ac: { ...sb.ac, notes: e.target.value } })}
          />
        </Label>
        <Label label="Fortitude">
          <NumberInput
            value={sb.saves.fortitude}
            onChange={(fortitude) => patch({ saves: { ...sb.saves, fortitude } })}
          />
        </Label>
        <Label label="Reflex">
          <NumberInput value={sb.saves.reflex} onChange={(reflex) => patch({ saves: { ...sb.saves, reflex } })} />
        </Label>
        <Label label="Will">
          <NumberInput value={sb.saves.will} onChange={(will) => patch({ saves: { ...sb.saves, will } })} />
        </Label>
        <Label label="Saves notes">
          <TextInput
            value={sb.saves.notes ?? ''}
            placeholder="+1 status to all saves vs. magic"
            onChange={(e) => patch({ saves: { ...sb.saves, notes: e.target.value } })}
          />
        </Label>
        <Label label="Max HP">
          <NumberInput
            value={sb.hp.max}
            min={1}
            onChange={(max) => patch({ hp: { ...sb.hp, max: Math.max(1, max) } })}
          />
        </Label>
        <Label label="HP notes" className="col-span-2 md:col-span-3">
          <TextInput
            value={sb.hp.notes ?? ''}
            placeholder="regeneration 10 (deactivated by fire)"
            onChange={(e) => patch({ hp: { ...sb.hp, notes: e.target.value } })}
          />
        </Label>
        <Label label="Immunities" className="col-span-2 md:col-span-4">
          <ListInput
            value={sb.immunities}
            onChange={(immunities) => patch({ immunities })}
            placeholder="death effects, poison"
          />
        </Label>
      </Row>
      <div className="grid gap-4 md:grid-cols-2">
        {typed('weaknesses')}
        {typed('resistances')}
      </div>
    </SectionCard>
  );
}

export function SpeedSection({ sb, patch }: SectionProps) {
  const other = sb.speed.other;
  return (
    <SectionCard title="Speed">
      <Row>
        <Label label="Speed (feet)">
          <NumberInput value={sb.speed.base} onChange={(base) => patch({ speed: { ...sb.speed, base } })} />
        </Label>
        <Label label="Notes" className="col-span-2 md:col-span-3">
          <TextInput
            value={sb.speed.notes ?? ''}
            placeholder="ignores difficult terrain"
            onChange={(e) => patch({ speed: { ...sb.speed, notes: e.target.value } })}
          />
        </Label>
      </Row>
      {other.map((o, i) => (
        <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
          <Label label="Type">
            <TextInput
              value={o.type}
              placeholder="fly"
              onChange={(e) =>
                patch({ speed: { ...sb.speed, other: replaceAt(other, i, { ...o, type: e.target.value }) } })
              }
            />
          </Label>
          <Label label="Feet">
            <NumberInput
              value={o.value}
              onChange={(value) => patch({ speed: { ...sb.speed, other: replaceAt(other, i, { ...o, value }) } })}
            />
          </Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => patch({ speed: { ...sb.speed, other: removeAt(other, i) } })}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => patch({ speed: { ...sb.speed, other: [...other, { type: '', value: 0 }] } })}>
        + Add speed
      </Button>
    </SectionCard>
  );
}

export function RitualsSection({ sb, patch }: SectionProps) {
  return (
    <SectionCard title="Rituals">
      <TextArea
        value={sb.rituals.join('\n')}
        placeholder="One ritual per line, e.g. create undead (rank 6)"
        onChange={(e) => patch({ rituals: e.target.value.split('\n') })}
        onBlur={(e) =>
          patch({
            rituals: e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />
    </SectionCard>
  );
}
