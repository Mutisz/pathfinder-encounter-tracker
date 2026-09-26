import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label, NumberInput, Select } from '@/components/ui/Field';
import { useLibraryEntries } from '@/store/libraryStore';
import type { LibraryEntry } from '@/types/library';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: LibraryEntry, count: number, batch: boolean) => void;
}

export function AddNpcDialog({ open, onClose, onAdd }: Props) {
  const npcs = useLibraryEntries().filter((e) => e.kind === 'npc');
  const [entryId, setEntryId] = useState('');
  const [count, setCount] = useState(1);
  const [batch, setBatch] = useState(true);

  const selected = npcs.find((e) => e.id === entryId) ?? npcs[0];

  const submit = () => {
    if (!selected) return;
    onAdd(selected, Math.max(1, count), batch);
    onClose();
  };

  return (
    <Dialog
      open={open}
      title="Add NPCs"
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!selected}>
            Add
          </Button>
        </>
      }
    >
      {npcs.length === 0 ? (
        <p className="text-stone-600">No NPCs in the library. Create some first.</p>
      ) : (
        <>
          <Label label="NPC">
            <Select value={selected?.id ?? ''} onChange={(e) => setEntryId(e.target.value)}>
              {npcs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.statblock.name} (level {e.statblock.level})
                </option>
              ))}
            </Select>
          </Label>
          <Label label="Number">
            <NumberInput value={count} min={1} onChange={setCount} />
          </Label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} disabled={count < 2} />
            Batch initiative (all copies share one roll)
          </label>
        </>
      )}
    </Dialog>
  );
}
