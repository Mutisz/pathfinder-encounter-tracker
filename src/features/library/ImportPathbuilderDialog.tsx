import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label, TextArea, TextInput } from '@/components/ui/Field';
import { findImportMatch, importPathbuilder, parsePathbuilderJson, type PathbuilderImport } from '@/lib/pathbuilder';
import { fetchPathbuilderExport, PATHBUILDER_ID } from '@/lib/pathbuilderFetch';
import { formatModifier } from '@/lib/statblock';
import { useLibraryEntries, useLibraryStore } from '@/store/libraryStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (entryId: string) => void;
}

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function ImportPathbuilderDialog({ open, onClose, onImported }: Props) {
  const entries = useLibraryEntries();
  const importPlayer = useLibraryStore((s) => s.importPlayer);
  const [exportId, setExportId] = useState('');
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PathbuilderImport | null>(null);
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);

  // The native <dialog> keeps its children mounted, so clear everything on close.
  const close = () => {
    setExportId('');
    setPasted('');
    setBusy(false);
    setError(null);
    setResult(null);
    setSourceId(undefined);
    onClose();
  };

  const fetchById = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchPathbuilderExport(exportId.trim());
      setResult(importPathbuilder(data));
      setSourceId(exportId.trim());
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const parsePasted = () => {
    setError(null);
    try {
      setResult(importPathbuilder(parsePathbuilderJson(pasted)));
      setSourceId(undefined);
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPasted(await file.text());
  };

  const match = result ? findImportMatch(entries, result.statblock.name, sourceId) : undefined;

  const save = (existingId?: string) => {
    if (!result) return;
    const entry = importPlayer(
      result.statblock,
      { kind: 'pathbuilder', id: sourceId, importedAt: Date.now() },
      existingId,
    );
    close();
    onImported(entry.id);
  };

  const sb = result?.statblock;

  return (
    <Dialog
      open={open}
      title="Import from Pathbuilder"
      onClose={close}
      wide
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          {result && match ? (
            <>
              <Button onClick={() => save()}>Create new</Button>
              <Button variant="primary" onClick={() => save(match.id)}>
                Update {match.statblock.name}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => save()} disabled={!result}>
              Import
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <Label label="Pathbuilder export ID" className="grow">
          <TextInput
            value={exportId}
            inputMode="numeric"
            placeholder="e.g. 422753"
            onChange={(e) => setExportId(e.target.value)}
          />
        </Label>
        <Button variant="primary" onClick={fetchById} disabled={busy || !PATHBUILDER_ID.test(exportId.trim())}>
          {busy ? 'Fetching…' : 'Fetch'}
        </Button>
      </div>
      <p className="text-sm text-stone-600">
        In Pathbuilder: menu → <em>Export JSON</em>, then enter the ID it shows. If the fetch is blocked, paste the JSON
        below.
      </p>

      <Label label="…or paste the exported JSON">
        <TextArea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder='{"success": true, "build": { ... }}'
          className="font-mono text-xs"
        />
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".json,application/json"
          className="text-sm"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button onClick={parsePasted} disabled={pasted.trim() === ''}>
          Parse
        </Button>
      </div>

      {error && <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      {result && sb && (
        <div className="space-y-2 rounded border border-stone-200 bg-stone-50 p-3">
          <h3 className="font-semibold">
            {result.summary.name}{' '}
            <span className="font-normal text-stone-600">
              — {result.summary.ancestry}
              {result.summary.heritage ? ` (${result.summary.heritage})` : ''} {result.summary.class}, level{' '}
              {result.summary.level}
            </span>
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
            <dt className="text-stone-600">HP</dt>
            <dd>{sb.hp.max}</dd>
            <dt className="text-stone-600">AC</dt>
            <dd>{sb.ac.value}</dd>
            <dt className="text-stone-600">Perception</dt>
            <dd>{formatModifier(sb.perception.modifier)}</dd>
            <dt className="text-stone-600">Saves</dt>
            <dd>
              Fort {formatModifier(sb.saves.fortitude.value)}, Ref {formatModifier(sb.saves.reflex.value)}, Will{' '}
              {formatModifier(sb.saves.will.value)}
            </dd>
            <dt className="text-stone-600">Skills</dt>
            <dd>{sb.skills.map((s) => `${s.name} ${formatModifier(s.modifier)}`).join(', ') || '—'}</dd>
            <dt className="text-stone-600">Strikes</dt>
            <dd>{sb.strikes.map((s) => `${s.name} ${formatModifier(s.attackBonus)}`).join(', ') || '—'}</dd>
            <dt className="text-stone-600">Spellcasting</dt>
            <dd>{sb.spellcasting.map((s) => `${s.name} DC ${s.dc}`).join(', ') || '—'}</dd>
            <dt className="text-stone-600">Abilities</dt>
            <dd>{sb.abilities.length} feats and features</dd>
          </dl>
          {match && (
            <p className="text-sm">
              A player named <strong>{match.statblock.name}</strong> already exists. Updating keeps its library id (and
              its place in future encounters); creating new leaves both.
            </p>
          )}
          {result.warnings.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-stone-600">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}
