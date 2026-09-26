import { Button } from '@/components/ui/Button';
import { NumberInput, TextInput } from '@/components/ui/Field';
import type { Modifier } from '@/types/statblock';
import { removeAt, replaceAt } from './types';

interface Props {
  value: Modifier[];
  onChange: (v: Modifier[]) => void;
  /** Placeholder for the condition column. */
  placeholder?: string;
  addLabel?: string;
}

/** Ordered list of condition -> modifier pairs (AC/save bonuses, skill action modifiers). */
export function ModifierListEditor({ value, onChange, placeholder = 'condition', addLabel = '+ Add modifier' }: Props) {
  return (
    <div className="space-y-1">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_6rem_auto] gap-2 text-xs font-medium text-stone-500">
          <span>Condition</span>
          <span>Modifier</span>
          <span />
        </div>
      )}
      {value.map((m, i) => (
        <div key={i} className="grid grid-cols-[1fr_6rem_auto] gap-2">
          <TextInput
            value={m.condition}
            placeholder={placeholder}
            onChange={(e) => onChange(replaceAt(value, i, { ...m, condition: e.target.value }))}
          />
          <NumberInput value={m.modifier} onChange={(modifier) => onChange(replaceAt(value, i, { ...m, modifier }))} />
          <Button size="sm" variant="ghost" onClick={() => onChange(removeAt(value, i))}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...value, { condition: '', modifier: 0 }])}>
        {addLabel}
      </Button>
    </div>
  );
}
