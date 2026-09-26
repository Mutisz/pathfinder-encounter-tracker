import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useLibraryEntries, useLibraryStore } from '@/store/libraryStore';
import type { EntryKind, LibraryEntry } from '@/types/library';

export function LibraryPage() {
  const entries = useLibraryEntries();
  const createEntry = useLibraryStore((s) => s.createEntry);
  const duplicateEntry = useLibraryStore((s) => s.duplicateEntry);
  const deleteEntry = useLibraryStore((s) => s.deleteEntry);
  const navigate = useNavigate();
  const [kind, setKind] = useState<EntryKind>('npc');
  const [toDelete, setToDelete] = useState<LibraryEntry | null>(null);

  const shown = entries.filter((e) => e.kind === kind);

  const onCreate = () => {
    const entry = createEntry(kind);
    navigate(`/library/${entry.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded bg-stone-200 p-0.5">
          {(['npc', 'player'] as EntryKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`cursor-pointer rounded px-3 py-1 text-sm font-medium ${kind === k ? 'bg-white shadow' : ''}`}
            >
              {k === 'npc' ? 'NPCs' : 'Players'}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={onCreate}>
          New {kind === 'npc' ? 'NPC' : 'player'}
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded border border-dashed border-stone-300 p-6 text-center text-stone-500">
          No {kind === 'npc' ? 'NPCs' : 'players'} yet. Create one to use it in encounters.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded border border-stone-200 bg-white">
          {shown.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <Link to={`/library/${e.id}`} className="grow font-medium hover:underline">
                {e.statblock.name || '(unnamed)'}
                <span className="ml-2 text-sm font-normal text-stone-500">
                  Level {e.statblock.level} · HP {e.kind === 'player' ? `${e.currentHp}/` : ''}
                  {e.statblock.hp.max} · Perception {e.statblock.perception.modifier >= 0 ? '+' : ''}
                  {e.statblock.perception.modifier}
                </span>
              </Link>
              <Button size="sm" onClick={() => duplicateEntry(e.id)}>
                Duplicate
              </Button>
              <Button size="sm" variant="danger" onClick={() => setToDelete(e)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={toDelete !== null}
        title="Delete entry?"
        onClose={() => setToDelete(null)}
        actions={
          <>
            <Button onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) deleteEntry(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          <strong>{toDelete?.statblock.name}</strong> will be removed from the library. Encounters keep their own copy.
        </p>
      </Dialog>
    </div>
  );
}
