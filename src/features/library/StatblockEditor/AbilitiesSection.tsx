import { actionCostLabel } from '@/components/ui/ActionCostIcon';
import { Button } from '@/components/ui/Button';
import { Label, ListInput, Select, TextArea, TextInput } from '@/components/ui/Field';
import { createId } from '@/lib/dice';
import { ACTION_COSTS, type Ability, type AbilityCategory, type ActionCost } from '@/types/statblock';
import { countSummary, removeAt, SectionCard, type SectionProps } from './types';

const parseCost = (v: string): ActionCost => (/^[123]$/.test(v) ? (Number(v) as 1 | 2 | 3) : (v as ActionCost));

export const CATEGORY_TITLES: Record<AbilityCategory, string> = {
  interaction: 'Interaction abilities',
  automatic: 'Automatic abilities',
  reactive: 'Reactive abilities',
  offensive: 'Offensive or proactive abilities',
};

export function AbilitiesSection({ sb, patch, category }: SectionProps & { category: AbilityCategory }) {
  const all = sb.abilities;
  const set = (a: Ability) => patch({ abilities: all.map((x) => (x.id === a.id ? a : x)) });
  const mine = all.filter((a) => a.category === category);

  return (
    <SectionCard title={CATEGORY_TITLES[category]} summary={countSummary(mine.length, 'ability')}>
      {mine.map((a) => (
        <div key={a.id} className="space-y-2 rounded border border-stone-200 p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_10rem_1fr_auto]">
            <Label label="Name">
              <TextInput value={a.name} onChange={(e) => set({ ...a, name: e.target.value })} />
            </Label>
            <Label label="Action cost">
              <Select
                value={String(a.actionCost)}
                onChange={(e) => set({ ...a, actionCost: parseCost(e.target.value) })}
              >
                {ACTION_COSTS.map((c) => (
                  <option key={String(c)} value={String(c)}>
                    {actionCostLabel(c)}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Traits">
              <ListInput
                value={a.traits}
                onChange={(traits) => set({ ...a, traits })}
                placeholder="aura, emotion, fear"
              />
            </Label>
            <div className="self-end">
              <Button size="sm" variant="ghost" onClick={() => patch({ abilities: removeAt(all, all.indexOf(a)) })}>
                ✕
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Label label="Frequency">
              <TextInput
                value={a.frequency ?? ''}
                placeholder="once per day"
                onChange={(e) => set({ ...a, frequency: e.target.value })}
              />
            </Label>
            <Label label="Trigger">
              <TextInput value={a.trigger ?? ''} onChange={(e) => set({ ...a, trigger: e.target.value })} />
            </Label>
            <Label label="Requirements">
              <TextInput value={a.requirements ?? ''} onChange={(e) => set({ ...a, requirements: e.target.value })} />
            </Label>
          </div>
          <Label label="Effect / description">
            <TextArea value={a.description} onChange={(e) => set({ ...a, description: e.target.value })} />
          </Label>
        </div>
      ))}
      <Button
        size="sm"
        onClick={() =>
          patch({
            abilities: [
              ...all,
              {
                id: createId(),
                category,
                name: '',
                actionCost: category === 'reactive' ? 'reaction' : category === 'offensive' ? 1 : 'passive',
                traits: [],
                description: '',
              },
            ],
          })
        }
      >
        + Add ability
      </Button>
    </SectionCard>
  );
}
