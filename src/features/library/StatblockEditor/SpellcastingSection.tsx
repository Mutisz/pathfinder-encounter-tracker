import { Button } from '@/components/ui/Button';
import { Label, NumberInput, Select, TextInput } from '@/components/ui/Field';
import { createId } from '@/lib/dice';
import {
  SPELLCASTING_KINDS,
  TRADITIONS,
  type SpellRank,
  type Spellcasting,
  type SpellcastingKind,
  type Tradition,
} from '@/types/statblock';
import { removeAt, replaceAt, SectionCard, type SectionProps } from './types';

const rankLabel = (r: number) => (r === 0 ? 'Cantrips' : `Rank ${r}`);

function RankList({
  ranks,
  onChange,
  showSlots,
  title,
}: {
  ranks: SpellRank[];
  onChange: (r: SpellRank[]) => void;
  showSlots: boolean;
  title: string;
}) {
  const setRank = (i: number, r: SpellRank) => onChange(replaceAt(ranks, i, r));
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-stone-700">{title}</span>
      {ranks.map((r, i) => (
        <div key={i} className="space-y-1 rounded bg-stone-50 p-2">
          <div className="grid grid-cols-[6rem_6rem_1fr_auto] items-end gap-2">
            <Label label="Rank">
              <NumberInput
                value={r.rank}
                min={0}
                max={10}
                onChange={(rank) => setRank(i, { ...r, rank: Math.max(0, Math.min(10, rank)) })}
              />
            </Label>
            {showSlots ? (
              <Label label="Slots">
                <NumberInput value={r.slots ?? 0} onChange={(slots) => setRank(i, { ...r, slots })} />
              </Label>
            ) : (
              <span />
            )}
            <span className="pb-1 text-sm text-stone-500">{rankLabel(r.rank)}</span>
            <Button size="sm" variant="ghost" onClick={() => onChange(removeAt(ranks, i))}>
              ✕
            </Button>
          </div>
          {r.spells.map((sp, j) => (
            <div key={j} className="grid grid-cols-[1fr_6rem_1fr_auto] gap-2">
              <TextInput
                value={sp.name}
                placeholder="heal"
                onChange={(e) => setRank(i, { ...r, spells: replaceAt(r.spells, j, { ...sp, name: e.target.value }) })}
              />
              <TextInput
                value={sp.uses ?? ''}
                placeholder="×2 / at will"
                onChange={(e) => setRank(i, { ...r, spells: replaceAt(r.spells, j, { ...sp, uses: e.target.value }) })}
              />
              <TextInput
                value={sp.notes ?? ''}
                placeholder="notes"
                onChange={(e) => setRank(i, { ...r, spells: replaceAt(r.spells, j, { ...sp, notes: e.target.value }) })}
              />
              <Button size="sm" variant="ghost" onClick={() => setRank(i, { ...r, spells: removeAt(r.spells, j) })}>
                ✕
              </Button>
            </div>
          ))}
          <Button size="sm" onClick={() => setRank(i, { ...r, spells: [...r.spells, { name: '' }] })}>
            + Add spell
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        onClick={() =>
          onChange([...ranks, { rank: ranks.length ? Math.max(...ranks.map((x) => x.rank)) + 1 : 1, spells: [] }])
        }
      >
        + Add rank
      </Button>
    </div>
  );
}

export function SpellcastingSection({ sb, patch }: SectionProps) {
  const list = sb.spellcasting;
  const set = (i: number, s: Spellcasting) => patch({ spellcasting: replaceAt(list, i, s) });

  return (
    <SectionCard title="Spells">
      {list.map((s, i) => (
        <div key={s.id} className="space-y-3 rounded border border-stone-200 p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_8rem_8rem_5rem_5rem_5rem_auto]">
            <Label label="Entry name">
              <TextInput
                value={s.name}
                placeholder="Divine Prepared Spells"
                onChange={(e) => set(i, { ...s, name: e.target.value })}
              />
            </Label>
            <Label label="Tradition">
              <Select value={s.tradition} onChange={(e) => set(i, { ...s, tradition: e.target.value as Tradition })}>
                {TRADITIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Kind">
              <Select value={s.kind} onChange={(e) => set(i, { ...s, kind: e.target.value as SpellcastingKind })}>
                {SPELLCASTING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="DC">
              <NumberInput value={s.dc} onChange={(dc) => set(i, { ...s, dc })} />
            </Label>
            <Label label="Attack">
              <NumberInput value={s.attack ?? 0} onChange={(attack) => set(i, { ...s, attack })} />
            </Label>
            {s.kind === 'focus' ? (
              <Label label="Focus pts">
                <NumberInput value={s.focusPoints ?? 1} onChange={(focusPoints) => set(i, { ...s, focusPoints })} />
              </Label>
            ) : (
              <span />
            )}
            <div className="self-end">
              <Button size="sm" variant="ghost" onClick={() => patch({ spellcasting: removeAt(list, i) })}>
                ✕
              </Button>
            </div>
          </div>
          <RankList
            title="Spells by rank"
            ranks={s.ranks}
            showSlots={s.kind === 'spontaneous'}
            onChange={(ranks) => set(i, { ...s, ranks })}
          />
          <RankList
            title="Constant"
            ranks={s.constant}
            showSlots={false}
            onChange={(constant) => set(i, { ...s, constant })}
          />
        </div>
      ))}
      <Button
        size="sm"
        onClick={() =>
          patch({
            spellcasting: [
              ...list,
              {
                id: createId(),
                name: '',
                tradition: 'arcane',
                kind: 'prepared',
                dc: 10,
                ranks: [{ rank: 0, spells: [] }],
                constant: [],
              },
            ],
          })
        }
      >
        + Add spellcasting entry
      </Button>
    </SectionCard>
  );
}
