import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextInput } from '@/components/ui/Field';
import { useEncounterList, useEncounterStore } from '@/store/encounterStore';
import { useLibraryEntries } from '@/store/libraryStore';
import type { Encounter } from '@/types/encounter';

const statusLabel: Record<Encounter['status'], string> = { setup: 'Setup', running: 'Running', ended: 'Ended' };
const statusClass: Record<Encounter['status'], string> = {
  setup: 'bg-stone-200 text-stone-700',
  running: 'bg-green-100 text-green-800',
  ended: 'bg-stone-100 text-stone-500',
};

export function EncounterListPage() {
  const encounters = useEncounterList();
  const create = useEncounterStore((s) => s.create);
  const remove = useEncounterStore((s) => s.remove);
  const entries = useLibraryEntries();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [toDelete, setToDelete] = useState<Encounter | null>(null);

  const players = entries.filter((e) => e.kind === 'player');

  const onCreate = () => {
    const enc = create(name.trim() || `Encounter ${encounters.length + 1}`, players);
    setName('');
    navigate(`/encounters/${enc.id}`);
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate();
        }}
      >
        <label className="block grow text-sm">
          <span className="mb-0.5 block font-medium text-stone-700">New encounter</span>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ambush at the bridge" />
        </label>
        <Button type="submit" variant="primary">
          Create
        </Button>
        <span className="w-full text-sm text-stone-500">
          {players.length === 0
            ? 'No players in the library yet; they are added to new encounters automatically.'
            : `${players.length} player${players.length === 1 ? '' : 's'} will be added automatically.`}
        </span>
      </form>

      {encounters.length === 0 ? (
        <p className="rounded border border-dashed border-stone-300 p-6 text-center text-stone-500">
          No encounters yet.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded border border-stone-200 bg-white">
          {encounters.map((enc) => (
            <li key={enc.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <Link to={`/encounters/${enc.id}`} className="grow font-medium hover:underline">
                {enc.name}
              </Link>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusClass[enc.status]}`}>
                {statusLabel[enc.status]}
                {enc.status === 'running' && ` · round ${enc.round}`}
              </span>
              <span className="text-sm text-stone-500">{Object.keys(enc.participants).length} participants</span>
              <Button size="sm" variant="danger" onClick={() => setToDelete(enc)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={toDelete !== null}
        title="Delete encounter?"
        onClose={() => setToDelete(null)}
        actions={
          <>
            <Button onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) remove(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          <strong>{toDelete?.name}</strong> and its summary will be deleted permanently.
        </p>
      </Dialog>
    </div>
  );
}
