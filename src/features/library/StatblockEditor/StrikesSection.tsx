import { Button } from '@/components/ui/Button';
import { Label, ListInput, NumberInput, Select, TextInput } from '@/components/ui/Field';
import { createId } from '@/lib/dice';
import type { Strike } from '@/types/statblock';
import { removeAt, replaceAt, SectionCard, type SectionProps } from './types';

export function StrikesSection({ sb, patch }: SectionProps) {
  const strikes = sb.strikes;
  const set = (i: number, s: Strike) => patch({ strikes: replaceAt(strikes, i, s) });

  return (
    <SectionCard title="Strikes">
      {strikes.map((s, i) => (
        <div key={s.id} className="space-y-2 rounded border border-stone-200 p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-[7rem_1fr_6rem_1fr_auto]">
            <Label label="Type">
              <Select value={s.kind} onChange={(e) => set(i, { ...s, kind: e.target.value as Strike['kind'] })}>
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
              </Select>
            </Label>
            <Label label="Weapon / attack">
              <TextInput value={s.name} placeholder="club" onChange={(e) => set(i, { ...s, name: e.target.value })} />
            </Label>
            <Label label="Attack bonus">
              <NumberInput value={s.attackBonus} onChange={(attackBonus) => set(i, { ...s, attackBonus })} />
            </Label>
            <Label label="Traits">
              <ListInput
                value={s.traits}
                onChange={(traits) => set(i, { ...s, traits })}
                placeholder="agile, finesse"
              />
            </Label>
            <div className="self-end">
              <Button size="sm" variant="ghost" onClick={() => patch({ strikes: removeAt(strikes, i) })}>
                ✕
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <span className="block text-sm font-medium text-stone-700">Damage</span>
            {s.damage.map((d, j) => (
              <div key={j} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <TextInput
                  value={d.formula}
                  placeholder="1d6+5"
                  onChange={(e) => set(i, { ...s, damage: replaceAt(s.damage, j, { ...d, formula: e.target.value }) })}
                />
                <TextInput
                  value={d.type}
                  placeholder="bludgeoning"
                  onChange={(e) => set(i, { ...s, damage: replaceAt(s.damage, j, { ...d, type: e.target.value }) })}
                />
                <Button size="sm" variant="ghost" onClick={() => set(i, { ...s, damage: removeAt(s.damage, j) })}>
                  ✕
                </Button>
              </div>
            ))}
            <Button size="sm" onClick={() => set(i, { ...s, damage: [...s.damage, { formula: '', type: '' }] })}>
              + Add damage
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Label label="Additional effects" className="col-span-2">
              <TextInput
                value={s.effects ?? ''}
                placeholder="plus Grab"
                onChange={(e) => set(i, { ...s, effects: e.target.value })}
              />
            </Label>
            {s.kind === 'ranged' && (
              <>
                <Label label="Range">
                  <TextInput
                    value={s.range ?? ''}
                    placeholder="range increment 50 feet"
                    onChange={(e) => set(i, { ...s, range: e.target.value })}
                  />
                </Label>
                <Label label="Reload">
                  <TextInput
                    value={s.reload ?? ''}
                    placeholder="1"
                    onChange={(e) => set(i, { ...s, reload: e.target.value })}
                  />
                </Label>
              </>
            )}
          </div>
        </div>
      ))}
      <Button
        size="sm"
        onClick={() =>
          patch({
            strikes: [
              ...strikes,
              {
                id: createId(),
                kind: 'melee',
                name: '',
                attackBonus: 0,
                traits: [],
                damage: [{ formula: '', type: '' }],
              },
            ],
          })
        }
      >
        + Add strike
      </Button>
    </SectionCard>
  );
}
